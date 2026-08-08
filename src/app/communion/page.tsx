"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import {
  Hash,
  Lock,
  Plus,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Smile,
  Paperclip,
  Send,
  AtSign,
  Bold,
  Italic,
  MessageSquare,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Zap,
  Users,
  Settings,
  Home,
  ArrowLeft,
  Circle,
  Video,
  Phone,
} from "lucide-react";

// ── Mock data ──────────────────────────────────────────────
const WORKSPACE = { name: "Babel", initials: "CO" };

const CHANNELS = [
  { id: "general", name: "general", unread: 3, pinned: false },
  { id: "goals", name: "goals", unread: 0, pinned: false },
  { id: "research", name: "research", unread: 1, pinned: false },
  { id: "prayer", name: "prayer", unread: 7, pinned: false },
  { id: "announcements", name: "announcements", unread: 0, pinned: true },
];

const DMS = [
  { id: "dm1", name: "Hyrum", status: "online", unread: 2 },
  { id: "dm2", name: "Elijah", status: "away", unread: 0 },
  { id: "dm3", name: "Miriam", status: "offline", unread: 0 },
  { id: "dm4", name: "Samuel", status: "online", unread: 0 },
];

type Message = {
  id: string;
  user: string;
  initials: string;
  color: string;
  imageUrl?: string;
  time: string;
  text: string;
  reactions?: { emoji: string; count: number }[];
  thread?: number;
};

const MESSAGES: Record<string, Message[]> = {
  general: [
    {
      id: "1", user: "Hyrum", initials: "HY", color: "#f97316", time: "9:04 AM",
      text: "Good morning everyone! 🌅 Starting the day with gratitude.",
      reactions: [{ emoji: "🙏", count: 4 }, { emoji: "🔥", count: 2 }],
      thread: 3,
    },
    {
      id: "2", user: "Miriam", initials: "MI", color: "#a78bfa", time: "9:12 AM",
      text: "Morning! Quick reminder — team sync is at 11 AM today.",
      reactions: [{ emoji: "👍", count: 5 }],
    },
    {
      id: "3", user: "Elijah", initials: "EL", color: "#34d399", time: "9:18 AM",
      text: "Got it. I'll have the research notes ready before then.",
    },
    {
      id: "4", user: "Samuel", initials: "SA", color: "#60a5fa", time: "9:31 AM",
      text: "The new Core Canvas feature looks amazing btw. Great work on the node graph 🎉",
      reactions: [{ emoji: "🎉", count: 6 }, { emoji: "💯", count: 3 }],
      thread: 7,
    },
    {
      id: "5", user: "Hyrum", initials: "HY", color: "#f97316", time: "9:45 AM",
      text: "Thank you! Still polishing the edge handles. Next up is adding a minimap zoom.",
    },
    {
      id: "6", user: "Miriam", initials: "MI", color: "#a78bfa", time: "10:02 AM",
      text: "Can we add a dark-mode toggle for the canvas too? Some of us prefer a lighter background for the flow diagrams.",
      reactions: [{ emoji: "💡", count: 2 }],
    },
    {
      id: "7", user: "Elijah", initials: "EL", color: "#34d399", time: "10:15 AM",
      text: "Just pushed the Q3 research notes to the Library panel. All tagged and indexed 📚",
      reactions: [{ emoji: "👀", count: 3 }],
      thread: 2,
    },
  ],
  prayer: [
    {
      id: "p1", user: "Samuel", initials: "SA", color: "#60a5fa", time: "7:00 AM",
      text: "Morning prayer 🙏  — Lord, guide our steps today. May our work reflect your wisdom.",
      reactions: [{ emoji: "🙏", count: 8 }, { emoji: "❤️", count: 5 }],
    },
    {
      id: "p2", user: "Miriam", initials: "MI", color: "#a78bfa", time: "7:14 AM",
      text: "Amen. Romans 8:28 — all things work together for good.",
      reactions: [{ emoji: "🙏", count: 6 }],
    },
  ],
  goals: [
    {
      id: "g1", user: "Hyrum", initials: "HY", color: "#f97316", time: "Yesterday",
      text: "Goals for this week: ✅ Finish Canvas node graph  ⬜ Launch Bible search  ⬜ Newsletter v2",
    },
    {
      id: "g2", user: "Elijah", initials: "EL", color: "#34d399", time: "Yesterday",
      text: "I'm taking the newsletter. Will have a draft by Thursday.",
      reactions: [{ emoji: "💪", count: 3 }],
    },
  ],
  research: [
    {
      id: "r1", user: "Elijah", initials: "EL", color: "#34d399", time: "Mon",
      text: "Dropped the Q3 ethics summary in the Library. Key finding: users want offline Bible access.",
      reactions: [{ emoji: "📌", count: 2 }],
      thread: 4,
    },
  ],
  announcements: [
    {
      id: "a1", user: "Hyrum", initials: "HY", color: "#f97316", time: "Last week",
      text: "🎉 Core v2.0 is live! New workspace canvas, improved AI chat, and real-time stock panel. Thank you all for your hard work.",
      reactions: [{ emoji: "🎉", count: 12 }, { emoji: "🔥", count: 8 }, { emoji: "🙏", count: 6 }],
    },
  ],
};

const STATUS_COLOR: Record<string, string> = {
  online: "#22c55e",
  away: "#eab308",
  offline: "#52525b",
};

// ── Component ──────────────────────────────────────────────
export default function CommunionPage() {
  const { user } = useUser();
  const [activeChannel, setActiveChannel] = useState("general");
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const [input, setInput] = useState("");
  // mobile: start on sidebar, navigate to chat on channel select
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MESSAGES);

  const isDM = DMS.some((d) => d.id === activeChannel);
  const channel = CHANNELS.find((c) => c.id === activeChannel);
  const dm = DMS.find((d) => d.id === activeChannel);
  const activeLabel = channel ? `# ${channel.name}` : dm ? dm.name : "";
  const currentMessages = messages[activeChannel] ?? [];

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const firstName = user?.firstName ?? "";
    const lastName = user?.lastName ?? "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || "You";
    const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "YO";
    const newMsg: Message = {
      id: Date.now().toString(),
      user: fullName,
      initials,
      color: "#f97316",
      imageUrl: user?.imageUrl,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text,
    };
    setMessages((prev) => ({ ...prev, [activeChannel]: [...(prev[activeChannel] ?? []), newMsg] }));
    setInput("");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-slate-100 font-[var(--font-geist-sans)] relative">

      {/* ── Far-left workspace rail ──────────────────────── */}
      <div className="hidden sm:flex flex-col items-center gap-3 w-[52px] shrink-0 py-3 bg-zinc-900 border-r border-zinc-800">
        {/* Workspace icon */}
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-orange-900/40 cursor-pointer select-none">
          <Image src="/Corelogo.png" alt="Core" width={36} height={36} className="w-full h-full object-cover" />
        </div>
        <div className="w-8 h-px bg-zinc-700/60 rounded-full" />
        <Link href="/bench" className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-all" title="Back to Bench">
          <Home size={18} />
        </Link>
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
          <Bell size={18} />
        </button>
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
          <Bookmark size={18} />
        </button>
        <div className="flex-1" />
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
          <Settings size={18} />
        </button>
        {/* Avatar */}
        <div className="relative">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-orange-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            {user?.imageUrl ? (
              <Image src={user.imageUrl} alt="Profile" width={32} height={32} className="w-full h-full object-cover" />
            ) : (
              user?.firstName?.[0] ?? "Y"
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-zinc-900" />
        </div>
      </div>

      {/* ── Left sidebar ────────────────────────────────── */}
      <aside className={`flex-col bg-zinc-900 border-r border-zinc-800 overflow-y-auto z-40
        ${mobileSidebarOpen ? 'flex absolute inset-0 w-full' : 'hidden'}
        sm:relative sm:flex sm:w-[240px] sm:shrink-0 sm:inset-auto`}>
        {/* Workspace header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800/60">
          <button className="flex items-center gap-1.5 text-sm font-bold text-zinc-100 hover:text-white transition-colors">
            {WORKSPACE.name}
            <ChevronDown size={14} className="text-zinc-500" />
          </button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-all">
            <Zap size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <button className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-500 hover:bg-zinc-800 transition-all">
            <Search size={12} />
            Search Core
          </button>
        </div>

        {/* Home */}
        <div className="px-3 py-1">
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
            <Home size={14} className="text-zinc-500" />
            Home
          </button>
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
            <MessageSquare size={14} className="text-zinc-500" />
            Threads
          </button>
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
            <AtSign size={14} className="text-zinc-500" />
            Mentions &amp; reactions
          </button>
        </div>

        <div className="mx-3 my-1.5 h-px bg-zinc-800/60" />

        {/* Channels */}
        <div className="px-3 py-1">
          <button
            onClick={() => setChannelsOpen((o) => !o)}
            className="flex items-center gap-1.5 w-full px-1 py-1 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
          >
            {channelsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Channels
          </button>

          {channelsOpen && (
            <div className="mt-0.5 flex flex-col gap-px">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => { setActiveChannel(ch.id); setMobileSidebarOpen(false); }}
                  className={`flex items-center gap-2 w-full px-2 py-1 rounded-md text-xs transition-all ${
                    activeChannel === ch.id
                      ? "bg-orange-500/15 text-orange-300"
                      : ch.unread > 0
                      ? "text-zinc-100 font-semibold hover:bg-zinc-800"
                      : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  {ch.pinned ? <Lock size={12} className="shrink-0 text-zinc-600" /> : <Hash size={12} className="shrink-0" />}
                  <span className="truncate flex-1 text-left">{ch.name}</span>
                  {ch.unread > 0 && activeChannel !== ch.id && (
                    <span className="ml-auto w-4 h-4 rounded-full bg-zinc-100 text-zinc-900 text-[10px] font-bold flex items-center justify-center">
                      {ch.unread}
                    </span>
                  )}
                </button>
              ))}
              <button className="flex items-center gap-2 w-full px-2 py-1 rounded-md text-xs text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition-all">
                <Plus size={12} />
                Add channel
              </button>
            </div>
          )}
        </div>

        <div className="mx-3 my-1.5 h-px bg-zinc-800/60" />

        {/* Direct Messages */}
        <div className="px-3 py-1">
          <button
            onClick={() => setDmsOpen((o) => !o)}
            className="flex items-center gap-1.5 w-full px-1 py-1 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
          >
            {dmsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Direct Messages
          </button>

          {dmsOpen && (
            <div className="mt-0.5 flex flex-col gap-px">
              {DMS.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => { setActiveChannel(dm.id); setMobileSidebarOpen(false); }}
                  className={`flex items-center gap-2 w-full px-2 py-1 rounded-md text-xs transition-all ${
                    activeChannel === dm.id
                      ? "bg-orange-500/15 text-orange-300"
                      : dm.unread > 0
                      ? "text-zinc-100 font-semibold hover:bg-zinc-800"
                      : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: dm.status === "online" ? "#22c55e" : dm.status === "away" ? "#eab308" : "#52525b" }}>
                      {dm.name[0]}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-900"
                      style={{ backgroundColor: STATUS_COLOR[dm.status] }}
                    />
                  </div>
                  <span className="truncate flex-1 text-left">{dm.name}</span>
                  {dm.unread > 0 && activeChannel !== dm.id && (
                    <span className="ml-auto w-4 h-4 rounded-full bg-zinc-100 text-zinc-900 text-[10px] font-bold flex items-center justify-center">
                      {dm.unread}
                    </span>
                  )}
                </button>
              ))}
              <button className="flex items-center gap-2 w-full px-2 py-1 rounded-md text-xs text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition-all">
                <Plus size={12} />
                New message
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />
      </aside>

      {/* ── Main chat area ───────────────────────────────── */}
      <div className={`flex-col flex-1 min-w-0 overflow-hidden ${mobileSidebarOpen ? 'hidden sm:flex' : 'flex'}`}>

        {/* Channel header */}
        <header className="flex items-center justify-between h-12 shrink-0 px-4 bg-zinc-950 border-b border-zinc-800 z-10">
          <div className="flex items-center gap-2">
            {/* back to sidebar on mobile */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="sm:hidden w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all -ml-1 mr-1"
            >
              <ArrowLeft size={16} />
            </button>
            {isDM ? (
              <>
                <div className="relative">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white bg-green-600">
                    {dm?.name[0]}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-950"
                    style={{ backgroundColor: STATUS_COLOR[dm?.status ?? "offline"] }} />
                </div>
                <span className="text-sm font-bold text-zinc-100">{dm?.name}</span>
                <span className="text-xs text-zinc-600 capitalize">{dm?.status}</span>
              </>
            ) : (
              <>
                <Hash size={16} className="text-zinc-400" />
                <span className="text-sm font-bold text-zinc-100">{channel?.name}</span>
                {channel?.pinned && <Lock size={12} className="text-zinc-600" />}
                <span className="text-zinc-700">·</span>
                <span className="text-xs text-zinc-500">
                  {channel?.name === "announcements" ? "Important updates for the team" :
                   channel?.name === "general" ? "All-team conversation" :
                   channel?.name === "prayer" ? "Daily prayer and scripture" :
                   channel?.name === "goals" ? "Weekly goals and accountability" :
                   "Research and resources"}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all border border-transparent hover:border-zinc-700">
              <Users size={13} />
              <span className="hidden sm:inline">Members</span>
            </button>
            <button className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all">
              <Phone size={15} />
            </button>
            <button className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all">
              <Video size={15} />
            </button>
            <button className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all">
              <Search size={15} />
            </button>
            <button className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all">
              <HelpCircle size={15} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 bg-zinc-950">
          {/* Channel intro */}
          {!isDM && (
            <div className="mb-4 pb-4 border-b border-zinc-800/60">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 mb-3">
                <Hash size={22} className="text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold text-zinc-100 mb-1"># {channel?.name}</h2>
              <p className="text-sm text-zinc-500">
                {channel?.name === "announcements"
                  ? "This channel is for workspace-wide notices and announcements."
                  : `This is the very beginning of the #${channel?.name} channel.`}
              </p>
            </div>
          )}

          {/* Messages list */}
          {currentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-zinc-700 gap-2 py-16">
              <MessageSquare size={40} strokeWidth={1} />
              <p className="text-sm">No messages yet. Say something!</p>
            </div>
          ) : (
            currentMessages.map((msg, i) => {
              const prev = currentMessages[i - 1];
              const grouped = prev?.user === msg.user;
              return (
                <div
                  key={msg.id}
                  className="group flex gap-3 px-2 py-0.5 rounded-lg hover:bg-zinc-900/60 transition-colors relative"
                  style={{ marginTop: grouped ? 0 : "12px" }}
                >
                  {/* Avatar */}
                  <div className="shrink-0 w-9 mt-0.5">
                    {!grouped && (
                      msg.imageUrl ? (
                        <Image
                          src={msg.imageUrl}
                          alt={msg.user}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-xl object-cover"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: msg.color }}
                        >
                          {msg.initials}
                        </div>
                      )
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {!grouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-sm font-bold text-zinc-100">{msg.user}</span>
                        <span className="text-[11px] text-zinc-600">{msg.time}</span>
                      </div>
                    )}
                    <p className="text-sm text-zinc-300 leading-relaxed">{msg.text}</p>

                    {/* Reactions */}
                    {msg.reactions && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {msg.reactions.map((r) => (
                          <button
                            key={r.emoji}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 hover:border-orange-500/40 hover:bg-zinc-700 text-xs text-zinc-300 transition-all"
                          >
                            {r.emoji} <span className="text-zinc-500">{r.count}</span>
                          </button>
                        ))}
                        <button className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800/50 border border-zinc-700/50 hover:border-orange-500/30 text-zinc-600 hover:text-zinc-300 transition-all text-xs">
                          <Smile size={12} />
                        </button>
                      </div>
                    )}

                    {/* Thread reply count */}
                    {msg.thread && (
                      <button className="mt-1.5 flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 hover:underline transition-colors">
                        <MessageSquare size={13} />
                        {msg.thread} {msg.thread === 1 ? "reply" : "replies"}
                      </button>
                    )}
                  </div>

                  {/* Hover action bar */}
                  <div className="absolute right-2 top-0 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-zinc-800 border border-zinc-700 rounded-lg px-1 py-0.5 shadow-lg">
                    <button className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-all" title="React">
                      <Smile size={13} />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-all" title="Reply in thread">
                      <MessageSquare size={13} />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-all" title="Bookmark">
                      <Bookmark size={13} />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-all" title="More">
                      <MoreHorizontal size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message input */}
        <div className="shrink-0 px-4 pb-4 pt-2 bg-zinc-950">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 focus-within:border-zinc-600 transition-colors">
            {/* Formatting toolbar */}
            <div className="flex items-center gap-0.5 px-3 pt-2 pb-1 border-b border-zinc-800">
              <button className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all">
                <Bold size={12} />
              </button>
              <button className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all">
                <Italic size={12} />
              </button>
              <div className="w-px h-3.5 bg-zinc-700 mx-1" />
              <button className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all">
                <AtSign size={12} />
              </button>
              <button className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all">
                <Hash size={12} />
              </button>
            </div>

            {/* Text area */}
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Message ${activeLabel}`}
              className="w-full resize-none bg-transparent px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none leading-relaxed"
            />

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-3 pb-2 pt-1">
              <div className="flex items-center gap-0.5">
                <button className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all">
                  <Paperclip size={15} />
                </button>
                <button className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all">
                  <Smile size={15} />
                </button>
                <button className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all">
                  <AtSign size={15} />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all"
              >
                <Send size={13} />
                Send
              </button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-700 mt-1.5 px-1">
            <strong className="text-zinc-600">Enter</strong> to send · <strong className="text-zinc-600">Shift+Enter</strong> for new line
          </p>
        </div>
      </div>
    </div>
  );
}
