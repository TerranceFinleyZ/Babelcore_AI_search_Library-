"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type NodeTypes,
  BackgroundVariant,
  Handle,
  Position,
  MarkerType,
  addEdge,
  type Connection,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";
import SavedPanel from "@/components/SavedPanel";
import NotesPanel from "@/components/NotesPanel";
import DocumentViewer from "@/components/DocumentViewer";

// ── Types ──────────────────────────────────────────────────
type SavedItem = { id: string; title: string; savedAt: string };
type DocumentData = { id: string; title: string; content: string; tags: string[] };
type ActiveTool = "text" | "box" | "draw" | null;
type DrawPath = { points: { x: number; y: number }[]; color: string };
type UndoAction = { kind: "node"; node: Node } | { kind: "draw"; path: DrawPath };

// ── Custom nodes ───────────────────────────────────────────
function TextNode({ id, data }: { id: string; data: Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null);
  const { setNodes } = useReactFlow();

  useEffect(() => {
    if (!ref.current) return;
    ref.current.textContent = String(data.label ?? "");
    ref.current.focus();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onInput = useCallback(() => {
    const text = ref.current?.textContent ?? "";
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label: text } } : n));
  }, [id, setNodes]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className="nodrag nopan"
      onInput={onInput}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        minWidth: 80,
        padding: "2px 4px",
        color: String(data.color ?? "#f1f5f9"),
        fontSize: "15px",
        fontWeight: 400,
        outline: "none",
        background: "transparent",
        cursor: "text",
        whiteSpace: "pre",
        caretColor: String(data.color ?? "#fb923c"),
      }}
    />
  );
}

function BoxNode({ id, data, selected }: { id: string; data: Record<string, unknown>; selected: boolean }) {
  const { setNodes } = useReactFlow();
  const editRef = useRef<HTMLDivElement>(null);
  const deleteNode = useCallback(() => setNodes((nds) => nds.filter((n) => n.id !== id)), [id, setNodes]);

  useEffect(() => {
    if (editRef.current) editRef.current.textContent = String(data.label ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onInput = useCallback(() => {
    const text = editRef.current?.textContent ?? "";
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label: text } } : n));
  }, [id, setNodes]);

  return (
    <div
      style={{
        position: "relative",
        minWidth: 150,
        minHeight: 90,
        background: "rgba(9,9,11,0.85)",
        border: "1.5px solid rgba(63,63,70,0.9)",
        borderRadius: "12px",
        padding: "12px 14px",
        color: "#e2e8f0",
        fontSize: "13px",
      }}
    >
      {selected && (
        <button
          onClick={deleteNode}
          className="nodrag nopan absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-zinc-500 transition hover:text-orange-400"
          onMouseDown={(e) => e.stopPropagation()}
          title="Delete"
        >
          ✕
        </button>
      )}
      <div
        ref={editRef}
        contentEditable
        suppressContentEditableWarning
        className="nodrag nopan"
        onInput={onInput}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{ outline: "none", cursor: "text", minHeight: "1em", paddingRight: selected ? 14 : 0 }}
      />
      <Handle type="source" position={Position.Left}   id="left"   style={{ background: "transparent", width: 8, height: 8, border: "1.5px solid rgba(249,115,22,0.45)" }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ background: "transparent", width: 8, height: 8, border: "1.5px solid rgba(249,115,22,0.45)" }} />
      <Handle type="source" position={Position.Top}    id="top"    style={{ background: "transparent", width: 8, height: 8, border: "1.5px solid rgba(249,115,22,0.45)" }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: "transparent", width: 8, height: 8, border: "1.5px solid rgba(249,115,22,0.45)" }} />
    </div>
  );
}

const NODE_TYPES: NodeTypes = { text: TextNode, box: BoxNode, hub: HubNode };

// ── Hub node ───────────────────────────────────────────────
function HubNode({ id, data, selected }: { id: string; data: Record<string, unknown>; selected: boolean }) {
  const { setNodes } = useReactFlow();
  const editRef = useRef<HTMLDivElement>(null);
  const deleteNode = useCallback(() => setNodes((nds) => nds.filter((n) => n.id !== id)), [id, setNodes]);

  useEffect(() => {
    if (editRef.current) editRef.current.textContent = String(data.label ?? "CORE");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onInput = useCallback(() => {
    const text = editRef.current?.textContent ?? "";
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label: text } } : n));
  }, [id, setNodes]);

  return (
    <div
      style={{
        position: "relative",
        width: 110,
        height: 110,
        borderRadius: "50%",
        background: "rgba(249,115,22,0.12)",
        border: "1.5px solid rgba(249,115,22,0.55)",
        boxShadow: "0 0 32px rgba(249,115,22,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {selected && (
        <button
          onClick={deleteNode}
          className="nodrag nopan absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-zinc-500 transition hover:text-orange-400"
          onMouseDown={(e) => e.stopPropagation()}
          title="Delete"
        >
          ✕
        </button>
      )}
      <Handle type="source" position={Position.Left}   id="left"   style={{ background: "transparent", width: 8, height: 8, border: "1.5px solid rgba(249,115,22,0.45)" }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ background: "transparent", width: 8, height: 8, border: "1.5px solid rgba(249,115,22,0.45)" }} />
      <Handle type="source" position={Position.Top}    id="top"    style={{ background: "transparent", width: 8, height: 8, border: "1.5px solid rgba(249,115,22,0.45)" }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: "transparent", width: 8, height: 8, border: "1.5px solid rgba(249,115,22,0.45)" }} />
      <div
        ref={editRef}
        contentEditable
        suppressContentEditableWarning
        className="nodrag nopan"
        onInput={onInput}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{
          color: "#fb923c",
          fontWeight: "700",
          fontSize: "11px",
          letterSpacing: "0.15em",
          outline: "none",
          textAlign: "center",
          cursor: "text",
          maxWidth: 80,
          wordBreak: "break-word",
        }}
      />
    </div>
  );
}

// ── Hub graph builder ──────────────────────────────────────
const HUB_ID = "core-hub";

function buildGraph(): { nodes: Node[]; edges: Edge[] } {
  const hub: Node = {
    id: HUB_ID,
    type: "hub",
    position: { x: 0, y: 0 },
    data: { label: "CORE" },
  };
  return { nodes: [hub], edges: [] };
}

// ── Left tool sidebar ──────────────────────────────────────
const TOOL_COLORS = [
  { label: "White",  value: "#f1f5f9" },
  { label: "Red",    value: "#ef4444" },
  { label: "Blue",   value: "#3b82f6" },
  { label: "Orange", value: "#f97316" },
];

type ToolSidebarProps = {
  activeTool: ActiveTool;
  setActiveTool: (t: ActiveTool) => void;
  textColor: string;
  setTextColor: (c: string) => void;
  drawColor: string;
  setDrawColor: (c: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onReset: () => void;
  addNode: (type: string, pos: { x: number; y: number }) => void;
};

function ToolSidebar({ activeTool, setActiveTool, textColor, setTextColor, drawColor, setDrawColor, onUndo, onRedo, canUndo, canRedo, onReset, addNode }: ToolSidebarProps) {
  const { screenToFlowPosition } = useReactFlow();

  const handleMobileAdd = (type: string) => {
    const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    addNode(type, pos);
  };

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/reactflow", "box");
    e.dataTransfer.effectAllowed = "move";
  };

  const onHubDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/reactflow", "hub");
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex max-w-[calc(100vw-80px)] -translate-x-1/2 flex-row gap-1.5 overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-900/80 p-2 backdrop-blur md:bottom-auto md:left-5 md:top-24 md:max-w-none md:translate-x-0 md:flex-col md:gap-2 md:overflow-visible md:p-3">
      <p className="mb-1 hidden px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 md:block">
        Elements
      </p>

      {/* Text — click to activate, then click canvas to place */}
      <button
        onClick={() => setActiveTool(activeTool === "text" ? null : "text")}
        title="Text"
        className={`flex items-center gap-2 rounded-2xl border px-2 py-2 text-xs transition md:px-3 ${
          activeTool === "text"
            ? "border-orange-500/70 bg-orange-500/10 text-orange-300"
            : "border-zinc-700 bg-zinc-800/60 text-slate-300 hover:border-orange-500/50 hover:text-orange-300"
        }`}
      >
        <span className="w-4 text-center text-sm font-bold text-orange-400">T</span>
        <span className="hidden md:inline">Text</span>
      </button>

      {/* Color swatches — only visible when text tool is active */}
      {activeTool === "text" && (
        <div className="hidden gap-1.5 px-1 pb-1 md:flex">
          {TOOL_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setTextColor(c.value)}
              title={c.label}
              style={{ background: c.value }}
              className={`h-5 w-5 rounded-full border-2 transition ${
                textColor === c.value ? "border-white scale-110" : "border-zinc-600 hover:scale-110"
              }`}
            />
          ))}
        </div>
      )}

      {/* Box — drag onto canvas (desktop) or tap to place (mobile) */}
      <div
        draggable
        onDragStart={onDragStart}
        onClick={() => handleMobileAdd("box")}
        title="Box"
        className="flex cursor-grab items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800/60 px-2 py-2 text-xs text-slate-300 transition hover:border-orange-500/50 hover:text-orange-300 active:cursor-grabbing md:px-3"
      >
        <span className="w-4 text-center text-sm font-bold text-orange-400">▭</span>
        <span className="hidden md:inline">Box</span>
      </div>

      {/* Draw — freehand drawing mode */}
      <button
        onClick={() => setActiveTool(activeTool === "draw" ? null : "draw")}
        title="Draw"
        className={`flex items-center gap-2 rounded-2xl border px-2 py-2 text-xs transition md:px-3 ${
          activeTool === "draw"
            ? "border-orange-500/70 bg-orange-500/10 text-orange-300"
            : "border-zinc-700 bg-zinc-800/60 text-slate-300 hover:border-orange-500/50 hover:text-orange-300"
        }`}
      >
        <svg className="w-4 h-4 text-orange-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
        </svg>
        <span className="hidden md:inline">Draw</span>
      </button>

      {/* Color swatches — only visible when draw tool is active */}
      {activeTool === "draw" && (
        <div className="hidden gap-1.5 px-1 pb-1 md:flex">
          {TOOL_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setDrawColor(c.value)}
              title={c.label}
              style={{ background: c.value }}
              className={`h-5 w-5 rounded-full border-2 transition ${
                drawColor === c.value ? "border-white scale-110" : "border-zinc-600 hover:scale-110"
              }`}
            />
          ))}
        </div>
      )}

      {/* Hub — drag onto canvas (desktop) or tap to place (mobile) */}
      <div
        draggable
        onDragStart={onHubDragStart}
        onClick={() => handleMobileAdd("hub")}
        title="Hub"
        className="flex cursor-grab items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800/60 px-2 py-2 text-xs text-slate-300 transition hover:border-orange-500/50 hover:text-orange-300 active:cursor-grabbing md:px-3"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-orange-500/60 text-[9px] font-bold text-orange-400">●</span>
        <span className="hidden md:inline">Hub</span>
      </div>

      {/* Undo / Redo */}
      <div className="flex items-center gap-1 rounded-2xl border border-zinc-700 bg-zinc-800/60 px-2 py-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className={`flex flex-1 items-center justify-center rounded-xl py-1 text-sm transition ${
            canUndo ? "text-slate-300 hover:bg-zinc-700 hover:text-orange-300" : "cursor-not-allowed text-zinc-600"
          }`}
        >
          ←
        </button>
        <div className="h-4 w-px bg-zinc-700" />
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className={`flex flex-1 items-center justify-center rounded-xl py-1 text-sm transition ${
            canRedo ? "text-slate-300 hover:bg-zinc-700 hover:text-orange-300" : "cursor-not-allowed text-zinc-600"
          }`}
        >
          →
        </button>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="hidden items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs text-zinc-500 transition hover:border-red-500/40 hover:text-red-400 md:flex"
      >
        Reset Canvas
      </button>

      {activeTool === "text" && (
        <p className="hidden px-1 text-[9px] leading-tight text-orange-400/70 md:block">
          Click the canvas to place text
        </p>
      )}
      {activeTool === "draw" && (
        <p className="mt-1 hidden px-1 text-[9px] leading-tight text-orange-400/70 md:block">
          Click and drag to draw freely
        </p>
      )}
    </div>
  );
}

// ── Canvas inner component ─────────────────────────────────
type CanvasProps = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  onNodeClick: NodeMouseHandler;
  onConnect: (connection: Connection) => void;
  onDropSavedItem: (item: SavedItem, position: { x: number; y: number }) => void;
  addNode: (type: string, pos: { x: number; y: number }) => void;
  activeTool: ActiveTool;
  setActiveTool: (t: ActiveTool) => void;
  drawColor: string;
  drawnPaths: DrawPath[];
  onStrokeComplete: (path: DrawPath) => void;
};

function WorkspaceCanvas({
  nodes, edges, onNodesChange, onEdgesChange, onNodeClick, onConnect, onDropSavedItem,
  addNode, activeTool, setActiveTool, drawColor, drawnPaths, onStrokeComplete,
}: CanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const currentColorRef = useRef(drawColor);
  // Ref keeps ResizeObserver callback from going stale
  const drawnPathsRef = useRef(drawnPaths);
  useEffect(() => { drawnPathsRef.current = drawnPaths; }, [drawnPaths]);

  // Track latest drawColor in a ref so closures always see current value
  useEffect(() => { currentColorRef.current = drawColor; }, [drawColor]);

  const redrawAll = useCallback((paths: DrawPath[], live?: DrawPath) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const { points, color } of live ? [...paths, live] : paths) {
      if (points.length < 2) continue;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    }
  }, []);

  // Sync canvas pixel dimensions on mount and whenever the element is resized
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const syncSize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;
      redrawAll(drawnPathsRef.current);
    };
    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [redrawAll]);

  // Redraw whenever committed paths change (no resize, just repaint)
  useEffect(() => {
    redrawAll(drawnPaths);
  }, [drawnPaths, redrawAll]);

  const onDrawDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== "draw") return;
    isDrawingRef.current = true;
    currentColorRef.current = drawColor;
    const r = e.currentTarget.getBoundingClientRect();
    currentPathRef.current = [{ x: e.clientX - r.left, y: e.clientY - r.top }];
  }, [activeTool, drawColor]);

  const onDrawMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool !== "draw") return;
    const r = e.currentTarget.getBoundingClientRect();
    currentPathRef.current.push({ x: e.clientX - r.left, y: e.clientY - r.top });
    redrawAll(drawnPaths, { points: currentPathRef.current, color: currentColorRef.current });
  }, [activeTool, drawnPaths, redrawAll]);

  const onDrawUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentPathRef.current.length > 1) {
      onStrokeComplete({ points: currentPathRef.current, color: currentColorRef.current });
    }
    currentPathRef.current = [];
  }, [onStrokeComplete]);

  const onPaneClick = useCallback((e: React.MouseEvent) => {
    if (activeTool !== "text") return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode("text", position);
    setActiveTool(null);
  }, [activeTool, screenToFlowPosition, addNode, setActiveTool]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rfType = e.dataTransfer.getData("application/reactflow");
    if (rfType) {
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(rfType, position);
      return;
    }
    const savedData = e.dataTransfer.getData("application/core-saved-item");
    if (savedData) {
      try {
        const item = JSON.parse(savedData) as SavedItem;
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        onDropSavedItem(item, position);
      } catch {}
    }
  }, [screenToFlowPosition, addNode, onDropSavedItem]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", cursor: activeTool === "text" ? "crosshair" : "default" }}>
      <canvas
        ref={drawCanvasRef}
        onMouseDown={onDrawDown}
        onMouseMove={onDrawMove}
        onMouseUp={onDrawUp}
        onMouseLeave={onDrawUp}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: activeTool === "draw" ? "all" : "none",
          cursor: activeTool === "draw" ? "crosshair" : "default",
          zIndex: 5,
          touchAction: "none",
        }}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onConnect={onConnect}
        connectionMode="loose"
        defaultEdgeOptions={{
          style: { stroke: "rgba(255,255,255,0.65)", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.65)", width: 12, height: 12 },
        }}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ background: "#0d0d0d" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="rgba(255,255,255,0.18)" />
        <Controls style={{ background: "rgba(39,39,42,0.95)", border: "1px solid rgba(99,99,102,0.6)", borderRadius: "12px" }} />
        <MiniMap
          className="hidden md:block"
          style={{ background: "rgba(9,9,11,0.9)", border: "1px solid rgba(63,63,70,0.8)", borderRadius: "12px" }}
          nodeColor="rgba(249,115,22,0.4)"
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  );
}

// ── Export controls ────────────────────────────────────────
function ExportControls({ nodes }: { nodes: Node[] }) {
  const [exporting, setExporting] = useState(false);

  function downloadPNG() {
    const viewport = document.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewport) return;
    setExporting(true);
    const bounds = getNodesBounds(nodes);
    const W = 1600, H = 900;
    const vp = getViewportForBounds(bounds, W, H, 0.4, 2, 48);
    toPng(viewport, {
      width: W,
      height: H,
      style: {
        width: `${W}px`,
        height: `${H}px`,
        transform: `translate(${vp.x}px,${vp.y}px) scale(${vp.zoom})`,
      },
      backgroundColor: "#0d0d0d",
    }).then((url) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `core-canvas-${Date.now()}.png`;
      a.click();
    }).finally(() => setExporting(false));
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-300">Export</span>
        {exporting && (
          <svg className="w-4 h-4 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <button
          onClick={downloadPNG}
          disabled={exporting}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-2xl border border-zinc-700 bg-zinc-800/60 text-xs text-zinc-300 hover:border-orange-500/40 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400 shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Download PNG
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
export default function WorkspacePage() {
  const [mounted, setMounted] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [activeDocument, setActiveDocument] = useState<DocumentData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  const [textColor, setTextColor] = useState("#f1f5f9");
  const [drawColor, setDrawColor] = useState("#f97316");
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction[]>([]);
  const [drawnPaths, setDrawnPaths] = useState<DrawPath[]>(() => {
    try {
      const stored = localStorage.getItem("core_canvas_paths");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate legacy format [{x,y}[]] → DrawPath[]
        if (Array.isArray(parsed) && parsed[0] && Array.isArray(parsed[0])) {
          return (parsed as { x: number; y: number }[][]).map((pts) => ({ points: pts, color: "#fb923c" }));
        }
        return parsed as DrawPath[];
      }
    } catch {}
    return [];
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const initial = buildGraph();
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  // Mount: restore saved items + full canvas state
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem("core_saved_items");
      if (storedItems) setSavedItems(JSON.parse(storedItems) as SavedItem[]);

      const storedNodes = localStorage.getItem("core_canvas_nodes");
      const storedEdges = localStorage.getItem("core_canvas_edges");
      if (storedNodes && storedEdges) {
        setNodes(JSON.parse(storedNodes) as Node[]);
        setEdges(JSON.parse(storedEdges) as Edge[]);
      }
    } catch {}
    setMounted(true);
  }, [setNodes, setEdges]);

  // Autosave canvas whenever nodes or edges change
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("core_canvas_nodes", JSON.stringify(nodes));
      localStorage.setItem("core_canvas_edges", JSON.stringify(edges));
    } catch {}
  }, [nodes, edges, mounted]);

  // Persist saved items whenever they change
  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem("core_saved_items", JSON.stringify(savedItems)); } catch {}
  }, [savedItems, mounted]);

  // Autosave drawn paths
  useEffect(() => {
    try { localStorage.setItem("core_canvas_paths", JSON.stringify(drawnPaths)); } catch {}
  }, [drawnPaths]);

  const handleRemove = useCallback((id: string) => {
    setSavedItems((current) => {
      const updated = current.filter((item) => item.id !== id);
      try { localStorage.setItem("core_saved_items", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.id === HUB_ID) return;
    const item = savedItems.find((s) => s.id === node.id);
    if (!item) return;
    setActiveDocument({ id: item.id, title: item.title, content: `Saved at ${item.savedAt}`, tags: [] });
  }, [activeTool, savedItems]);

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position,
      data: { label: type === "hub" ? "CORE" : "", color: type === "text" ? textColor : undefined },
    };
    setNodes((nds) => nds.concat(newNode));
    setUndoStack((s) => [...s, { kind: "node", node: newNode }]);
    setRedoStack([]);
  }, [setNodes, textColor]);

  const resetCanvas = useCallback(() => {
    const { nodes: n, edges: e } = buildGraph();
    setNodes(n);
    setEdges(e);
    setDrawnPaths([]);
    setUndoStack([]);
    setRedoStack([]);
    setShowResetConfirm(false);
    try {
      localStorage.removeItem("core_canvas_nodes");
      localStorage.removeItem("core_canvas_edges");
      localStorage.removeItem("core_canvas_paths");
    } catch {}
  }, [setNodes, setEdges]);

  const onDropSavedItem = useCallback((item: SavedItem, position: { x: number; y: number }) => {
    const nodeId = `saved-${item.id}-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type: "box",
      position,
      data: { label: `${item.title}\n\nSaved: ${item.savedAt}` },
    };
    setNodes((nds) => nds.concat(newNode));
    setUndoStack((s) => [...s, { kind: "node", node: newNode }]);
    setRedoStack([]);
  }, [setNodes]);

  const onStrokeComplete = useCallback((path: DrawPath) => {
    setDrawnPaths((p) => [...p, path]);
    setUndoStack((s) => [...s, { kind: "draw", path }]);
    setRedoStack([]);
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({
      ...connection,
      style: { stroke: "rgba(255,255,255,0.65)", strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.65)", width: 12, height: 12 },
    }, eds));
  }, [setEdges]);

  const undoAction = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    if (last.kind === "node") {
      setNodes((nds) => nds.filter((n) => n.id !== last.node.id));
    } else {
      setDrawnPaths((p) => p.slice(0, -1));
    }
    setRedoStack((r) => [...r, last]);
    setUndoStack((s) => s.slice(0, -1));
  }, [undoStack, setNodes]);

  const redoAction = useCallback(() => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    if (last.kind === "node") {
      setNodes((nds) => nds.some((n) => n.id === last.node.id) ? nds : nds.concat(last.node));
    } else {
      setDrawnPaths((p) => [...p, last.path]);
    }
    setUndoStack((u) => [...u, last]);
    setRedoStack((s) => s.slice(0, -1));
  }, [redoStack, setNodes]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Back / logo */}
      <div className="absolute left-5 top-5 z-10 flex items-center gap-3">
        <a
          href="/"
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-orange-500/30 bg-zinc-950/80 shadow-lg shadow-orange-950/20 transition hover:scale-105"
          aria-label="Go to login"
        >
          <img src="/Backs.png" alt="Back to login" className="h-full w-full object-cover spin-slow" />
        </a>
        <span className="text-sm font-semibold uppercase tracking-[0.35em] text-orange-500">CORE</span>
      </div>

      {/* Canvas + tool sidebar — client only */}
      {mounted && (
        <ReactFlowProvider>
          <WorkspaceCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onConnect={onConnect}
            onDropSavedItem={onDropSavedItem}
            addNode={addNode}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            drawColor={drawColor}
            drawnPaths={drawnPaths}
            onStrokeComplete={onStrokeComplete}
          />
          <ToolSidebar
            activeTool={activeTool} setActiveTool={setActiveTool}
            textColor={textColor} setTextColor={setTextColor}
            drawColor={drawColor} setDrawColor={setDrawColor}
            onUndo={undoAction} onRedo={redoAction}
            canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
            onReset={() => setShowResetConfirm(true)}
            addNode={addNode}
          />
        </ReactFlowProvider>
      )}

      {/* Mobile panel toggle FAB */}
      <button
        onClick={() => setMobilePanelOpen((o) => !o)}
        className="absolute bottom-4 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/40 bg-zinc-900/90 text-lg text-orange-400 shadow-lg md:hidden"
        aria-label="Toggle panels"
      >
        {mobilePanelOpen ? "✕" : "☰"}
      </button>

      {/* Mobile backdrop */}
      {mobilePanelOpen && (
        <div
          className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobilePanelOpen(false)}
        />
      )}

      {/* Right sidebar */}
      <div className={`absolute right-0 top-0 z-20 flex h-full w-72 flex-col gap-4 overflow-y-auto bg-zinc-950 p-4 pt-20 transition-transform duration-200 ease-out md:h-auto md:translate-x-0 md:bg-transparent md:overflow-visible md:p-0 md:pt-0 md:right-5 md:top-5 ${mobilePanelOpen ? "translate-x-0" : "translate-x-full"}`}>
        <a
          href="/search"
          className="block rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-orange-500/40"
        >
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
            Searchspace
          </span>
        </a>
        <SavedPanel
          items={savedItems}
          openItem={(id) => {
            const item = savedItems.find((s) => s.id === id);
            if (item) setActiveDocument({ id: item.id, title: item.title, content: `Saved at ${item.savedAt}`, tags: [] });
          }}
          onRemove={handleRemove}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((s) => !s)}
        />
        <NotesPanel />
        <ExportControls nodes={nodes} />
      </div>

      <DocumentViewer
        document={activeDocument}
        onClose={() => setActiveDocument(null)}
        onSummarize={() => {}}
      />

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col gap-5 rounded-3xl border border-zinc-700 bg-zinc-900 p-7 shadow-2xl" style={{ minWidth: 320 }}>
            <p className="text-sm font-semibold text-white">Reset your canvas?</p>
            <p className="text-xs text-zinc-400">This will remove all nodes and connections you have placed. This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={resetCanvas}
                className="flex-1 rounded-2xl bg-red-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-orange-500/40 hover:text-white"
              >
                Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
