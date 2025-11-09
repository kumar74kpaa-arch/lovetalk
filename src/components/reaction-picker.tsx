"use client";

import { Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

type ReactionPickerProps = {
  onSelect: (emoji: string) => void;
};

const reactions = ['❤️', '🥰', '😘', '✨', '💖', '😍'];

export default function ReactionPicker({ onSelect }: ReactionPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full">
          <Smile className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-2">
          {reactions.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              className="text-2xl"
              onClick={() => onSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
