"use client";

import { useState } from "react";

type AIResponseBoxProps = {
  response: string;
  loading: boolean;
  onMakeNote?: (response: string) => Promise<void>;
};

export default function AIResponseBox({ response, loading, onMakeNote }: AIResponseBoxProps) {
  const [noteStatus, setNoteStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isOpen, setIsOpen] = useState(true);

  const handleMakeNote = async () => {
    if (!onMakeNote || !response) return;
    setNoteStatus("saving");
    try {
      await onMakeNote(response);
      setNoteStatus("saved");
      setTimeout(() => setNoteStatus("idle"), 2500);
    } catch {
      setNoteStatus("error");
      setTimeout(() => setNoteStatus("idle"), 2500);
    }
  };
  if (!loading && !response) return null;

  return (
    <div
      style={{
        borderRadius: "1.25rem",
        border: "1px solid rgba(249,115,22,0.30)",
        background: "linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(0,0,0,0.70) 100%)",
        boxShadow: "0 0 24px rgba(249,115,22,0.08)",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: loading ? "#f97316" : "#22c55e",
              boxShadow: loading
                ? "0 0 8px #f97316"
                : "0 0 8px #22c55e",
              animation: loading ? "pulse 1.2s infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#f97316",
            }}
          >
            Hyrum
          </span>
        </div>
        <button
          onClick={() => setIsOpen((o) => !o)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
          aria-label={isOpen ? "Minimize" : "Expand"}
        >
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{isOpen ? "▾" : "▸"}</span>
        </button>
      </div>

      {isOpen && (loading ? (
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "2px solid #f97316",
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
              flexShrink: 0,
            }}
          />
          Thinking…
        </div>
      ) : (
        <>
          <p
            style={{
              color: "#e2e8f0",
              fontSize: "0.9rem",
              lineHeight: 1.75,
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {response}
          </p>

          {onMakeNote && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleMakeNote}
                disabled={noteStatus === "saving"}
                style={{
                  background: noteStatus === "saved" ? "rgba(34,197,94,0.15)" : "rgba(249,115,22,0.12)",
                  border: `1px solid ${noteStatus === "saved" ? "rgba(34,197,94,0.4)" : "rgba(249,115,22,0.4)"}`,
                  borderRadius: "9999px",
                  color: noteStatus === "saved" ? "#22c55e" : noteStatus === "error" ? "#ef4444" : "#f97316",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "0.35rem 1.1rem",
                  cursor: noteStatus === "saving" ? "not-allowed" : "pointer",
                  opacity: noteStatus === "saving" ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
              >
                {noteStatus === "saving" && "Saving…"}
                {noteStatus === "saved" && "Saved ✓"}
                {noteStatus === "error" && "Failed ✕"}
                {noteStatus === "idle" && "Make Node"}
              </button>
              {noteStatus === "idle" && (
                <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                  Save to Oracle as a searchable node
                </span>
              )}
            </div>
          )}
        </>
      ))}
    </div>
  );
}
