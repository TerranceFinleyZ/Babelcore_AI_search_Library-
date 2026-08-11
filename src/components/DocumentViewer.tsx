"use client";

type DocumentData = {
  id: string;
  title: string;
  content: string;
  tags: string[];
};

type DocumentViewerProps = {
  document: DocumentData | null;
  onClose: () => void;
  onSummarize: (id: string) => void;
};

export default function DocumentViewer({ document, onClose, onSummarize }: DocumentViewerProps) {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-3xl border border-orange-500/20 bg-zinc-950 p-6 shadow-2xl shadow-orange-950/30" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">Document viewer</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{document.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-slate-300">
            Close
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {document.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 max-h-[60vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-black/40 p-4 text-sm leading-7 text-slate-300">
          {document.content}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => onSummarize(document.id)}
            className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            Open in Claude Summary
          </button>
        </div>
      </div>
    </div>
  );
}
