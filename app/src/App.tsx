import { useRef, useState } from 'react';

function App() {
  // videoRefにHTMLVideoElementを指定
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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

  const handleDataAvailable = async (event: { data: Blob }) => {
    if (event.data.size > 0) {
      await sendDataToServer(event.data);
    }
  };

  const sendDataToServer = async (blob: Blob) => {
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
      <video ref={videoRef} autoPlay playsInline muted />
    </div>
  );
}

export default App;

