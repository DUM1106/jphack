import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HandLandmarker, FilesetResolver, NormalizedLandmark } from "@mediapipe/tasks-vision";


const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);

  useEffect(() => {
    const initializeHandLandmarker = async () => {
      // Mediapipe用のWASMファイルのURLを指定
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      // HandLandmarkerのインスタンスを作成
      const handLandmarkerInstance = await HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: "/hand_landmarker.task", // publicフォルダにhand_landmarker.taskを配置
            delegate: "GPU",
          },
          numHands: 2,
        }
      );

      // 動画モードでHandLandmarkerを設定
      await handLandmarkerInstance.setOptions({ runningMode: "VIDEO" });
      setHandLandmarker(handLandmarkerInstance);
    };

    initializeHandLandmarker();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      const video = videoRef.current;
      if (video && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          video.srcObject = stream;
          video.play();
        } catch (error) {
          console.error("Error accessing the camera:", error);
        }
      }
    };

    startCamera();
  }, []);

  // ランドマークデータをバックエンドに送信する関数
  const sendLandmarkData = async (landmarks: NormalizedLandmark[]) => {
    try {
      await fetch('/api/landmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ landmarks }),
      });
    } catch (error) {
      console.error("エラーが発生しました:", error);
    }
  };

  const renderLoop = useCallback(async () => {
    const video = videoRef.current;
    if (video && handLandmarker) {
      const startTimeMs = performance.now();
      if (video.currentTime > 0) {
        const results = await handLandmarker.detectForVideo(video, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          // ランドマークデータを取得して送信
          await sendLandmarkData(results.landmarks.flat());
        }
      }

      requestAnimationFrame(renderLoop);
    }
  }, [handLandmarker]);

  useEffect(() => {
    const interval = setInterval(() => {
      renderLoop();
    }, 1000); // 1秒ごとにデータを送信

    return () => clearInterval(interval);
  }, [handLandmarker, renderLoop]);

  return (
    <div>
      {/* カメラ映像を表示するためのvideoタグ */}
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "auto" }} />
      <h1>Hand Landmark Detection</h1>
    </div>
  );
};

export default App;


