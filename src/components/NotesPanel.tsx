"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "core_my_notes";
const DEBOUNCE_MS = 800;

export default function NotesPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setNote(stored);
  }, []);

  const handleChange = (value: string) => {
    setNote(value);
    setSaveStatus("saving");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, value);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, DEBOUNCE_MS);
  };

  return (
    <aside className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-[0.25em] text-orange-300"
      >
        <span>My Notes</span>
        <span className="text-xs text-slate-400">{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && (
        <div className="mt-4">
          <textarea
            value={note}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write a note…"
            rows={6}
            className="w-full resize-none rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30"
          />
          <div className="mt-2 h-4 text-right text-xs text-slate-500">
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved" && "Saved ✓"}
          </div>
        </div>
      )}
    </aside>
  );
}
