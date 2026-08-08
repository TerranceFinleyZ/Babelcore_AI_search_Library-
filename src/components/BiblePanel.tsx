"use client";

import { FormEvent, useState } from "react";

type Verse = {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

type BibleResult = {
  reference: string;
  text: string;
  translation_id: string;
  translation_name: string;
  verses: Verse[];
};

const TRANSLATIONS = [
  { id: "kjv", label: "KJV" },
  { id: "web", label: "WEB" },
  { id: "asv", label: "ASV" },
  { id: "bbe", label: "BBE" },
  { id: "darby", label: "Darby" },
];

type BiblePanelProps = {
  onSaveNote?: (content: string) => void;
};

export default function BiblePanel({ onSaveNote }: BiblePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [translation, setTranslation] = useState("kjv");
  const [result, setResult] = useState<BibleResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = reference.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);

    try {
      const res = await fetch(
        `/api/bible?reference=${encodeURIComponent(trimmed)}&translation=${translation}`
      );
      const data: unknown = await res.json();

      if (!res.ok) {
        const msg =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : "Failed to fetch verse";
        setError(msg);
        return;
      }

      setResult(data as BibleResult);
    } catch {
      setError("Could not reach the Bible API.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result || !onSaveNote) return;
    onSaveNote(`📖 ${result.reference} (${result.translation_id.toUpperCase()})\n\n${result.text}`);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div
      style={{
        borderRadius: "1.25rem",
        border: "1px solid rgba(249,115,22,0.25)",
        background: "rgba(0,0,0,0.60)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem" }}>📖</span>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#f97316",
            }}
          >
            Bible
          </span>
        </div>
        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && (
        <div style={{ padding: "0 1rem 1rem" }}>
          {/* Search form */}
          <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. John 3:16 or Romans 8:28"
              maxLength={100}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(249,115,22,0.25)",
                borderRadius: "0.5rem",
                color: "#f1f5f9",
                fontSize: "0.78rem",
                padding: "0.45rem 0.75rem",
                outline: "none",
                width: "100%",
              }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <select
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(249,115,22,0.25)",
                  borderRadius: "0.5rem",
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  padding: "0.4rem 0.5rem",
                  flex: 1,
                  cursor: "pointer",
                }}
              >
                {TRANSLATIONS.map((t) => (
                  <option key={t.id} value={t.id} style={{ background: "#111" }}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={loading || !reference.trim()}
                style={{
                  background: "#ea580c",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.4rem 0.85rem",
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading || !reference.trim() ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? "…" : "Look up"}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <p
              style={{
                marginTop: "0.6rem",
                fontSize: "0.75rem",
                color: "#f87171",
                background: "rgba(239,68,68,0.08)",
                borderRadius: "0.5rem",
                padding: "0.4rem 0.6rem",
              }}
            >
              {error}
            </p>
          )}

          {/* Result */}
          {result && (
            <div
              style={{
                marginTop: "0.75rem",
                background: "rgba(249,115,22,0.05)",
                border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: "0.75rem",
                padding: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#f97316",
                    letterSpacing: "0.05em",
                  }}
                >
                  {result.reference}
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {result.translation_id.toUpperCase()}
                </span>
              </div>

              {/* Multi-verse display */}
              {result.verses.length > 1 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {result.verses.map((v) => (
                    <p key={`${v.chapter}-${v.verse}`} style={{ fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
                      <span style={{ color: "#f97316", fontWeight: 700, marginRight: "0.3rem", fontSize: "0.68rem" }}>
                        {v.verse}
                      </span>
                      {v.text}
                    </p>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.65, margin: 0 }}>
                  {result.text}
                </p>
              )}

              {onSaveNote && (
                <button
                  onClick={handleSave}
                  style={{
                    marginTop: "0.6rem",
                    background: saved ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.1)",
                    border: `1px solid ${saved ? "rgba(34,197,94,0.35)" : "rgba(249,115,22,0.25)"}`,
                    borderRadius: "0.5rem",
                    color: saved ? "#4ade80" : "#f97316",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "0.3rem 0.65rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {saved ? "✓ Saved to notes" : "Save to notes"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
