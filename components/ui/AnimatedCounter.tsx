"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1500,
  prefix = "",
  suffix = "",
  className,
  decimals = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const isInViewRef = useRef(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          isInViewRef.current = true;
          startAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const startAnimation = () => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);

      // Easing function: easeOutQuart
      const ease = 1 - Math.pow(1 - percentage, 4);

      const current =
        startValueRef.current + (value - startValueRef.current) * ease;

      setDisplayValue(current);

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    // If value updates after initial load
    if (isInViewRef.current) {
      startValueRef.current = displayValue;
      startTimeRef.current = null;
      startAnimation();
    }
  }, [value]);

  return (
    <span ref={elementRef} className={cn("tabular-nums", className)}>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}


