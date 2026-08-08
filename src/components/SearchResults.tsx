"use client";

type ResultItem = {
  id: string;
  title: string;
  snippet: string;
  relevance: number;
  tags: string[];
};

type SearchResultsProps = {
  results: ResultItem[];
  onSave: (id: string) => void;
  loading: boolean;
  onOpen: (id: string) => void;
};

export default function SearchResults({ results, onSave, loading, onOpen }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="mt-6 flex items-center justify-center rounded-3xl border border-orange-500/20 bg-zinc-900/70 p-8 text-orange-300">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <span className="ml-3 text-sm">Loading results…</span>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 text-center text-sm text-slate-400">
        No results yet. Try a different term.
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4">
      {results.map((result) => (
        <article
          key={result.id}
          className="card-hover rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-black/20"
        >
          <div className="flex items-start justify-between gap-3">
            <button onClick={() => onOpen(result.id)} className="text-left">
              <h3 className="text-lg font-semibold text-white">{result.title}</h3>
            </button>
            <button
              onClick={() => onSave(result.id)}
              className="rounded-full border border-orange-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300 transition hover:bg-orange-600 hover:text-white"
            >
              Save
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">{result.snippet}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-orange-300">
              Relevance {result.relevance.toFixed(1)}
            </span>
            {result.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-zinc-800 px-2.5 py-1">
                {tag}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
