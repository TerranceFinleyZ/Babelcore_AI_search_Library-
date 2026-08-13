"use client";

import { useRef, useState } from "react";
import { X, Upload, ZoomIn, ZoomOut, Check } from "lucide-react";

export const PREMADE_PICS = [
  { label: "Dog",           value: "animal:🐶" },
  { label: "Cat",           value: "animal:🐱" },
  { label: "Lamb",          value: "animal:🐑" },
  { label: "Cow",           value: "animal:🐄" },
  { label: "Lion",          value: "animal:🦁" },
  { label: "Deer",          value: "animal:🦌" },
  { label: "Rose",          value: "animal:🌹" },
  { label: "Money",         value: "animal:💰" },
  { label: "All Seeing Eye",value: "animal:👁️" },
  { label: "Sun",           value: "animal:☀️" },
  { label: "Moon",          value: "animal:🌙" },
  { label: "Earth",         value: "animal:🌍" },
];

export const GRADIENT_PICS = [
  { label: "Blaze",  value: "linear-gradient(135deg, #f97316, #dc2626)" },
  { label: "Ocean",  value: "linear-gradient(135deg, #3b82f6, #6366f1)" },
  { label: "Forest", value: "linear-gradient(135deg, #22c55e, #0d9488)" },
  { label: "Dusk",   value: "linear-gradient(135deg, #a855f7, #ec4899)" },
  { label: "Storm",  value: "linear-gradient(135deg, #475569, #1e293b)" },
];

export const PROFILE_PIC_KEY = "customProfilePic";

/** Unified avatar renderer — handles animal emoji, gradients, data URLs, and regular URLs. */
export function AvatarDisplay({
  pic, fallbackUrl, initial, color, className,
}: {
  pic: string | null;
  fallbackUrl?: string;
  initial?: string;
  color?: string;
  className?: string;
}) {
  const src = pic || fallbackUrl || null;
  const base = `flex items-center justify-center font-bold text-white overflow-hidden ${className ?? ""}`;
  if (!src) {
    return <div className={base} style={{ backgroundColor: color || "#f97316" }}>{initial || "?"}</div>;
  }
  if (src.startsWith("animal:")) {
    const [animalPart, bgPart] = src.split("|");
    const emoji = animalPart.replace("animal:", "");
    return (
      <div className={base} style={{ background: bgPart || "#27272a" }}>
        <span style={{ fontSize: "175%", lineHeight: 1 }}>{emoji}</span>
      </div>
    );
  }
  if (src.includes("gradient")) {
    return <div className={base} style={{ background: src }}>{initial || "?"}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Profile" className={`object-cover ${className ?? ""}`} />;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userInitial: string;
  currentPic: string | null;
  onSelect: (pic: string) => void;
}

export default function ProfilePicModal({ isOpen, onClose, userInitial, currentPic, onSelect }: Props) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);

  const [uploading, setUploading]           = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [cropSrc, setCropSrc]               = useState<string | null>(null);
  const [cropScale, setCropScale]           = useState(1);
  const [cropPos, setCropPos]               = useState({ x: 0, y: 0 });
  const [dragging, setDragging]             = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const CROP_SIZE = 240;

  if (!isOpen) return null;

  const BG_OPTIONS = [{ label: "Default", value: "" }, ...GRADIENT_PICS];

  function confirmAnimal(bg: string) {
    if (!selectedAnimal) return;
    const val = bg ? `${selectedAnimal}|${bg}` : selectedAnimal;
    onSelect(val);
    setSelectedAnimal(null);
    onClose();
  }

  function handleFile(file: File) {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropSrc(e.target?.result as string);
      setCropScale(1);
      setCropPos({ x: 0, y: 0 });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  function handleCropConfirm() {
    const img = cropImgRef.current;
    if (!img || !cropSrc) return;
    const SIZE = CROP_SIZE;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    const fitScale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
    const totalScale = fitScale * cropScale;
    const drawW = img.naturalWidth * totalScale;
    const drawH = img.naturalHeight * totalScale;
    ctx.drawImage(img, SIZE / 2 + cropPos.x - drawW / 2, SIZE / 2 + cropPos.y - drawH / 2, drawW, drawH);
    onSelect(canvas.toDataURL("image/jpeg", 0.92));
    setCropSrc(null);
    onClose();
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: cropPos.x, py: cropPos.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setCropPos({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  }

  // ── Crop view ──────────────────────────────────────────
  if (cropSrc) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-[320px] shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-zinc-100">Crop Photo</p>
            <button onClick={() => setCropSrc(null)} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X size={16} /></button>
          </div>

          {/* Crop window */}
          <div className="flex justify-center">
            <div
              className="relative overflow-hidden rounded-full border-2 border-orange-500/60 shadow-xl"
              style={{ width: CROP_SIZE, height: CROP_SIZE, cursor: dragging ? "grabbing" : "grab" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={cropImgRef}
                src={cropSrc}
                alt="crop"
                draggable={false}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${cropPos.x}px), calc(-50% + ${cropPos.y}px)) scale(${cropScale})`,
                  transformOrigin: "center",
                  maxWidth: "none",
                  userSelect: "none",
                  pointerEvents: "none",
                  width: CROP_SIZE,
                  height: CROP_SIZE,
                  objectFit: "cover",
                }}
              />
              <div className="absolute inset-0 rounded-full ring-2 ring-white/10 pointer-events-none" />
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-2">
            <ZoomOut size={14} className="text-zinc-500 shrink-0" />
            <input
              type="range" min="1" max="3" step="0.01"
              value={cropScale}
              onChange={(e) => setCropScale(parseFloat(e.target.value))}
              className="flex-1 accent-orange-500"
            />
            <ZoomIn size={14} className="text-zinc-500 shrink-0" />
          </div>

          <p className="text-[10px] text-zinc-600 text-center -mt-2">Drag to reposition · Slider to zoom</p>

          <div className="flex gap-2">
            <button
              onClick={() => setCropSrc(null)}
              className="flex-1 py-2 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:bg-zinc-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCropConfirm}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-all"
            >
              <Check size={14} /> Apply
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-bold text-zinc-100">Profile Picture</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Animal icon options */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          Choose an icon
        </p>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {PREMADE_PICS.map((opt) => {
            const base = currentPic?.startsWith(opt.value) ? true : false;
            const isActive = selectedAnimal === opt.value;
            return (
              <button
                key={opt.label}
                title={opt.label}
                onClick={() => setSelectedAnimal(isActive ? null : opt.value)}
                className={`w-full aspect-square rounded-full bg-zinc-800 flex items-center justify-center transition-all ring-2 text-xl ${
                  isActive ? "ring-orange-400 scale-110" : base ? "ring-orange-400/50" : "ring-transparent hover:ring-zinc-500"
                }`}
              >
                {opt.value.replace("animal:", "")}
              </button>
            );
          })}
        </div>

        {/* Inline background picker shown after selecting an icon */}
        {selectedAnimal && (
          <div className="mb-4 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Background</p>
            <div className="flex gap-2 flex-wrap">
              {BG_OPTIONS.map((bg) => (
                <button
                  key={bg.label}
                  title={bg.label}
                  onClick={() => confirmAnimal(bg.value)}
                  className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-transparent hover:ring-zinc-400 transition-all text-base"
                  style={{ background: bg.value || "#27272a" }}
                >
                  {bg.value === "" ? <span className="text-zinc-400 text-xs font-bold">✕</span> : selectedAnimal.replace("animal:", "")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gradient color options */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          Or a color
        </p>
        <div className="grid grid-cols-5 gap-2 mb-5">
          {GRADIENT_PICS.map((opt) => {
            const isSelected = currentPic === opt.value;
            return (
              <button
                key={opt.label}
                title={opt.label}
                onClick={() => { onSelect(opt.value); onClose(); }}
                className={`w-full aspect-square rounded-full flex items-center justify-center text-white text-sm font-bold transition-all ring-2 ${
                  isSelected ? "ring-orange-400 scale-110" : "ring-transparent hover:ring-zinc-500"
                }`}
                style={{ background: opt.value }}
              >
                {userInitial || "?"}
              </button>
            );
          })}
        </div>

        {/* Upload */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          Or upload your own
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-zinc-600 hover:border-orange-500/60 text-sm text-zinc-400 hover:text-zinc-200 transition-all disabled:opacity-50"
        >
          <Upload size={14} />
          {uploading ? "Processing…" : "Upload image"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
    </div>
  );
}
