"use client";
import React, { useEffect, useState } from 'react';

const petals = ['🌸', '🌺', '🌹', '🌷', '💖'];

const FloatingPetals = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const petalElements = Array.from({ length: 15 }).map((_, i) => {
    const style: React.CSSProperties = {
      left: `${Math.random() * 100}vw`,
      animationDuration: `${Math.random() * 5 + 10}s`,
      animationDelay: `${Math.random() * 10}s`,
      fontSize: `${Math.random() * 1.5 + 0.75}rem`
    };
    return (
      <div key={i} className="petal" style={style}>
        {petals[Math.floor(Math.random() * petals.length)]}
      </div>
    );
  });

  return <>{petalElements}</>;
};

export default FloatingPetals;
