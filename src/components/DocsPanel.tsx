"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "core_my_docs";

type DocEntry = {
  name: string;
  size: string;
  addedAt: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setDocs(JSON.parse(stored));
  }, []);

  const addDoc = (file: File) => {
    const entry: DocEntry = {
      name: file.name,
      size: formatSize(file.size),
      addedAt: new Date().toLocaleDateString(),
    };
    setDocs((prev) => {
      const updated = [entry, ...prev.filter((d) => d.name !== file.name)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeDoc = (name: string) => {
    setDocs((prev) => {
      const updated = prev.filter((d) => d.name !== name);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(addDoc);
  };

  return (
    <aside className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-[0.25em] text-orange-300"
      >
        <span>My Docs</span>
        <span className="text-xs text-slate-400">{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border border-dashed p-3 text-center text-xs transition ${
              dragging
                ? "border-orange-500 bg-orange-500/10 text-orange-300"
                : "border-zinc-700 text-slate-500 hover:border-orange-500/50 hover:text-slate-400"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <span className="text-orange-500 font-semibold">Click</span> or drag to add a doc
          </div>

          {/* Doc list */}
          {docs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-700 p-4 text-sm text-slate-500">
              Your documents will appear here.
            </p>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.name}
                className="flex items-start justify-between gap-2 rounded-2xl border border-zinc-800 bg-black/40 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{doc.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{doc.size} · Added {doc.addedAt}</p>
                </div>
                <button
                  onClick={() => removeDoc(doc.name)}
                  className="mt-0.5 flex-shrink-0 text-xs text-slate-600 transition hover:text-red-400"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}
