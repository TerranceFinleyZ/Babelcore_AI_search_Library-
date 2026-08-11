"use client";

import { useRef, useState } from "react";
import { X, Upload } from "lucide-react";

export const PREMADE_PICS = [
  { label: "Blaze",   bg: "linear-gradient(135deg, #f97316, #dc2626)" },
  { label: "Ocean",   bg: "linear-gradient(135deg, #3b82f6, #6366f1)" },
  { label: "Forest",  bg: "linear-gradient(135deg, #22c55e, #0d9488)" },
  { label: "Dusk",    bg: "linear-gradient(135deg, #a855f7, #ec4899)" },
  { label: "Storm",   bg: "linear-gradient(135deg, #475569, #1e293b)" },
];

export const PROFILE_PIC_KEY = "customProfilePic";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userInitial: string;
  currentPic: string | null;
  onSelect: (pic: string) => void;
}

export default function ProfilePicModal({ isOpen, onClose, userInitial, currentPic, onSelect }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  function handleFile(file: File) {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onSelect(result);
      setUploading(false);
      onClose();
    };
    reader.readAsDataURL(file);
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

        {/* Premade styles */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          Choose a style
        </p>
        <div className="grid grid-cols-5 gap-3 mb-5">
          {PREMADE_PICS.map((opt) => {
            const isSelected = currentPic === opt.bg;
            return (
              <button
                key={opt.label}
                title={opt.label}
                onClick={() => { onSelect(opt.bg); onClose(); }}
                className={`w-full aspect-square rounded-full flex items-center justify-center text-white text-sm font-bold transition-all ring-2 ${
                  isSelected ? "ring-orange-400 scale-110" : "ring-transparent hover:ring-zinc-500"
                }`}
                style={{ background: opt.bg }}
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
