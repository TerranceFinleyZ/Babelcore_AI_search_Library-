"use client";

import { FormEvent, useState } from "react";

type SearchBarProps = {
  onSearch: (query: string) => void;
  loading: boolean;
};

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-3 rounded-full border border-orange-500/30 bg-zinc-950/80 px-3 py-3 shadow-lg shadow-orange-950/20 backdrop-blur">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search CORE…"
        className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
