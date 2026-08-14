"use client";

import { useRef, useState } from "react";

export type DocEntry = {
  id: string;
  name: string;
  size: string;
  addedAt: string;
  type: "document" | "image";
  content?: string;
  preview?: string;
};

type DocsPanelProps = {
  docs: DocEntry[];
  onAddFiles: (files: FileList) => void;
  onRemove: (id: string) => void;
  onOpen: (doc: DocEntry) => void;
  onSaveToCORE: (doc: DocEntry) => void;
};

export default function DocsPanel({ docs, onAddFiles, onRemove, onOpen, onSaveToCORE }: DocsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-[0.25em] text-orange-300"
      >
        <span>My Docs {docs.length > 0 && <span className="text-orange-500/60">({docs.length})</span>}</span>
        <span className="text-xs text-slate-400">{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              onAddFiles(e.dataTransfer.files);
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
              accept=".pdf,.doc,.docx,.txt,.md,image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) onAddFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <span className="text-orange-500 font-semibold">Click</span> or drag · PDF · DOC · Images
          </div>

          {docs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-700 p-4 text-sm text-slate-500">
              Your documents will appear here.
            </p>
          ) : (
            docs.map((doc) => (
              <div key={doc.id} className="rounded-2xl border border-zinc-800 bg-black/40 p-3">
                {doc.type === "image" && doc.preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doc.preview}
                    alt={doc.name}
                    className="mb-2 w-full rounded-xl object-contain"
                    style={{ maxHeight: 100 }}
                  />
                )}
                <div className="flex items-start gap-2">
                  <div
                    className={`min-w-0 flex-1 ${doc.type !== "image" ? "cursor-pointer" : ""}`}
                    onClick={() => doc.type !== "image" && onOpen(doc)}
                  >
                    <p className="truncate text-sm font-medium text-white hover:text-orange-300 transition">{doc.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{doc.size} · {doc.addedAt}</p>
                  </div>
                  <button
                    onClick={() => onRemove(doc.id)}
                    className="mt-0.5 flex-shrink-0 text-xs text-slate-600 transition hover:text-red-400"
                    aria-label="Remove"
                  >✕</button>
                </div>
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {doc.type !== "image" && (
                    <button
                      onClick={() => onOpen(doc)}
                      className="rounded-lg bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 transition"
                    >
                      Open
                    </button>
                  )}
                  <button
                    onClick={() => onSaveToCORE(doc)}
                    className="rounded-lg border border-zinc-700 px-2.5 py-0.5 text-xs text-slate-400 hover:border-orange-500/40 hover:text-orange-300 transition"
                  >
                    Save to CORE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}
