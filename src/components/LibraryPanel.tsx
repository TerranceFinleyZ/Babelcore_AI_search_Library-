"use client";

import { FormEvent, useState } from "react";
import { Search, BookOpen, X } from "lucide-react";

type Book = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
};

// Allowed subjects to ensure only Christian/theological content
const CHRISTIAN_SUBJECTS = [
  { value: "christian_theology", label: "Christian Theology" },
  { value: "bible", label: "Bible" },
  { value: "christianity", label: "Christianity" },
  { value: "christian_life", label: "Christian Life" },
  { value: "church_history", label: "Church History" },
  { value: "biblical_studies", label: "Biblical Studies" },
  { value: "apologetics", label: "Apologetics" },
  { value: "systematic_theology", label: "Systematic Theology" },
];

export default function LibraryPanel() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("christian_theology");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Book | null>(null);

  const search = async (e?: FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params = new URLSearchParams({
        subject,
        fields: "key,title,author_name,first_publish_year,cover_i",
        limit: "20",
      });
      if (query.trim()) {
        params.set("q", query.trim());
        params.set("subject", subject);
      }

      const url = query.trim()
        ? `https://openlibrary.org/search.json?${params}`
        : `https://openlibrary.org/subjects/${subject}.json?limit=20`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      // Both endpoints return works/docs arrays
      const raw: Book[] = query.trim()
        ? (data.docs ?? [])
        : (data.works ?? []).map((w: { key: string; title: string; authors?: { name: string }[]; first_publish_year?: number; cover_id?: number }) => ({
            key: w.key,
            title: w.title,
            author_name: w.authors?.map((a) => a.name),
            first_publish_year: w.first_publish_year,
            cover_i: w.cover_id,
          }));

      setBooks(raw.slice(0, 20));
    } catch {
      setError("Could not reach the library. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <BookOpen size={18} className="text-orange-400" />
          Library
        </h2>
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Christian &amp; Theological Books</span>
      </div>

      {/* Featured / Popular Books */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Featured</p>
        <div className="flex gap-3">
          <a
            href="https://www.amazon.com/dp/B0GMXDJZ8V"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-start rounded-2xl border border-orange-500/20 bg-zinc-900/60 p-3 text-left hover:border-orange-500/50 hover:bg-zinc-900 transition-all group w-36 shrink-0"
          >
            <div className="w-full aspect-[2/3] rounded-xl overflow-hidden mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/C&V.jpg" alt="Commandments & Virtues" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs font-semibold text-zinc-200 line-clamp-2 group-hover:text-white transition-colors">
              Commandments &amp; Virtues: Part 1
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-600">James L. Fowler</p>
            <span className="mt-2 text-[10px] font-semibold text-orange-400 group-hover:text-orange-300 transition-colors">
              View on Amazon →
            </span>
          </a>
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={search} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or author… (or browse by subject)"
              maxLength={120}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-900 border border-orange-500/10 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/40"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-red-600/80 border border-red-500/50 text-sm text-white hover:bg-red-600 transition-all disabled:opacity-50"
          >
            {loading ? "…" : "Search"}
          </button>
        </div>

        {/* Subject filter */}
        <div className="flex flex-wrap gap-1.5">
          {CHRISTIAN_SUBJECTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => { setSubject(s.value); setSearched(false); setBooks([]); }}
              className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
                subject === s.value
                  ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-orange-500/30 hover:text-zinc-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </form>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {/* Prompt to browse */}
      {!searched && !loading && (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
          <BookOpen size={32} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">Select a subject above or search to browse books</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
          Loading…
        </div>
      )}

      {/* Results */}
      {!loading && searched && books.length === 0 && !error && (
        <p className="text-sm text-zinc-600 text-center py-8">No books found. Try a different search or subject.</p>
      )}

      {!loading && books.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {books.map((book) => (
            <button
              key={book.key}
              onClick={() => setSelected(book)}
              className="flex flex-col items-start rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left hover:border-orange-500/30 hover:bg-zinc-900 transition-all group"
            >
              {/* Cover */}
              <div className="w-full aspect-[2/3] rounded-xl bg-zinc-800 overflow-hidden mb-2 flex items-center justify-center">
                {book.cover_i ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <BookOpen size={24} className="text-zinc-700" />
                )}
              </div>
              <p className="text-xs font-semibold text-zinc-200 line-clamp-2 group-hover:text-white transition-colors">
                {book.title}
              </p>
              {book.author_name?.[0] && (
                <p className="mt-0.5 text-[10px] text-zinc-600 truncate w-full">{book.author_name[0]}</p>
              )}
              {book.first_publish_year && (
                <p className="text-[10px] text-zinc-700">{book.first_publish_year}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Book detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative flex gap-5 max-w-md w-full mx-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 text-zinc-600 hover:text-zinc-300 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Cover */}
            <div className="w-24 shrink-0 aspect-[2/3] rounded-xl bg-zinc-800 overflow-hidden flex items-center justify-center">
              {selected.cover_i ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://covers.openlibrary.org/b/id/${selected.cover_i}-L.jpg`}
                  alt={selected.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen size={28} className="text-zinc-700" />
              )}
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              <h3 className="text-base font-bold text-zinc-100 leading-snug">{selected.title}</h3>
              {selected.author_name && (
                <p className="text-sm text-zinc-400">
                  {selected.author_name.slice(0, 3).join(", ")}
                </p>
              )}
              {selected.first_publish_year && (
                <p className="text-xs text-zinc-600">First published {selected.first_publish_year}</p>
              )}
              <a
                href={`https://openlibrary.org${selected.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/30 text-xs text-orange-300 hover:bg-orange-500/30 transition-all w-fit"
              >
                <BookOpen size={12} />
                View on Open Library
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
