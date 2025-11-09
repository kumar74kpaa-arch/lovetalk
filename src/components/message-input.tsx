"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Film, Heart, Mic, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';

type MessageInputProps = {
  onSendMessage: (text: string) => void;
  onSendVoice: (blob: Blob) => void;
  onSendFile: (file: File) => void;
};

export default function MessageInput({ onSendMessage, onSendVoice, onSendFile }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text);
      setText('');
      setShowHeartAnimation(true);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            onSendVoice(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser settings to send voice notes.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && isRecording) {
      if (cancel) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } else {
          mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };
  
  const handleMicPress = () => {
      startRecording();
  };

  const handleMicRelease = () => {
      stopRecording(false);
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSendFile(file);
    }
    // Reset file input
    if(fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const triggerImageInput = () => {
    if (fileInputRef.current) {
        fileInputRef.current.accept = "image/*";
        fileInputRef.current.click();
    }
  }

  const triggerVideoInput = () => {
    if (fileInputRef.current) {
        fileInputRef.current.accept = "video/*";
        fileInputRef.current.click();
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  useEffect(() => {
    if (showHeartAnimation) {
      const timer = setTimeout(() => setShowHeartAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [showHeartAnimation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  return (
    <div className="p-4 border-t border-white/20 shrink-0 backdrop-blur-sm bg-background/30 sticky bottom-0">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
      <div className="flex items-end gap-2 relative">
        {isRecording ? (
          <div className="w-full flex items-center justify-center bg-transparent p-2 rounded-full">
            <div className="flex items-center gap-2 text-accent">
                <Heart className="text-accent heart-pulse cursor-pointer" size={24} onClick={() => stopRecording(false)} />
                <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
            </div>
          </div>
        ) : (
          <>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="resize-none bg-card rounded-2xl max-h-32"
              rows={1}
              onKeyDown={handleKeyDown}
            />
            <div className="flex items-center gap-2">
              {text ? (
                <Button onClick={handleSend} size="icon" className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shrink-0">
                    <Send className="text-primary-foreground" />
                </Button>
              ) : (
                <>
                  <Button onClick={triggerImageInput} size="icon" variant="ghost" className="rounded-full w-10 h-10 shrink-0">
                    <Camera className="text-primary" />
                  </Button>
                   <Button onClick={triggerVideoInput} size="icon" variant="ghost" className="rounded-full w-10 h-10 shrink-0">
                    <Film className="text-primary" />
                  </Button>
                  <Button 
                      onMouseDown={handleMicPress}
                      onMouseUp={handleMicRelease}
                      onTouchStart={handleMicPress}
                      onTouchEnd={handleMicRelease}
                      size="icon" 
                      className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shrink-0"
                  >
                      <Mic className="text-primary-foreground" />
                  </Button>
                </>
              )}
              {showHeartAnimation && (
                <div className="heart-send-animation text-accent">
                  <Heart size={30} fill="currentColor" />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
