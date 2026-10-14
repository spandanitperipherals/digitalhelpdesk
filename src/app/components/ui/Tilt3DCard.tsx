"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const TILT_SPRING = { stiffness: 220, damping: 20, mass: 0.6 };
const LIFT_SPRING = { type: "spring", stiffness: 300, damping: 24 } as const;

const TiltContext = createContext(false);

export interface Tilt3DCardProps {
  children: ReactNode;
  className?: string;
  surfaceClassName?: string;
  maxTilt?: number;
  lift?: number;
  glare?: boolean;
  glowRgb?: string;
  href?: string;
  label?: string;
}

export function Tilt3DCard({
  children,
  className,
  surfaceClassName,
  maxTilt = 9,
  lift = 28,
  glare = true,
  glowRgb = "251,191,36",
  href,
  label,
}: Tilt3DCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const [finePointer, setFinePointer] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const tiltEnabled = finePointer && !reduceMotion;

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, TILT_SPRING);
  const sy = useSpring(py, TILT_SPRING);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 26 });

  const rotateY = useTransform(sx, [0, 1], [-maxTilt, maxTilt]);
  const rotateX = useTransform(sy, [0, 1], [maxTilt, -maxTilt]);

  const spotX = useTransform(sx, (v) => `${v * 100}%`);
  const spotY = useTransform(sy, (v) => `${v * 100}%`);
  const spotlight = useMotionTemplate`radial-gradient(380px circle at ${spotX} ${spotY}, rgba(${glowRgb},0.24), transparent 62%)`;
  const sheenPosition = useTransform(sx, [0, 1], ["0% 0%", "100% 0%"]);

  const shadowX = useTransform(sx, [0, 1], [26, -26]);
  const shadowY = useTransform(sy, [0, 1], [38, 16]);
  const boxShadow = useMotionTemplate`${shadowX}px ${shadowY}px 52px -16px rgba(2,6,23,0.78), 0 2px 0 0 rgba(255,255,255,0.05) inset`;

  const handlePointerEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !tiltEnabled) return;
    setHovered(true);
    glareOpacity.set(1);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !tiltEnabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    px.set(clamp01((e.clientX - rect.left) / rect.width));
    py.set(clamp01((e.clientY - rect.top) / rect.height));
  };

  const handlePointerLeave = () => {
    setHovered(false);
    setPressed(false);
    px.set(0.5);
    py.set(0.5);
    glareOpacity.set(0);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" && !reduceMotion) setPressed(true);
  };

  const releasePress = () => setPressed(false);

  const target = reduceMotion
    ? { z: 0, y: 0, scale: 1 }
    : hovered
      ? { z: lift, y: 0, scale: 1 }
      : pressed
        ? { z: 0, y: -6, scale: 1.02 }
        : { z: 0, y: 0, scale: 1 };

  return (
    <div
      ref={ref}
      className={cx("perspective-1000", className)}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={releasePress}
      onPointerCancel={releasePress}
    >
      <TiltContext.Provider value={tiltEnabled}>
        <motion.div
          animate={target}
          transition={LIFT_SPRING}
          style={{
            rotateX: tiltEnabled ? rotateX : 0,
            rotateY: tiltEnabled ? rotateY : 0,
            boxShadow,
          }}
          className={cx(
            "preserve-3d relative h-full rounded-3xl will-change-transform",
            surfaceClassName
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/10 bg-navy/60 backdrop-blur-md"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-specular-rim opacity-40"
          />

          {glare && (
            <>
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                style={{ background: spotlight, opacity: glareOpacity }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] bg-specular-sheen bg-[length:250%_100%] bg-no-repeat"
                style={{ backgroundPosition: sheenPosition, opacity: glareOpacity }}
              />
            </>
          )}

          {children}

          {href && (
            <Link
              href={href}
              aria-label={label}
              className="absolute inset-0 z-10 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80"
              style={{ transform: tiltEnabled ? "translateZ(72px)" : undefined }}
            />
          )}
        </motion.div>
      </TiltContext.Provider>
    </div>
  );
}

export interface TiltLayerProps {
  children: ReactNode;
  depth?: number;
  className?: string;
}

export function TiltLayer({ children, depth = 30, className }: TiltLayerProps) {
  const enabled = useContext(TiltContext);
  return (
    <div
      className={cx("preserve-3d", className)}
      style={{ transform: enabled ? `translateZ(${depth}px)` : undefined }}
    >
      {children}
    </div>
  );
}

export default Tilt3DCard;