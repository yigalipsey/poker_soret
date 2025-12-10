"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Image from "next/image";

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const colors = [
  "bg-red-100",
  "bg-orange-100",
  "bg-amber-100",
  "bg-yellow-100",
  "bg-lime-100",
  "bg-green-100",
  "bg-emerald-100",
  "bg-teal-100",
  "bg-cyan-100",
  "bg-sky-100",
  "bg-blue-100",
  "bg-indigo-100",
  "bg-violet-100",
  "bg-purple-100",
  "bg-fuchsia-100",
  "bg-pink-100",
  "bg-rose-100",
];

export function Avatar({
  name,
  imageUrl,
  size = "md",
  className,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  // Consistent background color based on name hash (lighter for better contrast with avatars)
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = colors[hash % colors.length];

  // Use provided image if available and valid
  if (imageUrl && !imageError) {
    return (
      <div
        className={cn(
          "rounded-full overflow-hidden relative shadow-inner bg-slate-800",
          sizeClasses[size],
          className
        )}
      >
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized // Since we don't know the domain of user provided images
        />
      </div>
    );
  }

  // Fallback to DiceBear avatars
  // We use 'adventurer' collection for cool character avatars
  const diceBearUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(
    name
  )}&backgroundColor=transparent`;

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden relative shadow-md",
        colorClass, // Light background behind the avatar
        sizeClasses[size],
        className
      )}
    >
      {mounted && (
        <Image
          src={diceBearUrl}
          alt={name}
          fill
          className="object-cover transform scale-110 translate-y-1"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}
    </div>
  );
}


