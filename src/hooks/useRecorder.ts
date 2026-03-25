import { useState, useRef } from 'react';

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);

  const startRecording = async (): Promise<string> => {
    if (isRecordingRef.current) return "";
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Try to find a supported mime type
      let mimeType = '';
      const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      return new Promise((resolve) => {
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: recorder.mimeType });
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          const blobUrl = URL.createObjectURL(blob);
          resolve(blobUrl);
        };

        recorder.start(200);
        mediaRecorderRef.current = recorder;
        isRecordingRef.current = true;
        setIsRecording(true);
      });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      isRecordingRef.current = false;
      return "";
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const playAudio = (url: string) => {
    if (!url) return;
    try {
      const audio = new Audio();
      audio.src = url;
      audio.load();
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
