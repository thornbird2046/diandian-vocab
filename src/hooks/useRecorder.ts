import { useState, useRef } from 'react';

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async (): Promise<string> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      return new Promise((resolve) => {
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const blobUrl = URL.createObjectURL(blob);
          resolve(blobUrl);
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      return "";
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current = null;
    }
  };

  const playAudio = (url: string) => {
    if (!url) return;
    try {
      const audio = new Audio(url);
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(err => {
        console.error("Audio playback failed:", err);
        setIsPlayingAudio(false);
      });
    } catch (err) {
      console.error("Error playing audio:", err);
      setIsPlayingAudio(false);
    }
  };

  return { isRecording, isPlayingAudio, startRecording, stopRecording, playAudio };
}
