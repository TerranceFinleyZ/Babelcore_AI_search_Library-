"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { useSupabase } from "@/lib/useSupabase";
import ProfilePicModal, { PROFILE_PIC_KEY } from "@/components/ProfilePicModal";
import {
  Hash,
  Lock,
  Plus,
  Search,
  Bell,
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
  Zap,
  Users,
  Settings,
  Home,
  ArrowLeft,
  Video,
  Phone,
  X,
  Trash2,
} from "lucide-react";

// ── Emoji set ─────────────────────────────────────────────
const EMOJIS = [
  "😀","😂","😍","🥰","😎","🤔","😢","😡","🙏","👍",
  "👎","👏","🔥","❤️","💯","✅","🎉","🚀","⭐","💡",
  "😊","🤣","😭","🥹","😅","🫡","🤯","🥳","😴","🤗",
  "👋","✌️","🤝","💪","🙌","👀","🫶","❤️\u200d🔥","💔","🫠",
  "📚","📌","⚡","🌟","🎯","🔑","💎","🌙","☀️","🌊",
  "🍕","🎵","🏆","🎨","💻","📱","🌍","🦁","🐉","⚔️",
];

function EmojiPicker({ onSelect, onGifSelect, placement = "above" }: { onSelect: (emoji: string) => void; onGifSelect?: (url: string) => void; placement?: "above" | "below" }) {
  const [tab, setTab]           = useState<"emoji" | "gif">("emoji");
  const [gifQuery, setGifQuery] = useState("");
  const [gifs, setGifs]         = useState<{ id: string; url: string; preview: string }[]>([]);
  const [gifLoading, setGifLoading] = useState(false);

  useEffect(() => {
    if (tab !== "gif") return;
    const timer = setTimeout(() => {
      setGifLoading(true);
      fetch(gifQuery ? `/api/gifs?q=${encodeURIComponent(gifQuery)}` : "/api/gifs")
        .then((r) => r.json())
        .then((data) => {
          setGifs(
            (data.results ?? []).map((r: Record<string, unknown>) => {
              const fmt = r.media_formats as Record<string, { url: string }>;
              return { id: r.id as string, url: fmt?.gif?.url ?? "", preview: fmt?.tinygif?.url ?? fmt?.gif?.url ?? "" };
            })
          );
          setGifLoading(false);
        })
        .catch(() => setGifLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [tab, gifQuery]);

  return (
    <div className={`absolute z-50 ${placement === "below" ? "top-full mt-2" : "bottom-full mb-2"} right-0 w-[288px] bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-3`}>
      {/* Tab switcher */}
      <div className="flex gap-1.5 mb-2.5">
        <button
          onMouseDown={(e) => { e.preventDefault(); setTab("emoji"); }}
          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${tab === "emoji" ? "bg-orange-500 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"}`}
        >Emoji</button>
        <button
          onMouseDown={(e) => { e.preventDefault(); setTab("gif"); }}
          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${tab === "gif" ? "bg-orange-500 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"}`}
        >GIF</button>
      </div>

      {tab === "emoji" ? (
        <div className="grid grid-cols-10 gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onMouseDown={(ev) => { ev.preventDefault(); onSelect(e); }}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-700 text-base transition-all"
            >
              {e}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <input
            autoFocus
            value={gifQuery}
            onChange={(e) => setGifQuery(e.target.value)}
            placeholder="Search GIFs…"
            className="w-full px-2 py-1.5 rounded-lg bg-zinc-700 border border-zinc-600 text-xs text-zinc-200 placeholder-zinc-500 outline-none mb-2"
          />
          {gifLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 max-h-52 overflow-y-auto">
              {gifs.map((g) => (
                <button
                  key={g.id}
                  onMouseDown={(ev) => { ev.preventDefault(); onGifSelect?.(g.url); }}
                  className="rounded-md overflow-hidden hover:opacity-75 transition-opacity"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.preview} alt="" className="w-full h-20 object-cover" />
                </button>
              ))}
              {gifs.length === 0 && (
                <p className="col-span-2 text-xs text-zinc-600 text-center py-6">No results</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Static config ──────────────────────────────────────────
const WORKSPACE = { name: "Babel" };

type Channel       = { id: string; name: string; pinned: boolean };
type WorkspaceUser = {
  id: string; name: string; initials: string;
  imageUrl?: string; color: string; lastSeen: string;
};

type Reaction = { emoji: string; users: string[] };
type Message  = {
  id: string;
  userId: string;
  user: string;
  initials: string;
  color: string;
  imageUrl?: string;
  time: string;
  text: string;
  reactions: Reaction[];
  attachmentUrl?: string;
  attachmentName?: string;
  pinned: boolean;
  failed?: boolean;
};

// Group flat reaction rows into per-emoji user arrays
function groupReactions(
  rows: { message_id: string; user_id: string; emoji: string }[],
  msgId: string,
): Reaction[] {
  const map: Record<string, string[]> = {};
  for (const r of rows.filter((r) => r.message_id === msgId)) {
    (map[r.emoji] ??= []).push(r.user_id);
  }
  return Object.entries(map).map(([emoji, users]) => ({ emoji, users }));
}

const STATUS_COLOR: Record<string, string> = {
  online: "#22c55e",
  away: "#eab308",
  offline: "#52525b",
};

// ── Component ──────────────────────────────────────────────
export default function CommunionPage() {
  const { user } = useUser();
  const db = useSupabase();

  const [activeChannel, setActiveChannel]     = useState("general");
  const [channelsOpen, setChannelsOpen]       = useState(true);
  const [dmsOpen, setDmsOpen]                 = useState(true);
  const [input, setInput]                     = useState("");
  const [mobileSidebarOpen, setMobileSidebar] = useState(true);
  const [messages, setMessages]               = useState<Message[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [emojiTarget, setEmojiTarget]         = useState<string | null>(null);
  const [channels, setChannels]               = useState<Channel[]>([]);
  const [dmUsers, setDmUsers]                 = useState<WorkspaceUser[]>([]);
  const [openDMs, setOpenDMs]                 = useState<string[]>([]);
  const [showNewChannel, setShowNewChannel]   = useState(false);
  const [showNewDM, setShowNewDM]             = useState(false);
  const [showSettings, setShowSettings]       = useState(false);
  const [newChannelName, setNewChannelName]   = useState("");
  const [onlineUserIds, setOnlineUserIds]     = useState<Set<string>>(new Set());
  const [attachment, setAttachment]           = useState<File | null>(null);
  const [uploadingFile, setUploadingFile]     = useState(false);
  const [gifUrl, setGifUrl]                   = useState<string | null>(null);
  const [showSearch, setShowSearch]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState("");
  const [showPinned, setShowPinned]           = useState(false);
  const [messageMenuId, setMessageMenuId]     = useState<string | null>(null);
  const [picModalOpen, setPicModalOpen]       = useState(false);
  const [customPic, setCustomPic]             = useState<string | null>(() => {
    try { return localStorage.getItem(PROFILE_PIC_KEY); } catch { return null; }
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef   = useRef<HTMLDivElement>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const messagesEndRef  = useRef<HTMLDivElement>(null);

  const myId       = user?.id ?? "anon";
  const myName     = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "You";
  const myInitials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "YO";

  // Fetch messages + reactions for active channel from Supabase
  const loadMessages = useCallback(async (channelId: string) => {
    setLoading(true);
    const { data: msgRows } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });

    const ids = (msgRows ?? []).map((m) => m.id);
    const { data: rxRows } = ids.length
      ? await supabase.from("reactions").select("*").in("message_id", ids)
      : { data: [] };

    setMessages(
      (msgRows ?? []).map((row) => ({
        id:        row.id,
        userId:    row.user_id,
        user:      row.user_name,
        initials:  row.user_initials,
        color:     row.user_color,
        imageUrl:  row.user_image_url ?? undefined,
        time:      new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text:           row.text,
        reactions:      groupReactions(rxRows ?? [], row.id),
        attachmentUrl:  row.attachment_url ?? undefined,
        attachmentName: row.attachment_name ?? undefined,
        pinned:         row.pinned ?? false,
      }))
    );
    setLoading(false);
  }, []);

  // Load messages + subscribe to real-time changes when channel switches
  useEffect(() => {
    if (!activeChannel) return;
    loadMessages(activeChannel);

    const channel = supabase
      .channel(`room:${activeChannel}`)
      // New message in this channel
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${activeChannel}` },
        (payload) => {
          const row = payload.new as Record<string, string>;
          setMessages((prev) => {
            // skip if already added optimistically
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id:             row.id,
                userId:         row.user_id,
                user:           row.user_name,
                initials:       row.user_initials,
                color:          row.user_color,
                imageUrl:       row.user_image_url ?? undefined,
                time:           new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                text:           row.text,
                reactions:      [],
                attachmentUrl:  row.attachment_url ?? undefined,
                attachmentName: row.attachment_name ?? undefined,
                pinned:         false,
              },
            ];
          });
        }
      )
      // Reaction added
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions" },
        (payload) => {
          const r = payload.new as { message_id: string; user_id: string; emoji: string };
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== r.message_id) return m;
              const ex = m.reactions.find((rx) => rx.emoji === r.emoji);
              const reactions = ex
                ? m.reactions.map((rx) => rx.emoji === r.emoji ? { ...rx, users: [...rx.users, r.user_id] } : rx)
                : [...m.reactions, { emoji: r.emoji, users: [r.user_id] }];
              return { ...m, reactions };
            })
          );
        }
      )
      // Reaction removed
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "reactions" },
        (payload) => {
          const r = payload.old as { message_id: string; user_id: string; emoji: string };
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== r.message_id) return m;
              const reactions = m.reactions
                .map((rx) => rx.emoji === r.emoji ? { ...rx, users: rx.users.filter((u) => u !== r.user_id) } : rx)
                .filter((rx) => rx.users.length > 0);
              return { ...m, reactions };
            })
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChannel, loadMessages]);

  // Load channels + subscribe to new ones (C)
  useEffect(() => {
    supabase.from("channels").select("*").order("pinned", { ascending: false }).order("name")
      .then(({ data }) => setChannels(data ?? []));
    const sub = supabase.channel("channels:global")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "channels" },
        (p) => setChannels((prev) => [...prev, p.new as Channel]))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  // Upsert self + load all workspace members (B)
  useEffect(() => {
    if (!user) return;
    supabase.from("workspace_users").upsert({
      id: myId, name: myName, initials: myInitials,
      image_url: user.imageUrl ?? null, color: "#f97316",
      last_seen: new Date().toISOString(),
    });
    supabase.from("workspace_users").select("*")
      .then(({ data }) => setDmUsers((data ?? []).map((u) => ({
        id: u.id, name: u.name, initials: u.initials,
        imageUrl: u.image_url ?? undefined, color: u.color, lastSeen: u.last_seen,
      }))));
  }, [user, myId, myName, myInitials]);

  // Track online presence for all workspace members
  useEffect(() => {
    if (!user) return;
    const presenceCh = supabase.channel("presence:global", {
      config: { presence: { key: myId } },
    });
    presenceCh
      .on("presence", { event: "sync" }, () => {
        const state = presenceCh.presenceState<{ user_id: string }>();
        setOnlineUserIds(new Set(Object.values(state).flat().map((p) => p.user_id)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await presenceCh.track({ user_id: myId });
      });
    return () => { supabase.removeChannel(presenceCh); };
  }, [user, myId]);

  // Close emoji picker on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setEmojiTarget(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ctrl/Cmd+K opens search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((v) => !v);
        setSearchQuery("");
      }
      if (e.key === "Escape") { setShowSearch(false); setSearchQuery(""); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isDM = activeChannel.startsWith("dm:");
  const channel = channels.find((c) => c.id === activeChannel);
  const otherUserId = isDM ? activeChannel.split(":").find((id) => id !== "dm" && id !== myId) : undefined;
  const activeDMUser = dmUsers.find((u) => u.id === otherUserId);
  const activeLabel = channel ? `# ${channel.name}` : activeDMUser ? activeDMUser.name : "";
  const currentMessages = messages;

  const q = searchQuery.toLowerCase();
  const filteredUsers    = dmUsers.filter((u) => u.id !== myId && (!q || u.name.toLowerCase().includes(q)));
  const filteredChannels = channels.filter((ch) => !q || ch.name.toLowerCase().includes(q));
  const pinnedMessages   = currentMessages.filter((m) => m.pinned);

  async function deleteMessage(msgId: string) {
    setMessageMenuId(null);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    await db.from("messages").delete().eq("id", msgId);
  }

  async function togglePin(msgId: string, isPinned: boolean) {
    await db.from("messages").update({ pinned: !isPinned }).eq("id", msgId);
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, pinned: !isPinned } : m));
  }

  async function uploadAttachment(file: File): Promise<string | null> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${myId}/${Date.now()}-${safeName}`;
    const { error } = await db.storage.from("chat-attachments").upload(path, file);
    if (error) { console.error(error); return null; }
    const { data } = db.storage.from("chat-attachments").getPublicUrl(path);
    return data.publicUrl;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text && !attachment && !gifUrl) return;
    setInput("");
    setEmojiTarget(null);

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    if (gifUrl) {
      attachmentUrl  = gifUrl;
      attachmentName = "animated.gif";
      setGifUrl(null);
    } else if (attachment) {
      setUploadingFile(true);
      attachmentUrl  = await uploadAttachment(attachment);
      attachmentName = attachment.name;
      setAttachment(null);
      setUploadingFile(false);
    }

    // Optimistically show the message immediately
    const tempId = `temp-${Date.now()}`;
    const now    = new Date();
    // prefer custom pic; data URLs are local-only so don't store in DB
    const localImageUrl = customPic || user?.imageUrl || undefined;
    const dbImageUrl = customPic && !customPic.startsWith("data:") && !customPic.includes("gradient")
      ? customPic
      : user?.imageUrl ?? null;
    setMessages((prev) => [...prev, {
      id:             tempId,
      userId:         myId,
      user:           myName,
      initials:       myInitials,
      color:          "#f97316",
      imageUrl:       localImageUrl,
      time:           now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text:           text || "",
      reactions:      [],
      attachmentUrl:  attachmentUrl ?? undefined,
      attachmentName: attachmentName ?? undefined,
      pinned:         false,
      failed:         false,
    }]);

    // Only include optional columns if they have values — avoids failures if schema hasn't been updated
    const insertPayload: Record<string, unknown> = {
      channel_id:     activeChannel,
      user_id:        myId,
      user_name:      myName,
      user_initials:  myInitials,
      user_color:     "#f97316",
      user_image_url: dbImageUrl,
      text:           text || "",
    };
    if (attachmentUrl)  insertPayload.attachment_url  = attachmentUrl;
    if (attachmentName) insertPayload.attachment_name = attachmentName;

    const { data, error } = await db.from("messages").insert(insertPayload).select("id").single();

    if (error || !data?.id) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, failed: true } : m));
      return;
    }

    // Swap temp id for the real DB id so real-time deduplication works
    setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: data.id } : m));
  }

  async function toggleReaction(msgId: string, emoji: string) {
    setEmojiTarget(null);
    const msg = messages.find((m) => m.id === msgId);
    const alreadyReacted = msg?.reactions.find((r) => r.emoji === emoji)?.users.includes(myId);
    // Cap at 15 unique emoji types per message
    if (!alreadyReacted && (msg?.reactions.length ?? 0) >= 15) return;
    // Optimistic update
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const ex = m.reactions.find((r) => r.emoji === emoji);
      let reactions: typeof m.reactions;
      if (alreadyReacted) {
        reactions = m.reactions
          .map((r) => r.emoji === emoji ? { ...r, users: r.users.filter((u) => u !== myId) } : r)
          .filter((r) => r.users.length > 0);
      } else {
        reactions = ex
          ? m.reactions.map((r) => r.emoji === emoji ? { ...r, users: [...r.users, myId] } : r)
          : [...m.reactions, { emoji, users: [myId] }];
      }
      return { ...m, reactions };
    }));
    if (alreadyReacted) {
      await db.from("reactions").delete()
        .eq("message_id", msgId).eq("user_id", myId).eq("emoji", emoji);
    } else {
      await db.from("reactions").insert({ message_id: msgId, user_id: myId, emoji });
    }
  }

  function handleEmojiSelect(emoji: string) {
    if (emojiTarget === "input") {
      setInput((v) => v + emoji);
      setEmojiTarget(null);
      textareaRef.current?.focus();
    } else if (emojiTarget?.startsWith("reaction:")) {
      toggleReaction(emojiTarget.replace("reaction:", ""), emoji);
    }
  }

  async function createChannel() {
    const name = newChannelName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return;
    await db.from("channels").insert({ id: name, name, pinned: false });
    setActiveChannel(name);
    setShowNewChannel(false);
    setNewChannelName("");
    setMobileSidebar(false);
  }

  function openDM(other: WorkspaceUser) {
    const dmId = ["dm", ...[myId, other.id].sort()].join(":");
    setOpenDMs((prev) => prev.includes(dmId) ? prev : [...prev, dmId]);
    setActiveChannel(dmId);
    setShowNewDM(false);
    setMobileSidebar(false);
  }

  function formatText(wrap: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    setInput(s === e
      ? input + wrap + wrap
      : input.slice(0, s) + wrap + input.slice(s, e) + wrap + input.slice(e));
    ta.focus();
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
        <button
          onClick={() => setShowSettings(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
        >
          <Settings size={18} />
        </button>
        {/* Avatar */}
        <div className="relative" onClick={() => setPicModalOpen(true)}>
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-orange-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            {customPic ? (
              customPic.startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customPic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ background: customPic }}>
                  {user?.firstName?.[0] ?? "Y"}
                </div>
              )
            ) : user?.imageUrl ? (
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
        ${mobileSidebarOpen ? "flex absolute inset-0 w-full" : "hidden"}
        sm:relative sm:flex sm:w-[240px] sm:shrink-0 sm:inset-auto`}>
        {/* Workspace header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800/60">
          <button className="flex items-center gap-1.5 text-sm font-bold text-zinc-100 hover:text-white transition-colors">
            {WORKSPACE.name}
            <ChevronDown size={14} className="text-zinc-500" />
          </button>
          <a href="/bench" className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-all">
            <Zap size={14} />
          </a>
          <button className="hidden md:flex w-7 h-7 rounded-lg items-center justify-center bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-all">
            <Zap size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <button
            onClick={() => { setShowSearch(true); setSearchQuery(""); }}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all"
          >
            <Search size={12} />
            Search Core
            <kbd className="ml-auto text-[10px] text-zinc-700 bg-zinc-800 border border-zinc-700 rounded px-1">⌘K</kbd>
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
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => { setActiveChannel(ch.id); setMobileSidebar(false); }}
                  className={`flex items-center gap-2 w-full px-2 py-1 rounded-md text-xs transition-all ${
                    activeChannel === ch.id
                      ? "bg-orange-500/15 text-orange-300"
                      : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  {ch.pinned ? <Lock size={12} className="shrink-0 text-zinc-600" /> : <Hash size={12} className="shrink-0" />}
                  <span className="truncate flex-1 text-left">{ch.name}</span>
                </button>
              ))}
              <button
                onClick={() => setShowNewChannel(true)}
                className="flex items-center gap-2 w-full px-2 py-1 rounded-md text-xs text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition-all"
              >
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
              {openDMs.map((dmId) => {
                const otherId = dmId.split(":").find((id) => id !== "dm" && id !== myId);
                const other = dmUsers.find((u) => u.id === otherId);
                if (!other) return null;
                return (
                  <button
                    key={dmId}
                    onClick={() => { setActiveChannel(dmId); setMobileSidebar(false); }}
                    className={`flex items-center gap-2 w-full px-2 py-1 rounded-md text-xs transition-all ${
                      activeChannel === dmId
                        ? "bg-orange-500/15 text-orange-300"
                        : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: other.color }}>
                        {other.imageUrl
                          ? <Image src={other.imageUrl} alt={other.name} width={20} height={20} className="w-full h-full object-cover" />
                          : other.initials[0]}
                      </div>
                      {onlineUserIds.has(other.id) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-900"
                          style={{ backgroundColor: STATUS_COLOR.online }} />
                      )}
                    </div>
                    <span className="truncate flex-1 text-left">{other.name}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setShowNewDM(true)}
                className="flex items-center gap-2 w-full px-2 py-1 rounded-md text-xs text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition-all"
              >
                <Plus size={12} />
                New message
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />
      </aside>

      {/* ── Main chat area ───────────────────────────────── */}
      <div className={`flex-col flex-1 min-w-0 overflow-hidden ${mobileSidebarOpen ? "hidden sm:flex" : "flex"}`}>

        {/* Channel header */}
        <header className="flex items-center justify-between h-12 shrink-0 px-4 bg-zinc-950 border-b border-zinc-800 z-10">
          <div className="flex items-center gap-2">
            {/* back to sidebar on mobile */}
            <button
              onClick={() => setMobileSidebar(true)}
              className="sm:hidden w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all -ml-1 mr-1"
            >
              <ArrowLeft size={16} />
            </button>
            {isDM ? (
              <>
                <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center text-[10px] font-bold text-white bg-zinc-700 shrink-0">
                  {activeDMUser?.imageUrl
                    ? <Image src={activeDMUser.imageUrl} alt={activeDMUser.name} width={24} height={24} className="w-full h-full object-cover" />
                    : activeDMUser?.initials[0]}
                </div>
                <span className="text-sm font-bold text-zinc-100">{activeDMUser?.name ?? "Direct Message"}</span>
              </>
            ) : (
              <>
                <Hash size={16} className="text-zinc-400" />
                <span className="text-sm font-bold text-zinc-100">{channel?.name}</span>
                {channel?.pinned && <Lock size={12} className="text-zinc-600" />}
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
            {!isDM && (
              <button
                onClick={() => setShowPinned((v) => !v)}
                className={`relative w-8 h-8 rounded-md flex items-center justify-center transition-all ${showPinned ? "bg-orange-500/15 text-orange-400" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"}`}
                title="Pinned messages"
              >
                <Bookmark size={15} className={showPinned ? "fill-orange-400" : ""} />
                {pinnedMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[8px] flex items-center justify-center font-bold">
                    {pinnedMessages.length}
                  </span>
                )}
              </button>
            )}
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
          {loading ? (
            <div className="flex items-center justify-center flex-1 py-16">
              <div className="w-5 h-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : currentMessages.length === 0 ? (
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
                      msg.imageUrl?.includes("gradient") ? (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ background: msg.imageUrl }}>
                          {msg.initials[0]}
                        </div>
                      ) : msg.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={msg.imageUrl} alt={msg.user} className="w-9 h-9 rounded-xl object-cover" />
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
                    {msg.text && <p className="text-sm text-zinc-300 leading-relaxed">{msg.text}</p>}
                    {msg.failed && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-2">
                        Failed to save
                        <button
                          onClick={() => setMessages((prev) => prev.filter((m) => m.id !== msg.id))}
                          className="underline hover:text-red-300 transition-colors"
                        >
                          Dismiss
                        </button>
                      </p>
                    )}
                    {msg.attachmentUrl && (
                      <div className="mt-1.5">
                        {/\.(jpe?g|png|gif|webp)$/i.test(msg.attachmentName ?? "") ? (
                          <Image
                            src={msg.attachmentUrl}
                            alt={msg.attachmentName ?? "attachment"}
                            width={300}
                            height={200}
                            className="rounded-lg max-w-xs object-cover border border-zinc-700"
                          />
                        ) : (
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:border-zinc-600 transition-all w-fit"
                          >
                            <Paperclip size={12} className="text-zinc-500 shrink-0" />
                            {msg.attachmentName ?? "Attachment"}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Reactions */}
                    {msg.reactions.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
                        {msg.reactions.map((r) => (
                          <button
                            key={r.emoji}
                            onClick={() => toggleReaction(msg.id, r.emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs transition-all ${
                              r.users.includes(myId)
                                ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                                : "bg-zinc-800 border-zinc-700 hover:border-orange-500/40 hover:bg-zinc-700 text-zinc-300"
                            }`}
                          >
                            {r.emoji} <span className="text-zinc-400 ml-0.5">{r.users.length}</span>
                          </button>
                        ))}
                        <div className="relative" ref={emojiTarget === `reaction:${msg.id}` ? pickerRef : undefined}>
                          <button
                            onClick={() => setEmojiTarget(emojiTarget === `reaction:${msg.id}` ? null : `reaction:${msg.id}`)}
                            className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800/50 border border-zinc-700/50 hover:border-orange-500/30 text-zinc-600 hover:text-zinc-300 transition-all"
                          >
                            <Smile size={12} />
                          </button>
                          {emojiTarget === `reaction:${msg.id}` && <EmojiPicker onSelect={handleEmojiSelect} />}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hover action bar */}
                  <div className="absolute right-2 top-0 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-zinc-800 border border-zinc-700 rounded-lg px-1 py-0.5 shadow-lg">
                    <div className="relative" ref={emojiTarget === `reaction:${msg.id}` ? pickerRef : undefined}>
                      <button
                        onClick={() => setEmojiTarget(emojiTarget === `reaction:${msg.id}` ? null : `reaction:${msg.id}`)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-all"
                        title="React"
                      >
                        <Smile size={13} />
                      </button>
                      {emojiTarget === `reaction:${msg.id}` && <EmojiPicker onSelect={handleEmojiSelect} placement="below" />}
                    </div>
                    <button className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-all" title="Reply in thread">
                      <MessageSquare size={13} />
                    </button>
                    <button
                      onClick={() => togglePin(msg.id, msg.pinned)}
                      className={`w-6 h-6 flex items-center justify-center hover:bg-zinc-700 rounded transition-all ${msg.pinned ? "text-orange-400" : "text-zinc-500 hover:text-zinc-200"}`}
                      title={msg.pinned ? "Unpin message" : "Pin message"}
                    >
                      <Bookmark size={13} className={msg.pinned ? "fill-orange-400" : ""} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setMessageMenuId(messageMenuId === msg.id ? null : msg.id)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-all"
                        title="More"
                      >
                        <MoreHorizontal size={13} />
                      </button>
                      {messageMenuId === msg.id && (
                        <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1 min-w-[110px]">
                          {msg.userId === myId && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-400 hover:bg-zinc-700 hover:text-red-300 transition-all"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="shrink-0 px-4 pb-4 pt-2 bg-zinc-950">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 focus-within:border-zinc-600 transition-colors">
            {/* Formatting toolbar */}
            <div className="flex items-center gap-0.5 px-3 pt-2 pb-1 border-b border-zinc-800">
              <button
                onMouseDown={(e) => { e.preventDefault(); formatText("**"); }}
                className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all"
                title="Bold"
              >
                <Bold size={12} />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); formatText("_"); }}
                className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all"
                title="Italic"
              >
                <Italic size={12} />
              </button>
              <div className="w-px h-3.5 bg-zinc-700 mx-1" />
              <button
                onMouseDown={(e) => { e.preventDefault(); setInput((v) => v + "@"); textareaRef.current?.focus(); }}
                className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all"
                title="Mention"
              >
                <AtSign size={12} />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); setInput((v) => v + "#"); textareaRef.current?.focus(); }}
                className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all"
                title="Channel"
              >
                <Hash size={12} />
              </button>
            </div>

            {/* Attachment / GIF preview */}
            {(attachment || gifUrl) && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
                {attachment && (
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
                    <Paperclip size={12} className="text-zinc-500" />
                    <span className="truncate max-w-[180px]">{attachment.name}</span>
                    <button onMouseDown={(e) => { e.preventDefault(); setAttachment(null); }} className="text-zinc-500 hover:text-zinc-200">
                      <X size={11} />
                    </button>
                  </div>
                )}
                {gifUrl && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={gifUrl} alt="GIF preview" className="h-14 rounded-lg border border-zinc-700 object-cover" />
                    <button
                      onMouseDown={(e) => { e.preventDefault(); setGifUrl(null); }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-zinc-300 hover:text-white"
                    >
                      <X size={9} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => { setAttachment(e.target.files?.[0] ?? null); e.target.value = ""; }}
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                  className={`w-7 h-7 flex items-center justify-center hover:bg-zinc-800 rounded-lg transition-all ${attachment ? "text-orange-400" : "text-zinc-600 hover:text-zinc-300"}`}
                  title="Attach file"
                >
                  <Paperclip size={15} />
                </button>
                <div className="relative" ref={emojiTarget === "input" ? pickerRef : undefined}>
                  <button
                    onClick={() => setEmojiTarget(emojiTarget === "input" ? null : "input")}
                    className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all"
                    title="Emoji"
                  >
                    <Smile size={15} />
                  </button>
                  {emojiTarget === "input" && <EmojiPicker onSelect={handleEmojiSelect} onGifSelect={(url) => { setGifUrl(url); setEmojiTarget(null); }} />}
                </div>
                <button
                  onMouseDown={(e) => { e.preventDefault(); setInput((v) => v + "@"); textareaRef.current?.focus(); }}
                  className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all"
                  title="Mention"
                >
                  <AtSign size={15} />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={(!input.trim() && !attachment && !gifUrl) || uploadingFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all"
              >
                {uploadingFile
                  ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <Send size={13} />}
                {uploadingFile ? "Uploading…" : "Send"}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-700 mt-1.5 px-1">
            <strong className="text-zinc-600">Enter</strong> to send · <strong className="text-zinc-600">Shift+Enter</strong> for new line
          </p>
        </div>

        {/* Pinned messages panel */}
        {showPinned && !isDM && (
          <div className="absolute inset-y-0 right-0 w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col z-20 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Bookmark size={14} className="text-orange-400 fill-orange-400" />
                <span className="text-sm font-bold text-zinc-100">Pinned</span>
                {pinnedMessages.length > 0 && (
                  <span className="text-xs text-zinc-600">({pinnedMessages.length})</span>
                )}
              </div>
              <button onClick={() => setShowPinned(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {pinnedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-zinc-700 gap-2 py-12">
                  <Bookmark size={28} strokeWidth={1} />
                  <p className="text-xs">No pinned messages yet</p>
                </div>
              ) : (
                pinnedMessages.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ backgroundColor: msg.imageUrl?.includes("gradient") ? undefined : msg.color, background: msg.imageUrl?.includes("gradient") ? msg.imageUrl : undefined }}>
                        {msg.imageUrl && !msg.imageUrl.includes("gradient")
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={msg.imageUrl} alt={msg.user} className="w-full h-full object-cover" />
                          : msg.initials[0]}
                      </div>
                      <span className="text-xs font-semibold text-zinc-200 flex-1 truncate">{msg.user}</span>
                      <span className="text-[10px] text-zinc-600 shrink-0">{msg.time}</span>
                    </div>
                    {msg.text && <p className="text-xs text-zinc-400 leading-relaxed mb-2 line-clamp-3">{msg.text}</p>}
                    {msg.attachmentUrl && /\.(jpe?g|png|gif|webp)$/i.test(msg.attachmentName ?? "") && (
                      <Image src={msg.attachmentUrl} alt="attachment" width={200} height={100}
                        className="rounded-lg object-cover border border-zinc-700 mb-2 w-full" />
                    )}
                    <button
                      onClick={() => togglePin(msg.id, true)}
                      className="text-[10px] text-zinc-600 hover:text-orange-400 transition-colors"
                    >
                      Unpin
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add Channel modal ── */}
      {showNewChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowNewChannel(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-100">Add a channel</h3>
              <button onClick={() => setShowNewChannel(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X size={16} /></button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 mb-4">
              <Hash size={14} className="text-zinc-500" />
              <input
                autoFocus
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createChannel()}
                placeholder="channel-name"
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
              />
            </div>
            <button
              onClick={createChannel}
              disabled={!newChannelName.trim()}
              className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-30 text-white text-sm font-semibold transition-all"
            >
              Create Channel
            </button>
          </div>
        </div>
      )}

      {/* ── Search modal ── */}
      {showSearch && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70"
          onClick={() => { setShowSearch(false); setSearchQuery(""); }}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
              <Search size={16} className="text-zinc-500 shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people and channels…"
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {/* People */}
              {filteredUsers.length > 0 && (
                <div className="mb-1">
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-2 py-1.5">People</p>
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { openDM(u); setShowSearch(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-zinc-800 transition-all text-left"
                    >
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: u.color }}>
                          {u.imageUrl
                            ? <Image src={u.imageUrl} alt={u.name} width={32} height={32} className="w-full h-full object-cover" />
                            : u.initials}
                        </div>
                        {onlineUserIds.has(u.id) && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900" style={{ backgroundColor: STATUS_COLOR.online }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{u.name}</p>
                        <p className="text-xs text-zinc-600">{onlineUserIds.has(u.id) ? "Active now" : "Offline"}</p>
                      </div>
                      <MessageSquare size={14} className="text-zinc-700 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Channels */}
              {filteredChannels.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-2 py-1.5">Channels</p>
                  {filteredChannels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => { setActiveChannel(ch.id); setMobileSidebar(false); setShowSearch(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-zinc-800 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        {ch.pinned ? <Lock size={14} className="text-zinc-500" /> : <Hash size={14} className="text-zinc-500" />}
                      </div>
                      <div>
                        <p className="text-sm text-zinc-200"># {ch.name}</p>
                        {ch.pinned && <p className="text-xs text-zinc-600">Pinned channel</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {searchQuery && filteredUsers.length === 0 && filteredChannels.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-700">
                  <Search size={28} strokeWidth={1} />
                  <p className="text-sm mt-2">No results for &ldquo;{searchQuery}&rdquo;</p>
                </div>
              )}

              {/* Default empty state */}

      <ProfilePicModal
        isOpen={picModalOpen}
        onClose={() => setPicModalOpen(false)}
        userInitial={user?.firstName?.[0] ?? "?"}
        currentPic={customPic}
        onSelect={(pic) => {
          setCustomPic(pic);
          try { localStorage.setItem(PROFILE_PIC_KEY, pic); } catch { /* noop */ }
        }}
      />
              {!searchQuery && filteredUsers.length === 0 && filteredChannels.length === 0 && (
                <p className="text-xs text-zinc-700 text-center py-8">No workspace members yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Settings / Admin modal ── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowSettings(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-100">Admin</h3>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X size={16} /></button>
            </div>
            <a
              href="https://supabase.com/dashboard/org/xqlygtgtiiriwlffwqui"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-700 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-emerald-400" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100 group-hover:text-white">Supabase</p>
                <p className="text-xs text-zinc-500">Database &amp; Storage</p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* ── New DM modal ── */}
      {showNewDM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowNewDM(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-100">New Message</h3>
              <button onClick={() => setShowNewDM(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X size={16} /></button>
            </div>
            <p className="text-xs text-zinc-500 mb-3">Select a workspace member to message</p>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {dmUsers.filter((u) => u.id !== myId).map((u) => (
                <button
                  key={u.id}
                  onClick={() => openDM(u)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-all text-left"
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: u.color }}>
                      {u.imageUrl
                        ? <Image src={u.imageUrl} alt={u.name} width={32} height={32} className="w-full h-full object-cover" />
                        : u.initials}
                    </div>
                    {onlineUserIds.has(u.id) && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900"
                        style={{ backgroundColor: STATUS_COLOR.online }} />
                    )}
                  </div>
                  <span className="text-sm text-zinc-200">{u.name}</span>
                </button>
              ))}
              {dmUsers.filter((u) => u.id !== myId).length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-6">No other members have joined yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
