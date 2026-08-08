"use client";

type SavedItem = {
  id: string;
  title: string;
  savedAt: string;
};

type SavedPanelProps = {
  items: SavedItem[];
  openItem: (id: string) => void;
  onRemove: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
};

export default function SavedPanel({ items, openItem, onRemove, isOpen, onToggle }: SavedPanelProps) {
  return (
    <aside className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-[0.25em] text-orange-300"
      >
        <span>My CORE</span>
        <span className="text-xs text-slate-400">{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-700 p-4 text-sm text-slate-500">
              Saved documents will appear here.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/core-saved-item", JSON.stringify(item));
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="group relative cursor-grab rounded-2xl border border-zinc-800 bg-black/40 transition hover:border-orange-500/40 active:cursor-grabbing"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openItem(item.id)}
                  onKeyDown={(e) => e.key === "Enter" && openItem(item.id)}
                  className="w-full cursor-pointer p-3 text-left"
                >
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-orange-500/40">
                    ⠿ drag to canvas
                  </p>
                  <div className="pr-5 text-sm font-medium text-white">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500">Saved {item.savedAt}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                  aria-label="Remove from My CORE"
                  className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-zinc-600 transition hover:bg-red-600/20 hover:text-red-500"
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
