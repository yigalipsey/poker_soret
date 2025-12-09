"use client";

import { useRef, useState, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  intensity?: number;
  glowColor?: string;
}

export function TiltCard({
  children,
  className,
  intensity = 15,
  glowColor = "rgba(255, 255, 255, 0.1)",
  ...props
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowX, setGlowX] = useState(50);
  const [glowY, setGlowY] = useState(50);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top; // y position within the element

    // Calculate rotation
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateYVal = ((x - centerX) / centerX) * intensity;
    const rotateXVal = ((centerY - y) / centerY) * intensity;

    // Calculate glow position (percentage)
    const glowXVal = (x / rect.width) * 100;
    const glowYVal = (y / rect.height) * 100;

    setRotateX(rotateXVal);
    setRotateY(rotateYVal);
    setGlowX(glowXVal);
    setGlowY(glowYVal);
  };

  const handleMouseEnter = () => setIsHovering(true);

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative transition-all duration-200 ease-out transform-gpu perspective-1000",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovering
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      }}
      {...props}
    >
      {children}

      {/* Dynamic Glow Effect */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300 z-20 mix-blend-overlay"
        style={{
          background: isHovering
            ? `radial-gradient(circle at ${glowX}% ${glowY}%, ${glowColor}, transparent 80%)`
            : "",
          opacity: isHovering ? 1 : 0,
        }}
      />
    </div>
  );
}
