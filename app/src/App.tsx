import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(
    null
  );

  // AudioContextの参照を保持
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 予測結果の状態管理
  const [predictedSign, setPredictedSign] = useState<{
    sign: string;
    probability: number;
  } | null>(null);

  const [word, setWord] = useState<string>("");

  const lastPredictionTimeRef = useRef<number>(0);

  const requestsPerSecond = 2;
  const requestInterval = 1000 / requestsPerSecond;

  const lastSignRef = useRef<string | null>(null); // 前回の指文字を保持

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
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          video.srcObject = stream;
          video.play();
        } catch (error) {
          console.error("Error accessing the camera:", error);
        }
      }
    };

    startCamera();
  }, []);

  const handleEnableAudio = async () => {
    if (!audioCtxRef.current) {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      // 空の音声バッファを使用してAudioContextを起動
      const emptySource = audioCtx.createBufferSource();
      emptySource.buffer = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
      emptySource.connect(audioCtx.destination);
      emptySource.start();
      emptySource.stop();
    }

    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
  };

  // 初期化用のuseEffect（AudioContextとSpeechSynthesisのセットアップ）
  useEffect(() => {
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;

    const initAudioContext = async () => {
      window.removeEventListener("touchstart", initAudioContext);
      window.removeEventListener("click", initAudioContext);

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      // SpeechSynthesisを初期化
      const utterance = new SpeechSynthesisUtterance("準備完了");
      window.speechSynthesis.speak(utterance);
    };

    window.addEventListener("touchstart", initAudioContext);
    window.addEventListener("click", initAudioContext);

    return () => {
      window.removeEventListener("touchstart", initAudioContext);
      window.removeEventListener("click", initAudioContext);
    };
  }, []);

  // ランドマークをCanvasに描画する関数
  const drawLandmarks = (landmarks: NormalizedLandmark[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#FF0000";
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;

        landmarks.forEach((landmark) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        });
      }
    }
  };

  const renderLoop = useCallback(async () => {
    const video = videoRef.current;
    if (video && handLandmarker) {
      const startTimeMs = performance.now();
      if (video.currentTime > 0) {
        const results = await handLandmarker.detectForVideo(video, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          drawLandmarks(results.landmarks.flat());
          const normalizedData = normalizeData(results.landmarks.flat());

          if (
            performance.now() - lastPredictionTimeRef.current >
            requestInterval
          ) {
            lastPredictionTimeRef.current = performance.now();
            postNormalizedData(normalizedData);
          }
        }
      }

      requestAnimationFrame(renderLoop);
    }
  }, [handLandmarker, requestInterval]);

  const normalizeData = (data: NormalizedLandmark[]): number[][] => {
    let x = 0;
    let y = 0;
    let z = 0;
    let max = -1;
    const coordinates: number[][] = [];

    data.forEach((d, i) => {
      if (i === 0) {
        x = d.x;
        y = d.y;
        z = d.z;
      } else {
        const t = (d.x - x) ** 2 + (d.y - y) ** 2 + (d.z - z) ** 2;
        max = Math.max(max, t);
        coordinates.push([d.x - x, d.y - y, d.z - z]);
      }
    });

    if (max <= 0) return coordinates;

    const normalizedCoordinates = coordinates.map((d) =>
      d.map((v) => v / Math.sqrt(max))
    );

    return normalizedCoordinates;
  };

  const wordDict: Record<string, string> = {
    さき: "先",
    かき: "柿",
    かさ: "傘",
    さけ: "酒",
    あさ: "朝",
    くさ: "草",
    くせ: "癖",
    さお: "竿",
  };

  const speakSign = (sign: string) => {
    const utterance = new SpeechSynthesisUtterance(sign);
    window.speechSynthesis.speak(utterance);
  };

  const postNormalizedData = async (data: number[][]) => {
    try {
      const dataToSend = { landmark: data };
      const response = await fetch("https://tk-2423.onrender.com/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const result = await response.json();

      const predictions = result.prediction[0];
      const maxProbability = Math.max(...predictions);
      const maxIndex = predictions.indexOf(maxProbability);

      const signs = [
        "あ",
        "い",
        "う",
        "え",
        "お",
        "か",
        "き",
        "く",
        "け",
        "こ",
        "さ",
        "し",
        "す",
        "せ",
        "そ",
        "た",
        "ち",
        "つ",
        "て",
        "と",
        "な",
        "に",
        "ぬ",
        "ね",
        "は",
        "ひ",
        "ふ",
        "へ",
        "ほ",
        "ま",
        "み",
        "む",
        "め",
        "や",
        "ゆ",
        "よ",
        "ら",
        "る",
        "れ",
        "ろ",
        "わ",
      ];

      if (maxProbability > 0.5) {
        const newSign = signs[maxIndex];
        setPredictedSign({
          sign: newSign,
          probability: maxProbability,
        });
        const combinedSign =
          (lastSignRef.current ? lastSignRef.current : "") + newSign;

        speakSign(newSign);

        if (wordDict[combinedSign]) {
          setWord(wordDict[combinedSign]);
          lastSignRef.current = null;
        } else {
          lastSignRef.current = combinedSign;
        }
      } else {
        setPredictedSign(null);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    renderLoop();
  }, [renderLoop]);

  return (
    <div>
      <video ref={videoRef} playsInline />
      <canvas ref={canvasRef} />
      {predictedSign && (
        <div>
          <h3>
            予測された指文字: {predictedSign.sign} (確率:{" "}
            {(predictedSign.probability * 100).toFixed(2)}%)
          </h3>
          <h3>単語: {word}</h3>
        </div>
      )}
      <button onClick={handleEnableAudio}>音声を有効にする</button>
    </div>
  );
};

export default App;
