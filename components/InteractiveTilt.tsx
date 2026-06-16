'use client';

import { useState, ReactNode, MouseEvent } from 'react';

interface InteractiveTiltProps {
  children: ReactNode;
  className?: string;
}

export default function InteractiveTilt({ children, className = '' }: InteractiveTiltProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - card.left) / card.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - card.top) / card.height - 0.5; // -0.5 to 0.5
    setTilt({ x: x * 6, y: y * -6 }); // subtle 3D tilt
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${className} transition-all duration-200 ease-out`}
      style={{
        transform: isHovered 
          ? `perspective(1200px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateZ(4px)` 
          : 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  );
}
