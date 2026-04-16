"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  beforeUrl: string;
  afterUrl: string;
  title: string;
  badge?: string;       // ej "DÍA 45"
  subtitle?: string;    // ej "5 sesiones"
  className?: string;
}

export default function BeforeAfterSlider({ beforeUrl, afterUrl, title, badge, subtitle, className }: Props) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const updateFromClient = (clientX: number) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      setPos((x / rect.width) * 100);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      const x = e instanceof TouchEvent ? e.touches[0]?.clientX ?? 0 : e.clientX;
      updateFromClient(x);
    };
    const onUp = () => { draggingRef.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    draggingRef.current = true;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos(((clientX - rect.left) / rect.width) * 100);
  };

  return (
    <div
      ref={ref}
      onMouseDown={onDown}
      onTouchStart={onDown}
      className={`group relative aspect-[4/5] rounded-lg overflow-hidden select-none cursor-ew-resize bg-surface-container-lowest ${className ?? ""}`}
    >
      {/* Full color después */}
      <img src={afterUrl} alt="después" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      {/* Antes, grayscale, clippeado */}
      <img
        src={beforeUrl}
        alt="antes"
        className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.45] pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      {/* Divider + knob */}
      <div className="absolute inset-y-0 pointer-events-none flex items-center" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
        <div className="h-full w-px bg-primary-amber/70 shadow-[0_0_12px_rgba(239,189,138,0.6)]" />
        <div className="absolute w-9 h-9 rounded-full bg-primary-amber text-on-primary-amber flex items-center justify-center text-sm shadow-xl">⇔</div>
      </div>
      {/* Top chips */}
      <span className="absolute top-4 left-4 font-label text-[10px] tracking-widest text-white/80 bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full">ANTES</span>
      <span className="absolute top-4 right-4 font-label text-[10px] tracking-widest text-on-primary-amber bg-primary-amber px-2.5 py-1 rounded-full">DESPUÉS</span>

      {/* Bottom label bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-surface/70 backdrop-blur-md border border-white/5 px-4 py-3 rounded-lg">
        <div className="min-w-0">
          <div className="font-label text-[10px] tracking-widest text-white truncate">{title.toUpperCase()}</div>
          {subtitle && <div className="font-label text-[9px] tracking-widest text-white/50 mt-0.5 truncate">{subtitle}</div>}
        </div>
        {badge && (
          <span className="bg-primary-amber text-on-primary-amber text-[9px] font-bold px-2 py-1 rounded tracking-wide ml-3 flex-shrink-0">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
