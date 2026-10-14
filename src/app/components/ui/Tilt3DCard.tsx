"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Tilt3DCardProps {
  children: React.ReactNode;
  href?: string;
  label?: string;
  glowRgb?: string;
  className?: string;
  surfaceClassName?: string;
}

export function Tilt3DCard({
  children,
  href,
  label,
  glowRgb = "251,191,36",
  className = "",
  surfaceClassName = "",
}: Tilt3DCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const clientX = (e.clientX - rect.left) / rect.width;
    const clientY = (e.clientY - rect.top) / rect.height;
    x.set(clientX);
    y.set(clientY);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  const cardContent = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl transition-shadow duration-300 hover:shadow-2xl ${className}`}
    >
      {/* 3D Ambient Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300"
        style={{
          opacity: hovered ? 0.35 : 0,
          background: `radial-gradient(400px circle at ${x.get() * 100}% ${y.get() * 100}%, rgba(${glowRgb}, 0.4), transparent 70%)`,
        }}
      />
      <div className={`relative z-10 ${surfaceClassName}`}>{children}</div>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export function TiltLayer({
  children,
  depth = 20,
  className = "",
}: {
  children: React.ReactNode;
  depth?: number;
  className?: string;
}) {
  return (
    <div
      style={{
        transform: `translateZ(${depth}px)`,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      {children}
    </div>
  );
}