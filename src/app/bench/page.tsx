"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useClerk, useUser } from "@clerk/nextjs";
import LibraryPanel from "@/components/LibraryPanel";
import NewsPanel from "@/components/NewsPanel";
import CareersPanel from "@/components/CareersPanel";
import {
  Home,
  Search,
  Bell,
  BookOpen,
  MessageSquare,
  Clock,
  Star,
  Settings,
  ChevronRight,
  ChevronLeft,
  Plus,
  LayoutGrid,
  FileText,
  Bot,
  PenTool,
  Share2,
  Users,
  Target,
  Zap,
  ClipboardList,
  Newspaper,
  Play,
  Briefcase,
  Mail,
  Power,
  GripVertical,
  Code2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
type NavItem = {
  icon: React.ReactNode;
  label: string;
  href?: string;
  external?: boolean;
  active?: boolean;
};

// ── Sidebar icon nav items ─────────────────────────────────
const iconNavItems: NavItem[] = [
  { icon: <Home size={18} />, label: "Home", active: true },
  { icon: <Bell size={18} />, label: "Notifications" },
  { icon: <Code2 size={18} />, label: "Search" },
  { icon: <MessageSquare size={18} />, label: "Chat" },
  { icon: <Clock size={18} />, label: "Recent" },
  { icon: <Star size={18} />, label: "Favorites" },
];

const iconNavBottom: NavItem[] = [
  { icon: <Settings size={18} />, label: "Settings" },
];

// ── Side panel items ───────────────────────────────────────
const workspaceItems = [
  { icon: <LayoutGrid size={14} />, label: "Tutorial" },
  { icon: <Target size={14} />, label: "Goals" },
  { icon: <ClipboardList size={14} />, label: "Planner" },
  { icon: <Zap size={14} />, label: "Stocks" },
  { icon: <BookOpen size={14} />, label: "Library" },
  { icon: <BookOpen size={14} />, label: "Bible" },
  { icon: <Newspaper size={14} />, label: "News" },
  { icon: <Play size={14} />, label: "Clip.bun", href: "https://clipbun-io.netlify.app/", external: true },
  { icon: <Briefcase size={14} />, label: "Careers" },
  { icon: <Users size={14} />, label: "Team" },
  { icon: <Mail size={14} />, label: "Newsletter" },
  { divider: true },
  { icon: <FileText size={14} />, label: "Reports", danger: true },
];

// ── Recent items ───────────────────────────────────────────
const recentItems = [
  { label: "Research Notes Q3", type: "doc", updated: "2h ago", panel: "Library" },
  { label: "Oracle Query — Ethics", type: "ai", updated: "Yesterday", panel: "Goals" },
  { label: "Project Roadmap", type: "doc", updated: "3d ago", panel: "Planner" },
  { label: "Bible Study — Romans", type: "bible", updated: "Last week", panel: "Bible" },
];

// ── Quick actions ──────────────────────────────────────────
const quickActions = [
  { label: "Hyrum AI", icon: <Bot size={16} />, href: "/search" },
  { label: "Core Canvas", icon: <PenTool size={16} />, href: "/workspace" },
  { label: "Communion", icon: <Share2 size={16} />, href: "/communion" },
];

// ── Bible book data ────────────────────────────────────────
const OLD_TESTAMENT: { name: string; chapters: number }[] = [
  { name: "Genesis", chapters: 50 }, { name: "Exodus", chapters: 40 },
  { name: "Leviticus", chapters: 27 }, { name: "Numbers", chapters: 36 },
  { name: "Deuteronomy", chapters: 34 }, { name: "Joshua", chapters: 24 },
  { name: "Judges", chapters: 21 }, { name: "Ruth", chapters: 4 },
  { name: "1 Samuel", chapters: 31 }, { name: "2 Samuel", chapters: 24 },
  { name: "1 Kings", chapters: 22 }, { name: "2 Kings", chapters: 25 },
  { name: "1 Chronicles", chapters: 29 }, { name: "2 Chronicles", chapters: 36 },
  { name: "Ezra", chapters: 10 }, { name: "Nehemiah", chapters: 13 },
  { name: "Esther", chapters: 10 }, { name: "Job", chapters: 42 },
  { name: "Psalms", chapters: 150 }, { name: "Proverbs", chapters: 31 },
  { name: "Ecclesiastes", chapters: 12 }, { name: "Song of Solomon", chapters: 8 },
  { name: "Isaiah", chapters: 66 }, { name: "Jeremiah", chapters: 52 },
  { name: "Lamentations", chapters: 5 }, { name: "Ezekiel", chapters: 48 },
  { name: "Daniel", chapters: 12 }, { name: "Hosea", chapters: 14 },
  { name: "Joel", chapters: 3 }, { name: "Amos", chapters: 9 },
  { name: "Obadiah", chapters: 1 }, { name: "Jonah", chapters: 4 },
  { name: "Micah", chapters: 7 }, { name: "Nahum", chapters: 3 },
  { name: "Habakkuk", chapters: 3 }, { name: "Zephaniah", chapters: 3 },
  { name: "Haggai", chapters: 2 }, { name: "Zechariah", chapters: 14 },
  { name: "Malachi", chapters: 4 },
];

const NEW_TESTAMENT: { name: string; chapters: number }[] = [
  { name: "Matthew", chapters: 28 }, { name: "Mark", chapters: 16 },
  { name: "Luke", chapters: 24 }, { name: "John", chapters: 21 },
  { name: "Acts", chapters: 28 }, { name: "Romans", chapters: 16 },
  { name: "1 Corinthians", chapters: 16 }, { name: "2 Corinthians", chapters: 13 },
  { name: "Galatians", chapters: 6 }, { name: "Ephesians", chapters: 6 },
  { name: "Philippians", chapters: 4 }, { name: "Colossians", chapters: 4 },
  { name: "1 Thessalonians", chapters: 5 }, { name: "2 Thessalonians", chapters: 3 },
  { name: "1 Timothy", chapters: 6 }, { name: "2 Timothy", chapters: 4 },
  { name: "Titus", chapters: 3 }, { name: "Philemon", chapters: 1 },
  { name: "Hebrews", chapters: 13 }, { name: "James", chapters: 5 },
  { name: "1 Peter", chapters: 5 }, { name: "2 Peter", chapters: 3 },
  { name: "1 John", chapters: 5 }, { name: "2 John", chapters: 1 },
  { name: "3 John", chapters: 1 }, { name: "Jude", chapters: 1 },
  { name: "Revelation", chapters: 22 },
];

const MISSIONS = [
  "Read the Entire Bible",
  "Evangelize to a stranger in person",
  "Start a Bible study",
  "Start a nonprofit charity",
  "Start a Revival",
];

export default function BenchPage() {
  const [activeIcon, setActiveIcon] = useState("Home");
  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(null);
  const [goalItems, setGoalItems] = useState<{ id: number; text: string; done: boolean }[]>(() => {
    try {
      const stored = localStorage.getItem("bench_goals");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [goalInput, setGoalInput] = useState("");
  const [missionChecked, setMissionChecked] = useState<boolean[]>([false, false, false, false, false]);
  const [missionCompleted, setMissionCompleted] = useState<boolean[]>(() => {
    try { const s = localStorage.getItem("bench_missions"); return s ? JSON.parse(s) : [false, false, false, false, false]; } catch { return [false, false, false, false, false]; }
  });
  const [missionFlash, setMissionFlash] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterError, setNewsletterError] = useState("");
  const [newsletterAlready, setNewsletterAlready] = useState(() => {
    try { return !!localStorage.getItem("bench_newsletter_email"); } catch { return false; }
  });
  const [reportCategory, setReportCategory] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "loading" | "submitted" | "error">("idle");
  const [reportError, setReportError] = useState("");
  const dragGoalId = useRef<number | null>(null);
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [plannerEvents, setPlannerEvents] = useState<Record<string, string[]>>(() => {
    try { const s = localStorage.getItem("bench_planner"); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [eventInput, setEventInput] = useState("");
  const [stockQuotes, setStockQuotes] = useState<any[]>([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [stocksError, setStocksError] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [stockChart, setStockChart] = useState<{ closes: number[]; meta: any } | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [bibleTestament, setBibleTestament] = useState<"old" | "new">("old");
  const [bibleBook, setBibleBook] = useState<string | null>(null);
  const [bibleChapter, setBibleChapter] = useState<number | null>(null);
  const [bibleTranslation, setBibleTranslation] = useState("kjv");
  const [bibleContent, setBibleContent] = useState<{ reference: string; text: string; verses: Array<{ verse: number; text: string }> } | null>(null);
  const [bibleLoading, setBibleLoading] = useState(false);
  const [bibleError, setBibleError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clipbunModalOpen, setClipbunModalOpen] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [notesSaveStatus, setNotesSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);
  const favRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [barHeights, setBarHeights] = useState([3, 3, 3, 3]);
  const settingsRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const { signOut } = useClerk();
  const { user } = useUser();

  useEffect(() => {
    try { localStorage.setItem("bench_goals", JSON.stringify(goalItems)); } catch {}
  }, [goalItems]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("core_my_notes");
      if (stored !== null) setNotesText(stored);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("bench_planner", JSON.stringify(plannerEvents)); } catch {}
  }, [plannerEvents]);

  useEffect(() => {
    if (activeSidebarItem !== "Stocks") return;
    setStocksLoading(true);
    setStocksError(false);
    fetch("/api/stocks")
      .then(r => r.json())
      .then(d => { setStockQuotes(d.quotes ?? []); setStocksLoading(false); })
      .catch(() => { setStocksError(true); setStocksLoading(false); });
  }, [activeSidebarItem]);

  useEffect(() => {
    if (!selectedStock) return;
    setChartLoading(true);
    setStockChart(null);
    fetch(`/api/stocks/chart?symbol=${selectedStock}`)
      .then(r => r.json())
      .then(d => { setStockChart({ closes: d.closes ?? [], meta: d.meta ?? {} }); setChartLoading(false); })
      .catch(() => setChartLoading(false));
  }, [selectedStock]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(e.target as Node)) setChatOpen(false);
    }
    if (chatOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chatOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) setRecentOpen(false);
    }
    if (recentOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [recentOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (favRef.current && !favRef.current.contains(e.target as Node)) setFavOpen(false);
    }
    if (favOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [favOpen]);

  function startVisualizer() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const bins = [2, 6, 12, 20];
    function loop() {
      analyser!.getByteFrequencyData(data);
      setBarHeights(bins.map((i) => Math.max(3, (data[i] / 255) * 16)));
      rafRef.current = requestAnimationFrame(loop);
    }
    loop();
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    }
    if (isPlaying) {
      audio.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setBarHeights([3, 3, 3, 3]);
      setIsPlaying(false);
    } else {
      await audioCtxRef.current.resume();
      try {
        await audio.play();
      } catch (err) {
        // AbortError fires when pause() interrupts a pending play() promise — safe to ignore
        if ((err as Error).name === "AbortError") return;
        throw err;
      }
      startVisualizer();
      setIsPlaying(true);
    }
  }

  const fetchBibleChapter = async (book: string, chapter: number) => {
    setBibleChapter(chapter);
    setBibleLoading(true);
    setBibleError("");
    setBibleContent(null);
    try {
      const res = await fetch(`/api/bible?reference=${encodeURIComponent(`${book} ${chapter}`)}&translation=${bibleTranslation}`);
      const data = await res.json() as { reference?: string; text?: string; verses?: Array<{ verse: number; text: string }>; error?: string };
      if (!res.ok) { setBibleError(data.error ?? "Failed to fetch"); return; }
      setBibleContent({ reference: data.reference ?? "", text: data.text ?? "", verses: data.verses ?? [] });
    } catch {
      setBibleError("Could not reach Bible API.");
    } finally {
      setBibleLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-slate-100 font-[var(--font-geist-sans)] relative">
      <style>{`
        @keyframes soundbar-idle {
          from { height: 2px; }
          to   { height: 13px; }
        }
      `}</style>
      <audio
        ref={audioRef}
        src="/song.m4a"
        onEnded={() => {
          setIsPlaying(false);
          setBarHeights([3, 3, 3, 3]);
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
        }}
      />
      {/* ── Background video ────────────────────────────────── */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ objectPosition: "65% center" }}
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/ttower.mp4" type="video/mp4" />
      </video>


      {/* ── Ultra-thin icon sidebar ────────────────────────── */}
      <aside className="flex flex-col items-center justify-between w-12 shrink-0 bg-black border-r border-orange-500/10 py-3 z-30">
        {/* Top: Logo mark */}
        <div className="flex flex-col items-center gap-1">
          <Link href="/" className="w-7 h-7 rounded-lg overflow-hidden mb-2 shadow-lg shadow-orange-900/40 block">
            <Image src="/Backs.png" alt="Core" width={28} height={28} className="w-full h-full object-cover spin-slow" />
          </Link>

          {/* Icon nav */}
          <nav className="flex flex-col items-center gap-1 mt-1">
            {iconNavItems.map((item) => (
              <button
                key={item.label}
                title={item.label}
                onClick={() => {
                    if (item.label === "Search") {
                      setTechOpen((o) => !o);
                      return;
                    }
                    if (item.label === "Notifications") {
                      setNotifOpen((o) => !o);
                      return;
                    }
                    if (item.label === "Chat") {
                      setChatOpen((o) => !o);
                      return;
                    }
                    if (item.label === "Recent") {
                      setRecentOpen((o) => !o);
                      return;
                    }
                    if (item.label === "Favorites") {
                      setFavOpen((o) => !o);
                      return;
                    }
                    setActiveIcon(item.label);
                    if (item.label === "Home") setSidebarOpen(true);
                  }}
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 group relative
                  ${activeIcon === item.label
                    ? "bg-orange-500/20 text-orange-400"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                  }
                `}
              >
                {item.icon}
                {/* Active indicator dot */}
                {activeIcon === item.label && item.label !== "Search" && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-orange-500 rounded-r-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom: Settings */}
        <div className="flex flex-col items-center gap-1" ref={settingsRef}>
          {/* Sound bars */}
          <button
            title={isPlaying ? "Pause music" : "Play music"}
            onClick={togglePlay}
            className="w-8 h-8 rounded-lg flex items-end justify-center gap-[2.5px] pb-[7px] hover:bg-zinc-800/60 transition-all mb-0.5"
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-[3px] rounded-full transition-colors duration-300 ${
                  isPlaying ? "bg-orange-400" : "bg-zinc-500"
                }`}
                style={
                  isPlaying
                    ? { height: `${barHeights[i]}px`, transition: "height 0.06s ease-out" }
                    : {
                        animationName: "soundbar-idle",
                        animationDuration: `${0.65 + i * 0.18}s`,
                        animationTimingFunction: "ease-in-out",
                        animationIterationCount: "infinite",
                        animationDirection: "alternate",
                        animationDelay: `${i * 0.1}s`,
                      }
                }
              />
            ))}
          </button>

          <div className="relative">
            <button
              title="Settings"
              onClick={() => setSettingsOpen((o) => !o)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-all duration-150"
            >
              <Settings size={18} />
            </button>

            {/* Logout popup */}
            {settingsOpen && (
              <div className="absolute bottom-0 left-12 w-36 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                <button
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                  <Power size={14} className="text-red-500" />
                  Log out
                </button>
              </div>
            )}
          </div>
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full mt-2 ring-1 ring-orange-500/30 hover:ring-orange-500/60 transition-all overflow-hidden cursor-pointer shrink-0">
            {user?.imageUrl ? (
              <Image src={user.imageUrl} alt="Profile" width={28} height={28} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center">
                <span className="text-white text-[10px] font-semibold">
                  {user?.firstName?.[0] ?? "?"}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Notifications panel ─────────────────────────── */}
      {notifOpen && (
        <div ref={notifRef} className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-row items-center">
          <div className="w-72 rounded-l-2xl border border-r-0 border-orange-500/20 bg-zinc-950/95 backdrop-blur-sm px-5 py-5 shadow-2xl shadow-black/70 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400">Notifications</p>
              <button onClick={() => setNotifOpen(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors text-base leading-none">&times;</button>
            </div>
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-zinc-600">
              <Bell size={28} className="text-zinc-700" />
              <p className="text-xs text-zinc-500">You have no notifications</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat panel ───────────────────────────────────── */}
      {chatOpen && (
        <div ref={chatRef} className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-row items-center">
          <div className="w-72 rounded-l-2xl border border-r-0 border-orange-500/20 bg-zinc-950/95 backdrop-blur-sm px-5 py-5 shadow-2xl shadow-black/70 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400">Chat</p>
              <button onClick={() => setChatOpen(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors text-base leading-none">&times;</button>
            </div>
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <MessageSquare size={28} className="text-zinc-700" />
              <p className="text-xs text-zinc-500">No active chats</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent panel ─────────────────────────────────── */}
      {recentOpen && (
        <div ref={recentRef} className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-row items-center">
          <div className="w-72 rounded-l-2xl border border-r-0 border-orange-500/20 bg-zinc-950/95 backdrop-blur-sm px-5 py-5 shadow-2xl shadow-black/70 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400">Recent</p>
              <button onClick={() => setRecentOpen(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors text-base leading-none">&times;</button>
            </div>
            {recentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Clock size={28} className="text-zinc-700" />
                <p className="text-xs text-zinc-500">No recent activity</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentItems.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => { setActiveSidebarItem(r.panel); setRecentOpen(false); }}
                    className="flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 transition-all"
                  >
                    <Clock size={14} className="text-zinc-600 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-medium text-zinc-200 truncate">{r.label}</span>
                      <span className="text-[10px] text-zinc-500">{r.updated}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Favorites panel ──────────────────────────────── */}
      {favOpen && (
        <div ref={favRef} className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-row items-center">
          <div className="w-72 rounded-l-2xl border border-r-0 border-orange-500/20 bg-zinc-950/95 backdrop-blur-sm px-5 py-5 shadow-2xl shadow-black/70 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400">Favorites</p>
              <button onClick={() => setFavOpen(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors text-base leading-none">&times;</button>
            </div>
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Star size={28} className="text-zinc-700" />
              <p className="text-xs text-zinc-500">No favorites saved yet</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Built-with panel — shown only when Code icon is clicked ── */}
      {techOpen && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-row items-center">
          <div className="w-56 rounded-l-2xl border border-r-0 border-orange-500/20 bg-zinc-950/95 backdrop-blur-sm px-5 py-5 shadow-2xl shadow-black/70 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400">Built With</p>
              <button onClick={() => setTechOpen(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors text-base leading-none">&times;</button>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { name: "Next.js",         color: "text-white" },
                { name: "TypeScript",      color: "text-blue-300" },
                { name: "Node.js",         color: "text-green-400" },
                { name: "Tailwind CSS",    color: "text-cyan-400" },
                { name: "Clerk",           color: "text-violet-400" },
                { name: "Stripe",          color: "text-indigo-400" },
                { name: "Claude",          color: "text-purple-400" },
                { name: "Ollama + Hermes", color: "text-zinc-300" },
                { name: "Oracle APIs",     color: "text-red-400" },
                { name: "VS Code",         color: "text-blue-400" },
                { name: "HubSpot",         color: "text-orange-400" },
              ].map((t) => (
                <div key={t.name} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-orange-500/50 shrink-0" />
                  <span className={`text-xs font-medium ${t.color}`}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Secondary side panel ──────────────────────────── */}
      {sidebarOpen && (
        <aside className="absolute left-12 top-0 h-full md:relative md:left-auto md:top-auto md:h-auto flex flex-col w-52 shrink-0 bg-black border-r border-orange-500/10 overflow-y-auto z-20">
          {/* Workspace header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-orange-500/10">
            <div className="flex items-center gap-2 min-w-0">
              <Link href="/" className="w-5 h-5 rounded overflow-hidden shrink-0 block">
                <Image src="/Backs.png" alt="Core" width={20} height={20} className="w-full h-full object-cover spin-slow" />
              </Link>
              <span className="text-xs font-semibold text-zinc-200 truncate">Babelcore</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Nav items */}
          <div className="flex flex-col px-2 py-2 gap-0.5">
            {workspaceItems.map((item, i) => {
              if ((item as any).divider) return <div key={`divider-${i}`} className="my-1.5 border-t border-zinc-800/60" />;
              const isDanger = (item as any).danger;
              const isActive = activeSidebarItem === item.label;
              const content = (
                <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all cursor-pointer group ${
                  isDanger
                    ? "text-zinc-400 hover:bg-red-950/40 hover:text-red-400"
                    : isActive
                    ? "bg-orange-500/15 text-orange-300"
                    : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                }`}>
                  <span className={`transition-colors ${
                    isDanger ? "text-zinc-600 group-hover:text-red-500" : isActive ? "text-orange-400" : "text-zinc-600 group-hover:text-orange-400"
                  }`}>{item.icon}</span>
                  {item.label}
                </div>
              );
              return item.href ? (
                item.external ? (
                  item.label === "Clip.bun" ? (
                    <div key={item.label} onClick={() => setClipbunModalOpen(true)}>{content}</div>
                  ) : (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">{content}</a>
                  )
                ) : (
                  <Link key={item.label} href={item.href}>{content}</Link>
                )
              ) : (
                <div key={item.label} onClick={() => setActiveSidebarItem((prev) => prev === item.label ? null : (item.label ?? null))}>{content}</div>
              );
            })}
          </div>

          {/* Dynamic Notes item */}
          {notesVisible && (
            <div className="px-2 mt-1">
              <div
                onClick={() => setActiveSidebarItem((prev) => prev === "Notes" ? null : "Notes")}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all cursor-pointer group ${
                  activeSidebarItem === "Notes"
                    ? "bg-orange-500/15 text-orange-300"
                    : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                }`}
              >
                <span className={`transition-colors ${
                  activeSidebarItem === "Notes" ? "text-orange-400" : "text-zinc-600 group-hover:text-orange-400"
                }`}><FileText size={14} /></span>
                Notes
              </div>
            </div>
          )}

          {/* Add section */}
          <div className="px-2 mt-2">
            <button
              onClick={() => {
                setNotesVisible(true);
                setActiveSidebarItem("Notes");
              }}
              className="flex items-center gap-2 px-2 py-1.5 w-full rounded-md text-xs text-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-300 transition-all"
            >
              <Plus size={12} />
              Add section
            </button>
          </div>

          {/* Recent */}
          <div className="px-3 mt-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-1.5">Recent</p>
            <div className="flex flex-col gap-0.5">
              {recentItems.map((item) => {
                const isRecentActive = activeSidebarItem === item.panel;
                return (
                  <div
                    key={item.label}
                    onClick={() => setActiveSidebarItem((prev) => prev === item.panel ? null : item.panel)}
                    className={`flex items-center gap-2 px-1 py-1 rounded-md text-xs transition-all cursor-pointer ${
                      isRecentActive
                        ? "bg-orange-500/10 text-orange-300"
                        : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                      isRecentActive ? "bg-orange-400" : "bg-orange-500/50"
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      )}

      {/* ── Main area ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">

        {/* ── Top navbar ──────────────────────────────────── */}
        <header className="flex items-center justify-between h-10 shrink-0 px-4 bg-black border-b border-orange-500/10 z-10">
          {/* Left: breadcrumb / collapsed sidebar toggle */}
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center justify-center w-6 h-6 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
              >
                <ChevronRight size={14} />
              </button>
            )}
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span className="hover:text-zinc-300 cursor-pointer transition-colors">Core</span>
              <ChevronRight size={12} className="text-zinc-700" />
              <span className="text-zinc-300 font-medium">Bench</span>
            </div>
          </div>

          {/* Right: Core logo wordmark */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Link href="/" className="w-5 h-5 rounded overflow-hidden shadow-md shadow-orange-900/40 block">
                <Image src="/Backs.png" alt="Core" width={20} height={20} className="w-full h-full object-cover spin-slow" />
              </Link>
              <a
                href="https://www.hubspot.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold tracking-tight bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              >
                CORE
              </a>
            </div>
          </div>
        </header>

        {/* ── Page content ────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-8 py-6 bg-transparent">

          {/* Welcome header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight text-center sm:text-left">בָּבֶלְכּוֹר</h1>
            <p className="text-sm font-medium text-zinc-500 tracking-tight text-center sm:text-left">הָא נְפִילַיָּא דִּי אֱלָהָא</p>
          </div>

          {activeSidebarItem === "Tutorial" ? (
            /* Tutorial view */
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl bg-zinc-900/60 border border-orange-500/10 overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-600">
                  <Play size={48} className="text-orange-500/40" />
                  <span className="text-sm tracking-widest uppercase text-zinc-600">Video Tutorial</span>
                </div>
              </div>
            </div>
          ) : activeSidebarItem === "Goals" ? (
            /* Goals to-do view */
            <div className="flex flex-col gap-4 max-w-xl">
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Goals</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = goalInput.trim();
                  if (!text) return;
                  setGoalItems((prev) => [...prev, { id: Date.now(), text, done: false }]);
                  setGoalInput("");
                }}
                className="flex gap-2"
              >
                <input
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="Add a goal…"
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-orange-500/10 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/40"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-sm text-orange-300 hover:bg-orange-500/30 transition-all"
                >
                  Add
                </button>
              </form>
              <div className="flex flex-col gap-2">
                {goalItems.length === 0 && (
                  <p className="text-sm text-zinc-600 text-center py-6">No goals yet. Add one above.</p>
                )}
                {goalItems.map((goal) => (
                  <div
                    key={goal.id}
                    draggable
                    onDragStart={() => { dragGoalId.current = goal.id; }}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={() => {
                      if (dragGoalId.current === null || dragGoalId.current === goal.id) return;
                      setGoalItems((prev) => {
                        const from = prev.findIndex((g) => g.id === dragGoalId.current);
                        const to = prev.findIndex((g) => g.id === goal.id);
                        const next = [...prev];
                        next.splice(to, 0, next.splice(from, 1)[0]);
                        return next;
                      });
                      dragGoalId.current = null;
                    }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl bg-zinc-900/60 border border-orange-500/10 group cursor-default"
                  >
                    <GripVertical size={14} className="text-zinc-700 group-hover:text-zinc-500 cursor-grab active:cursor-grabbing shrink-0 transition-colors" />
                    <button
                      onClick={() => setGoalItems((prev) => prev.map((g) => g.id === goal.id ? { ...g, done: !g.done } : g))}
                      className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${
                        goal.done ? "bg-orange-500 border-orange-500" : "border-zinc-600 hover:border-orange-400"
                      }`}
                    />
                    <span className={`flex-1 text-sm transition-colors ${
                      goal.done ? "line-through text-zinc-600" : "text-zinc-200"
                    }`}>{goal.text}</span>
                    <button
                      onClick={() => setGoalItems((prev) => prev.filter((g) => g.id !== goal.id))}
                      className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Plus size={14} className="rotate-45" />
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Missions ── */}
              <div className="mt-2 border-t border-zinc-800 pt-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-orange-400">Missions</span>
                  <span className="text-[10px] text-zinc-600">Check off what you&apos;ve completed, then submit</span>
                </div>
                <div className="flex flex-col gap-2">
                  {MISSIONS.map((m, i) => (
                    <label
                      key={i}
                      className={`relative flex items-start gap-3 px-3 py-3 rounded-xl border select-none transition-all ${
                        missionCompleted[i]
                          ? "border-orange-500/30 bg-orange-500/5 cursor-default"
                          : missionChecked[i]
                          ? "border-orange-500/20 bg-zinc-900/80 cursor-pointer"
                          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={missionChecked[i]}
                        disabled={missionCompleted[i]}
                        onChange={() => setMissionChecked((prev) => prev.map((c, idx) => idx === i ? !c : c))}
                        className="mt-0.5 shrink-0 accent-orange-500"
                      />
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className={`text-sm font-medium leading-snug ${
                          missionCompleted[i] ? "line-through text-zinc-600" : "text-zinc-200"
                        }`}>
                          {i + 1}. {m}
                        </span>
                        {missionCompleted[i] && (
                          <span className="text-[10px] text-orange-400 font-semibold">Completed ✓</span>
                        )}
                      </div>
                      {missionCompleted[i] && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setMissionCompleted((prev) => {
                              const updated = prev.map((c, idx) => idx === i ? false : c);
                              try { localStorage.setItem("bench_missions", JSON.stringify(updated)); } catch {}
                              return updated;
                            });
                          }}
                          className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors text-sm leading-none mt-0.5"
                          title="Unsubmit mission"
                        >
                          ✕
                        </button>
                      )}
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (!missionChecked.some(Boolean)) return;
                    setMissionCompleted((prev) => {
                      const updated = prev.map((c, i) => c || missionChecked[i]);
                      try { localStorage.setItem("bench_missions", JSON.stringify(updated)); } catch {}
                      return updated;
                    });
                    setMissionChecked([false, false, false, false, false]);
                    setMissionFlash(true);
                    setTimeout(() => setMissionFlash(false), 2500);
                  }}
                  disabled={!missionChecked.some(Boolean)}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    missionChecked.some(Boolean)
                      ? "bg-orange-500/20 border-orange-500/40 text-orange-300 hover:bg-orange-500/30"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  Submit Completed Missions
                </button>
                {missionFlash && (
                  <p className="text-xs text-orange-400 text-center">Mission progress saved ✓</p>
                )}
              </div>
            </div>
          ) : activeSidebarItem === "Stocks" ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Stocks</h2>
              {stocksLoading && <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">Loading market data…</div>}
              {stocksError && <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load market data.</div>}
              {!stocksLoading && !stocksError && (
                <>
                  {/* Stock list table */}
                  <div className="rounded-2xl bg-zinc-900 border border-orange-500/10 overflow-hidden">
                    {/* Header — hide Change column on mobile */}
                    <div className="grid grid-cols-[2fr_1fr_1fr] sm:grid-cols-[2fr_1fr_1fr_1fr] px-3 sm:px-4 py-2 border-b border-zinc-800 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      <span>Symbol / Name</span>
                      <span className="text-right">Price</span>
                      <span className="hidden sm:block text-right">Change</span>
                      <span className="text-right">% Change</span>
                    </div>
                    {/* Rows */}
                    {stockQuotes.map((q) => {
                      const up = (q.regularMarketChange ?? 0) >= 0;
                      const pct = (q.regularMarketChangePercent ?? 0).toFixed(2);
                      const chg = (q.regularMarketChange ?? 0).toFixed(2);
                      const price = (q.regularMarketPrice ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      const isSelected = selectedStock === q.symbol;
                      return (
                        <button
                          key={q.symbol}
                          onClick={() => setSelectedStock(isSelected ? null : q.symbol)}
                          className={`grid grid-cols-[2fr_1fr_1fr] sm:grid-cols-[2fr_1fr_1fr_1fr] w-full px-3 sm:px-4 py-3 sm:py-2.5 border-b border-zinc-800/50 last:border-0 text-left transition-all touch-manipulation ${isSelected ? "bg-orange-500/10" : "hover:bg-zinc-800/50"}`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${up ? "bg-emerald-400" : "bg-red-400"}`} />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-100">{q.symbol}</p>
                              <p className="text-[10px] text-zinc-600 truncate">{q.shortName}</p>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-zinc-200 text-right self-center">${price}</p>
                          <p className={`hidden sm:block text-xs font-medium text-right self-center ${up ? "text-emerald-400" : "text-red-400"}`}>{up ? "+" : ""}{chg}</p>
                          <p className={`text-xs font-semibold text-right self-center ${up ? "text-emerald-400" : "text-red-400"}`}>
                            <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] ${up ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                              {up ? "▲" : "▼"} {Math.abs(Number(pct))}%
                            </span>
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Detail panel */}
                  {selectedStock && (() => {
                    const q = stockQuotes.find(x => x.symbol === selectedStock);
                    if (!q) return null;
                    const up = q.regularMarketChange >= 0;
                    const closes = stockChart?.closes.filter(Boolean) ?? [];
                    const min = closes.length ? Math.min(...closes) : 0;
                    const max = closes.length ? Math.max(...closes) : 1;
                    const W = 480; const H = 96; const pad = 8;
                    const pts = closes.map((v, i) => {
                      const x = pad + (i / Math.max(closes.length - 1, 1)) * (W - pad * 2);
                      const y = H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
                      return `${x},${y}`;
                    }).join(" ");
                    const fmt = (v: number) => v?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "—";
                    const fmtB = (v: number) => v >= 1e12 ? `$${(v/1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v/1e9).toFixed(2)}B` : "—";
                    const metrics = [
                      { label: "Open", value: `$${fmt(q.regularMarketOpen)}` },
                      { label: "Prev Close", value: `$${fmt(q.regularMarketPreviousClose)}` },
                      { label: "Day High", value: `$${fmt(q.regularMarketDayHigh)}` },
                      { label: "Day Low", value: `$${fmt(q.regularMarketDayLow)}` },
                      { label: "52W High", value: `$${fmt(q.fiftyTwoWeekHigh)}` },
                      { label: "52W Low", value: `$${fmt(q.fiftyTwoWeekLow)}` },
                      { label: "Volume", value: q.regularMarketVolume?.toLocaleString() ?? "—" },
                      { label: "Mkt Cap", value: fmtB(q.marketCap) },
                    ];
                    return (
                      <div className="rounded-2xl bg-zinc-900 border border-orange-500/20 p-4 sm:p-5 flex flex-col gap-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm sm:text-base font-bold text-zinc-100">{q.symbol} <span className="text-zinc-500 font-normal text-sm">— {q.shortName}</span></p>
                            <p className={`text-xl sm:text-2xl font-bold mt-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>${fmt(q.regularMarketPrice)}</p>
                          </div>
                          <span className={`text-xs sm:text-sm font-semibold px-3 py-1 rounded-full self-start sm:self-auto ${up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                            {up ? "+" : ""}{fmt(q.regularMarketChange)} ({up ? "+" : ""}{(q.regularMarketChangePercent ?? 0).toFixed(2)}%)
                          </span>
                        </div>
                        {/* Sparkline */}
                        <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
                          {chartLoading ? (
                            <div className="h-24 flex items-center justify-center text-zinc-700 text-xs">Loading chart…</div>
                          ) : closes.length > 1 ? (
                            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={up ? "#10b981" : "#ef4444"} stopOpacity="0.25" />
                                  <stop offset="100%" stopColor={up ? "#10b981" : "#ef4444"} stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              <polyline fill="none" stroke={up ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeLinejoin="round" points={pts} />
                              <polygon fill="url(#cg)" points={`${pad},${H} ${pts} ${W - pad},${H}`} />
                            </svg>
                          ) : (
                            <div className="h-24 flex items-center justify-center text-zinc-700 text-xs">No chart data</div>
                          )}
                        </div>
                        {/* Metrics grid — 2 cols on mobile, 4 on sm+ */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {metrics.map(m => (
                            <div key={m.label} className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 flex flex-col gap-0.5">
                              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{m.label}</p>
                              <p className="text-sm font-semibold text-zinc-200">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          ) : activeSidebarItem === "Library" ? (
            <LibraryPanel />
          ) : activeSidebarItem === "News" ? (
            <NewsPanel />
          ) : activeSidebarItem === "Careers" ? (
            <CareersPanel />
          ) : activeSidebarItem === "Newsletter" ? (
            <div className="flex flex-col gap-6 max-w-lg">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Newsletter</h2>
                <p className="text-sm text-zinc-500 mt-1">Stay in the loop — get notified when we add new features, pages, and updates.</p>
              </div>
              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Feature Updates", desc: "Be first to know about new tools and pages." },
                  { title: "Site News", desc: "Important announcements and changes." },
                  { title: "New Content", desc: "Fresh Bible resources, news feeds & more." },
                  { title: "No Spam", desc: "Only emails that matter. Unsubscribe anytime." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl bg-zinc-900/60 border border-orange-500/10 px-4 py-3 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-orange-400">{item.title}</span>
                    <span className="text-xs text-zinc-500">{item.desc}</span>
                  </div>
                ))}
              </div>
              {/* Subscribe box */}
              {newsletterAlready ? (
                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 px-5 py-6 flex flex-col items-center gap-2 text-center">
                  <span className="text-2xl">✓</span>
                  <p className="text-sm font-semibold text-orange-300">You&apos;re subscribed!</p>
                  <p className="text-xs text-zinc-500">We&apos;ll reach out to {localStorage.getItem("bench_newsletter_email")} when there&apos;s something worth sharing.</p>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const email = newsletterEmail.trim();
                    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                      setNewsletterStatus("error");
                      setNewsletterError("Please enter a valid email address.");
                      return;
                    }
                    setNewsletterStatus("loading");
                    setNewsletterError("");
                    try {
                      const res = await fetch("/api/newsletter", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                      });
                      if (!res.ok) {
                        const d = await res.json().catch(() => ({})) as { error?: string };
                        setNewsletterError(d.error ?? "Something went wrong. Please try again.");
                        setNewsletterStatus("error");
                        return;
                      }
                      try { localStorage.setItem("bench_newsletter_email", email); } catch {}
                      setNewsletterStatus("success");
                      setNewsletterAlready(true);
                      setNewsletterEmail("");
                    } catch {
                      setNewsletterError("Could not reach the server. Please try again.");
                      setNewsletterStatus("error");
                    }
                  }}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-6 flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-400">Email address</label>
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterStatus("idle"); setNewsletterError(""); }}
                      placeholder="you@example.com"
                      className="px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                    {newsletterStatus === "error" && (
                      <p className="text-xs text-red-400">{newsletterError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={newsletterStatus === "loading"}
                    className="w-full px-4 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-sm font-semibold text-orange-300 hover:bg-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {newsletterStatus === "loading" ? "Subscribing…" : "Subscribe to Newsletter"}
                  </button>
                  <p className="text-[10px] text-zinc-600 text-center">No spam. Unsubscribe at any time.</p>
                </form>
              )}
            </div>
          ) : activeSidebarItem === "Reports" ? (
            <div className="flex flex-col gap-6 max-w-lg">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Report an Issue</h2>
                <p className="text-sm text-zinc-500 mt-1">Help us keep the platform safe and running smoothly. All reports are reviewed by our team.</p>
              </div>
              {reportStatus === "submitted" ? (
                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 px-5 py-8 flex flex-col items-center gap-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 text-lg">✓</div>
                  <p className="text-sm font-semibold text-orange-300">Report Submitted</p>
                  <p className="text-xs text-zinc-500">Thank you for letting us know. We’ll look into it as soon as possible.</p>
                  <button
                    onClick={() => { setReportStatus("idle"); setReportCategory(""); setReportDesc(""); setReportError(""); }}
                    className="mt-2 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all"
                  >
                    Submit another report
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!reportCategory || !reportDesc.trim()) return;
                    setReportStatus("loading");
                    setReportError("");
                    try {
                      const res = await fetch("/api/report", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ category: reportCategory, description: reportDesc.trim() }),
                      });
                      if (!res.ok) {
                        const d = await res.json().catch(() => ({})) as { error?: string };
                        setReportError(d.error ?? "Failed to submit. Please try again.");
                        setReportStatus("error");
                        return;
                      }
                      setReportStatus("submitted");
                    } catch {
                      setReportError("Could not reach the server. Please try again.");
                      setReportStatus("error");
                    }
                  }}
                  className="flex flex-col gap-4"
                >
                  {/* Category */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "sexual-content", label: "Sexual Content", color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10" },
                        { value: "glitch", label: "Glitch / Bug", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
                        { value: "error", label: "Error", color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
                        { value: "other", label: "General Issue", color: "text-zinc-300", border: "border-zinc-600", bg: "bg-zinc-800/60" },
                      ].map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setReportCategory(cat.value)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                            reportCategory === cat.value
                              ? `${cat.bg} ${cat.border} ${cat.color}`
                              : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Description</label>
                    <textarea
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      placeholder="Describe what happened, where it occurred, and any steps to reproduce it…"
                      rows={5}
                      maxLength={1000}
                      className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 resize-none transition-colors"
                    />
                    <p className="text-[10px] text-zinc-600 text-right">{reportDesc.length}/1000</p>
                  </div>
                  <button
                    type="submit"
                    disabled={!reportCategory || !reportDesc.trim() || reportStatus === "loading"}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                      reportCategory && reportDesc.trim() && reportStatus !== "loading"
                        ? "bg-orange-500/20 border-orange-500/40 text-orange-300 hover:bg-orange-500/30"
                        : "border-zinc-800 bg-zinc-900/40 text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    {reportStatus === "loading" ? "Submitting…" : "Submit Report"}
                  </button>
                  {reportStatus === "error" && (
                    <p className="text-xs text-red-400 text-center">{reportError}</p>
                  )}
                </form>
              )}
            </div>
          ) : activeSidebarItem === "Planner" ? (() => {
            const HOLIDAYS: Record<string, string> = {
              "01-01": "New Year's Day", "01-20": "MLK Day", "02-17": "Presidents' Day",
              "05-26": "Memorial Day", "06-19": "Juneteenth", "07-04": "Independence Day",
              "09-01": "Labor Day", "10-13": "Columbus Day", "11-11": "Veterans Day",
              "11-27": "Thanksgiving", "12-25": "Christmas", "12-31": "New Year's Eve",
            };
            const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
            const firstDay = new Date(calYear, calMonth, 1).getDay();
            const monthKey = (d: number) => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const holidayKey = (d: number) => `${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            return (
              <div className="flex flex-col gap-4 w-full sm:flex-row sm:gap-6 sm:h-full">
                {/* Calendar grid */}
                <div className="flex flex-col flex-1 min-w-0 rounded-2xl bg-zinc-900 border border-orange-500/10 p-3 sm:p-5">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="p-2 sm:p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-all"><ChevronLeft size={18} /></button>
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100">{monthNames[calMonth]} {calYear}</h2>
                    <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="p-2 sm:p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-all"><ChevronRight size={18} /></button>
                  </div>
                  <div className="grid grid-cols-7 mb-1">
                    {[["S","Sun"],["M","Mon"],["T","Tue"],["W","Wed"],["T","Thu"],["F","Fri"],["S","Sat"]].map(([short, full]) => (
                      <div key={full} className="text-center text-[10px] font-semibold text-zinc-600 uppercase tracking-widest py-1">
                        <span className="sm:hidden">{short}</span>
                        <span className="hidden sm:inline">{full}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 flex-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                      const key = monthKey(d);
                      const hkey = holidayKey(d);
                      const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                      const isSelected = selectedDay === key;
                      const hasEvents = (plannerEvents[key]?.length ?? 0) > 0;
                      const holiday = HOLIDAYS[hkey];
                      return (
                        <button
                          key={d}
                          onClick={() => setSelectedDay(isSelected ? null : key)}
                          title={holiday ?? undefined}
                          className={`relative flex flex-col items-center justify-start rounded-xl py-2.5 sm:py-2 text-xs font-medium transition-all border touch-manipulation ${
                            isSelected ? "bg-orange-500/20 border-orange-500/50 text-orange-300" :
                            isToday ? "bg-zinc-800 border-orange-500/30 text-orange-400" :
                            "border-transparent hover:bg-zinc-800/60 text-zinc-300"
                          }`}
                        >
                          <span>{d}</span>
                          <div className="flex gap-0.5 mt-0.5">
                            {holiday && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                            {hasEvents && <span className="w-1 h-1 rounded-full bg-orange-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-600">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Holiday</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" /> Event</span>
                  </div>
                </div>
                {/* Day detail panel — slides in below calendar on mobile */}
                <div className="w-full sm:w-64 sm:shrink-0 flex flex-col gap-3">
                  {selectedDay ? (() => {
                    const [, mm, dd] = selectedDay.split("-");
                    const hkey3 = `${mm}-${dd}`;
                    const holiday2 = HOLIDAYS[hkey3];
                    const events = plannerEvents[selectedDay] ?? [];
                    return (
                      <div className="rounded-2xl bg-zinc-900 border border-orange-500/10 p-4 flex flex-col gap-3">
                        <p className="text-sm font-semibold text-zinc-200">{new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                        {holiday2 && <p className="text-xs text-blue-400 flex items-center gap-1"><Star size={10} /> {holiday2}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); const t = eventInput.trim(); if (!t) return; setPlannerEvents(prev => ({ ...prev, [selectedDay]: [...(prev[selectedDay] ?? []), t] })); setEventInput(""); }} className="flex gap-2">
                          <input value={eventInput} onChange={e => setEventInput(e.target.value)} placeholder="Add event…" className="flex-1 min-w-0 px-3 py-2.5 sm:py-2 rounded-xl bg-zinc-800 border border-orange-500/10 text-sm sm:text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/40" />
                          <button type="submit" className="px-4 sm:px-3 py-2.5 sm:py-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-sm sm:text-xs text-orange-300 hover:bg-orange-500/30 transition-all">Add</button>
                        </form>
                        {events.length === 0 && <p className="text-xs text-zinc-600">No events for this day.</p>}
                        <div className="flex flex-col gap-2">
                          {events.map((ev, idx) => (
                            <div key={idx} className="flex items-center gap-2 group px-2 py-2 sm:py-1.5 rounded-lg hover:bg-zinc-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                              <span className="flex-1 text-xs text-zinc-300">{ev}</span>
                              <button onClick={() => setPlannerEvents(prev => { const next = { ...prev }; next[selectedDay] = next[selectedDay].filter((_, i) => i !== idx); return next; })} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"><Plus size={11} className="rotate-45" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="rounded-2xl bg-zinc-900 border border-orange-500/10 p-4 flex items-center justify-center h-24 sm:h-40">
                      <p className="text-xs text-zinc-600">Select a day to add events</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })() : activeSidebarItem === "Notes" ? (
            <div className="flex flex-col gap-4 max-w-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Notes</h2>
                <span className="text-xs text-zinc-600">
                  {notesSaveStatus === "saving" && "Saving…"}
                  {notesSaveStatus === "saved" && <span className="text-orange-400">Saved ✓</span>}
                </span>
              </div>
              <textarea
                value={notesText}
                onChange={(e) => {
                  const val = e.target.value;
                  setNotesText(val);
                  setNotesSaveStatus("saving");
                  if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
                  notesDebounceRef.current = setTimeout(() => {
                    try { localStorage.setItem("core_my_notes", val); } catch {}
                    setNotesSaveStatus("saved");
                    setTimeout(() => setNotesSaveStatus("idle"), 1500);
                  }, 700);
                }}
                placeholder="Start typing your notes…"
                className="w-full min-h-[60vh] resize-none rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 leading-relaxed"
              />
            </div>
          ) : activeSidebarItem === "Bible" ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Bible</h2>
                <select
                  value={bibleTranslation}
                  onChange={(e) => { setBibleTranslation(e.target.value); setBibleContent(null); setBibleChapter(null); }}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-orange-500/20 text-xs text-zinc-300 focus:outline-none focus:border-orange-500/40"
                >
                  {([["kjv","KJV"],["web","WEB"],["asv","ASV"],["bbe","BBE"],["darby","Darby"]] as [string,string][]).map(([id, lbl]) => (
                    <option key={id} value={id}>{lbl}</option>
                  ))}
                </select>
              </div>
              {/* Testament tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setBibleTestament("old"); setBibleBook(null); setBibleChapter(null); setBibleContent(null); }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${bibleTestament === "old" ? "bg-orange-500/20 border-orange-500/40 text-orange-300" : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"}`}
                >
                  Old Testament
                </button>
                <button
                  onClick={() => { setBibleTestament("new"); setBibleBook(null); setBibleChapter(null); setBibleContent(null); }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${bibleTestament === "new" ? "bg-orange-500/20 border-orange-500/40 text-orange-300" : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"}`}
                >
                  New Testament
                </button>
              </div>
              {/* Book grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {(bibleTestament === "old" ? OLD_TESTAMENT : NEW_TESTAMENT).map((book) => (
                  <button
                    key={book.name}
                    onClick={() => { setBibleBook(book.name); setBibleChapter(null); setBibleContent(null); }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border text-left ${bibleBook === book.name ? "bg-orange-500/20 border-orange-500/40 text-orange-300" : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-orange-500/20 hover:text-zinc-200"}`}
                  >
                    {book.name}
                  </button>
                ))}
              </div>
              {/* Chapter grid */}
              {bibleBook && (() => {
                const bookData = (bibleTestament === "old" ? OLD_TESTAMENT : NEW_TESTAMENT).find(b => b.name === bibleBook);
                if (!bookData) return null;
                return (
                  <div className="rounded-2xl bg-zinc-900 border border-orange-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">{bibleBook} — {bookData.chapters} chapter{bookData.chapters > 1 ? "s" : ""}</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: bookData.chapters }, (_, i) => i + 1).map((ch) => (
                        <button
                          key={ch}
                          onClick={() => fetchBibleChapter(bibleBook, ch)}
                          className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all border ${bibleChapter === ch ? "bg-orange-500/30 border-orange-500/60 text-orange-300" : "border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-orange-500/30 hover:text-zinc-200"}`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {/* Loading / error / content */}
              {bibleLoading && (
                <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">Loading…</div>
              )}
              {bibleError && !bibleLoading && (
                <div className="rounded-2xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-400">{bibleError}</div>
              )}
              {bibleContent && !bibleLoading && (
                <div className="rounded-2xl bg-zinc-900 border border-orange-500/10 p-4 flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">{bibleContent.reference} · {bibleTranslation.toUpperCase()}</p>
                  <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
                    {bibleContent.verses.map((v) => (
                      <p key={v.verse} className="text-sm text-zinc-300 leading-relaxed">
                        <sup className="text-orange-400 font-semibold mr-1">{v.verse}</sup>{v.text}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
          <>
          {/* Quick actions */}
          <div className="mb-6 mt-3">
            <div className="flex gap-3 flex-wrap justify-center sm:justify-start">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-orange-500/10 hover:border-orange-500/30 hover:bg-zinc-800 text-sm text-zinc-300 hover:text-zinc-100 transition-all duration-150 group"
                >
                  <span className="text-orange-400 group-hover:text-orange-300 transition-colors">{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
          </>
          )}

          {/* Bottom spacer */}
          <div className="h-8" />
        </main>
      </div>

      {/* ── Clip.bun modal ─────────────────────────────────── */}
      {clipbunModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-orange-500/20 rounded-2xl p-8 flex flex-col items-center gap-6 shadow-2xl max-w-sm w-full mx-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/30">
              <Play size={22} className="text-orange-400" />
            </div>
            <div className="text-center">
              <h2 className="text-base font-semibold text-zinc-100 mb-1">Do you need Video editing?</h2>
              <p className="text-xs text-zinc-500">Clip.bun is an external video editing tool.</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setClipbunModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-all"
              >
                Stay
              </button>
              <a
                href="https://clipbun-io.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setClipbunModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-orange-500 text-sm text-white font-medium hover:bg-orange-400 transition-all text-center"
              >
                Continue
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
