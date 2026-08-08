"use client";

import { useEffect, useState } from "react";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";

type Article = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
};

const SOURCE_LABELS = ["Fox News", "NY Post", "Washington Times", "Daily Signal", "Washington Examiner"];

export default function NewsPanel() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filtered, setFiltered] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSource, setActiveSource] = useState("All");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch {
      setError("Could not load news. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setFiltered(
      activeSource === "All" ? articles : articles.filter((a) => a.source === activeSource)
    );
  }, [articles, activeSource]);

  const formatDate = (raw: string) => {
    if (!raw) return "";
    try {
      return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <Newspaper size={18} className="text-orange-400" />
          News
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Source filter */}
      <div className="flex flex-wrap gap-1.5">
        {["All", ...SOURCE_LABELS].map((s) => (
          <button
            key={s}
            onClick={() => setActiveSource(s)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
              activeSource === s
                ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-orange-500/30 hover:text-zinc-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
          Loading news…
        </div>
      )}
      {error && !loading && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Article list */}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-zinc-600 text-center py-8">No articles found.</p>
      )}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.map((article, i) => (
            <a
              key={i}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-orange-500/30 hover:bg-zinc-900 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors leading-snug flex-1">
                  {article.title}
                </p>
                <ExternalLink size={12} className="shrink-0 mt-0.5 text-zinc-700 group-hover:text-orange-400 transition-colors" />
              </div>
              {article.description && (
                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{article.description}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-orange-500/70">
                  {article.source}
                </span>
                {article.pubDate && (
                  <span className="text-[10px] text-zinc-700">{formatDate(article.pubDate)}</span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
