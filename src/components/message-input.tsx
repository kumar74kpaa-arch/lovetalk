"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Heart, Mic, Send, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type MessageInputProps = {
  onSendMessage: (text: string) => void;
  onSendVoice: (blob: Blob) => void;
};

export default function MessageInput({ onSendMessage, onSendVoice }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
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
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        onSendVoice(audioBlob);
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        setRecordingTime(0);
    }
  };

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
      <div className="flex items-end gap-2 relative">
        {isRecording ? (
          <div className="w-full flex items-center justify-between bg-card p-2 rounded-full">
            <Button variant="ghost" size="icon" className="text-destructive" onClick={cancelRecording}>
                <Trash2 size={24} />
            </Button>
            <div className="flex items-center gap-2">
                <Heart className="text-accent heart-pulse" size={20} />
                <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
            </div>
            <Button variant="ghost" size="icon" className="bg-accent rounded-full h-12 w-12" onClick={stopRecording}>
              <Send className="text-accent-foreground" />
            </Button>
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
            <div className="relative">
              <Button onClick={text ? handleSend : startRecording} size="icon" className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shrink-0">
                {text ? (
                    <Send className="text-primary-foreground" />
                ) : (
                    <Mic className="text-primary-foreground" />
                )}
              </Button>
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
