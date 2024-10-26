import { useCallback, useRef, useState } from "react";
import { ReactMediaRecorder } from 'react-media-recorder';


function App() {
  const videoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startCamera = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = stream;
          setMediaStream(stream);
      } catch (error) {
          console.error("Error accessing camera:", error);
      }
  };

  const startRecording = () => {
      if (mediaStream) {
          const recorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });

          recorder.ondataavailable = handleDataAvailable;
          recorder.start(1000); // 1秒ごとにデータを区切る
          setMediaRecorder(recorder);
      }
  };

  const handleDataAvailable = async (event) => {
      if (event.data.size > 0) {
          await sendDataToServer(event.data);
      }
  };

  const sendDataToServer = async (blob) => {
      const formData = new FormData();
      formData.append('video', blob, 'recording.webm');

      await fetch('/api/upload', {
          method: 'POST',
          body: formData,
      });
  };

  const stopRecording = () => {
      if (mediaRecorder) {
          mediaRecorder.stop();
      }
  };

  return (
      <div>
          <button onClick={startCamera}>Start Camera</button>
          <button onClick={startRecording}>Start Recording</button>
          <button onClick={stopRecording}>Stop Recording</button>
          <video ref={videoRef} autoPlay muted />
      </div>
  );
}

export default App
