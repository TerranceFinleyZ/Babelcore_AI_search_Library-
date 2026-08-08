"use client";

import Image from "next/image";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import DocumentViewer from "../../components/DocumentViewer";
import SavedPanel from "../../components/SavedPanel";
import SearchBar from "../../components/SearchBar";
import SearchResults from "../../components/SearchResults";
import AIResponseBox from "../../components/AIResponseBox";
import NotesPanel from "../../components/NotesPanel";
import DocsPanel from "../../components/DocsPanel";
import BiblePanel from "../../components/BiblePanel";

type ResultItem = {
  id: string;
  title: string;
  snippet: string;
  relevance: number;
  tags: string[];
};

type SavedItem = {
  id: string;
  title: string;
  savedAt: string;
  content?: string;
  tags?: string[];
};

type DocumentData = {
  id: string;
  title: string;
  content: string;
  tags: string[];
};

const MOCK_RESULTS: ResultItem[] = [
  { id: "1", title: "Introduction to CORE", snippet: "CORE is your intelligent document and research platform, built for speed and precision.", relevance: 9.8, tags: ["overview", "getting-started"] },
  { id: "2", title: "Search & Discovery", snippet: "Use semantic search to surface relevant documents, cases, and findings across your workspace.", relevance: 9.2, tags: ["search", "discovery"] },
  { id: "3", title: "Document Management", snippet: "Organise, tag, and annotate documents. Save items to your CORE collection for quick retrieval.", relevance: 8.7, tags: ["documents", "management"] },
  { id: "4", title: "AI Summarisation", snippet: "Generate concise summaries of lengthy documents with one click using integrated AI models.", relevance: 8.1, tags: ["ai", "summarisation"] },
];

export default function SearchPage() {
  const { user } = useUser();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedOpen, setSavedOpen] = useState(true);
  const [activeDoc, setActiveDoc] = useState<DocumentData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [ollamaOpen, setOllamaOpen] = useState(false);
  const [oracleOpen, setOracleOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("core_saved_items");
      if (stored) setSavedItems(JSON.parse(stored) as SavedItem[]);
    } catch {}
  }, []);

  const handleMakeNote = async (response: string) => {
    const title = lastQuery
      ? `Hyrum: ${lastQuery.slice(0, 80)}`
      : `Hyrum note — ${new Date().toLocaleString()}`;
    const id = `hyrum-${Date.now()}`;

    // Add to My CORE immediately so it appears in the panel
    const newItem: SavedItem = {
      id,
      title,
      savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: response,
      tags: ["hyrum", "ai"],
    };
    setSavedItems((prev) => {
      const updated = [newItem, ...prev];
      try { localStorage.setItem("core_saved_items", JSON.stringify(updated)); } catch {}
      return updated;
    });
    setSavedOpen(true);

    // Also persist to Oracle
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user?.id ?? "anonymous", title, content: response }),
    });
    if (!res.ok) throw new Error("Save failed");
  };

  const handleSearch = (query: string) => {
    setLoading(true);
    setAiResponse("");
    setAiLoading(true);
    setLastQuery(query);

    // Mock results
    setTimeout(() => {
      const term = query.toLowerCase();
      const filtered = MOCK_RESULTS.filter((r) =>
        `${r.title} ${r.snippet} ${r.tags.join(" ")}`.toLowerCase().includes(term)
      );
      setResults(filtered.length ? filtered : MOCK_RESULTS);
      setLoading(false);
    }, 600);

    // Ollama AI response
    fetch("/api/ollama-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((res) => res.json())
      .then((data) => setAiResponse(data.response ?? data.error ?? "No response"))
      .catch(() => setAiResponse("Could not reach Ollama. Is it running?"))
      .finally(() => setAiLoading(false));
  };

  const handleSave = (id: string) => {
    const item = results.find((r) => r.id === id);
    if (!item || savedItems.some((s) => s.id === id)) return;
    const updated = [
      ...savedItems,
      { id: item.id, title: item.title, savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ];
    setSavedItems(updated);
    try { localStorage.setItem("core_saved_items", JSON.stringify(updated)); } catch {}
  };

  const handleRemove = (id: string) => {
    setSavedItems((current) => {
      const updated = current.filter((item) => item.id !== id);
      try { localStorage.setItem("core_saved_items", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const handleOpen = (id: string) => {
    // Check search results first
    const resultItem = results.find((r) => r.id === id);
    if (resultItem) {
      setActiveDoc({ id: resultItem.id, title: resultItem.title, content: resultItem.snippet, tags: resultItem.tags });
      return;
    }
    // Fall back to saved items (e.g. AI responses saved to My CORE)
    const savedItem = savedItems.find((s) => s.id === id);
    if (savedItem?.content) {
      setActiveDoc({
        id: savedItem.id,
        title: savedItem.title,
        content: savedItem.content,
        tags: savedItem.tags ?? [],
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <header className="border-b border-orange-500/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center lg:flex-row lg:text-left">
            <Link href="/bench">
              <Image
                src="/Backs.png"
                alt="Go to home"
                width={52}
                height={52}
                className="rounded-xl object-cover shadow-lg shadow-orange-950/40 transition hover:opacity-80 spin-slow"
              />
            </Link>
            <div>
              <h1 className="text-4xl font-black tracking-widest text-orange-500 sm:text-5xl">
                CORE
              </h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Deep AI Research. Instant Recall. Total Control.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:ml-auto lg:justify-end">
              {/* Ollama info button + popup */}
              <div className="relative">
                <button
                  onClick={() => { setOllamaOpen((o) => !o); setOracleOpen(false); }}
                  style={{
                    color: "#ffffff",
                    textShadow: "0 0 8px #ffffff, 0 0 20px #ffffffaa",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    boxShadow: "0 0 10px rgba(255,255,255,0.2), inset 0 0 8px rgba(255,255,255,0.05)",
                    borderRadius: "9999px",
                    padding: "0.35rem 1rem",
                    cursor: "pointer",
                  }}
                >
                  Ollama
                </button>
                {ollamaOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-white/20 bg-zinc-900/95 backdrop-blur-sm p-4 shadow-2xl shadow-black/60">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-white">Ollama</p>
                      <button onClick={() => setOllamaOpen(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors text-sm leading-none">&times;</button>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">Ollama is an open-source runtime that runs large language models locally on your machine — no cloud, no data leaving your device.</p>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Babelcore uses Ollama to power <span className="text-white font-semibold">Hyrum AI</span>, giving you fast, private AI-assisted research and answers directly inside the platform.</p>
                  </div>
                )}
              </div>

              {/* Oracle info button + popup */}
              <div className="relative">
                <button
                  onClick={() => { setOracleOpen((o) => !o); setOllamaOpen(false); }}
                  style={{
                    color: "#ff4444",
                    textShadow: "0 0 8px #ff4444, 0 0 20px #ff4444aa",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    background: "rgba(255,68,68,0.08)",
                    border: "1px solid rgba(255,68,68,0.35)",
                    boxShadow: "0 0 10px rgba(255,68,68,0.2), inset 0 0 8px rgba(255,68,68,0.05)",
                    borderRadius: "9999px",
                    padding: "0.35rem 1rem",
                    cursor: "pointer",
                  }}
                >
                  Oracle
                </button>
                {oracleOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-red-500/20 bg-zinc-900/95 backdrop-blur-sm p-4 shadow-2xl shadow-black/60">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-red-400">Oracle Database</p>
                      <button onClick={() => setOracleOpen(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors text-sm leading-none">&times;</button>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">Oracle Database is an enterprise-grade relational database system trusted by organisations worldwide for secure, high-performance data storage.</p>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Babelcore uses Oracle to store and retrieve your <span className="text-red-400 font-semibold">documents, notes, and research</span> — keeping your data structured, searchable, and persistent across sessions.</p>
                  </div>
                )}
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>

          {/* Document upload */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) setUploadedFile(file);
            }}
            style={{
              border: `1.5px dashed ${dragging ? "#f97316" : "rgba(249,115,22,0.35)"}`,
              borderRadius: "1rem",
              background: dragging ? "rgba(249,115,22,0.07)" : "rgba(255,255,255,0.03)",
              padding: "1.25rem 1.5rem",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <label style={{ cursor: "pointer", display: "block" }}>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setUploadedFile(file);
                }}
              />
              {uploadedFile ? (
                <span style={{ color: "#f97316", fontWeight: 600, fontSize: "0.85rem" }}>
                  {uploadedFile.name}
                </span>
              ) : (
                <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                  <span style={{ color: "#f97316", fontWeight: 700 }}>Click to upload</span> or drag and drop a document
                  <br />
                  <span style={{ fontSize: "0.7rem" }}>PDF, DOC, DOCX, TXT, MD</span>
                </span>
              )}
            </label>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400 text-center lg:text-left">
            ܟܘܪܐ ܗܘ ܡܚܫܒܬܐ ܕܝܕܥܬܐ ܕܡܫܡܫܐ ܒܗܘܫܒܥܐ ܕܐܘܡܢܘܬܐ. ܣܠܩ ܟܬܒ̈ܐ، ܒܩܝ ܒܟܠܗ ܟܬܒ ܒܗܘܢܐ ܣܟܘܠܬܢܐ ܥܡܝܩܐ، ܘܦܪܘܫ ܣܘܟ̈ܠܐ ܚܫܚ̈ܐ ܠܡܫܘܚܬܐ ܥܬܝܕܐ ܒܟܠ ܙܒܢ.
          </p>
          <div className="mt-2 w-full">
            <SearchBar onSearch={handleSearch} loading={loading} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex-1">
            <AIResponseBox response={aiResponse} loading={aiLoading} onMakeNote={handleMakeNote} />
            <SearchResults
              results={results}
              onSave={handleSave}
              loading={loading}
              onOpen={handleOpen}
            />
          </div>
          <div className="flex w-full flex-col gap-4 lg:w-80 lg:flex-shrink-0">
            <a
              href="/workspace"
              className="block rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-red-500/40"
            >
              <span className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
                CoreSpace
              </span>
            </a>

            <BiblePanel
              onSaveNote={async (content) => {
                await fetch("/api/documents", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: user?.id ?? "anonymous",
                    title: content.split("\n")[0].replace("📖 ", ""),
                    content,
                  }),
                });
              }}
            />

            <SavedPanel
              items={savedItems}
              openItem={handleOpen}
              onRemove={handleRemove}
              isOpen={savedOpen}
              onToggle={() => setSavedOpen((o) => !o)}
            />
            <NotesPanel />
            <DocsPanel />
          </div>
        </div>
      </main>

      {activeDoc && (
        <DocumentViewer
          document={activeDoc}
          onClose={() => setActiveDoc(null)}
          onSummarize={() => {}}
        />
      )}
    </div>
  );
}