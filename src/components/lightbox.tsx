"use client";

import Image from 'next/image';
import { X } from 'lucide-react';

type LightboxProps = {
  imageUrl: string;
  onClose: () => void;
};

export default function Lightbox({ imageUrl, onClose }: LightboxProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
        <Image 
          src={imageUrl} 
          alt="Lightbox" 
          layout="fill"
          objectFit="contain"
        />
      </div>
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
      >
        <X size={32} />
      </button>
    </div>
  );
}
