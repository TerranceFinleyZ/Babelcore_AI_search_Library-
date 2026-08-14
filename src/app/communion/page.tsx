"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { useSupabase } from "@/lib/useSupabase";
import ProfilePicModal, { PROFILE_PIC_KEY, AvatarDisplay } from "@/components/ProfilePicModal";
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

function EmojiPicker({ onSelect, onGifSelect, placement = "above", fixedPos }: { onSelect: (emoji: string) => void; onGifSelect?: (url: string) => void; placement?: "above" | "below"; fixedPos?: { bottom: number; left: number } }) {
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
    <div
      className={`z-[9999] w-[288px] bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-3 ${
        fixedPos ? "fixed" : `absolute ${placement === "below" ? "top-full mt-2" : "bottom-full mb-2"} right-0`
      }`}
      style={fixedPos ? { bottom: fixedPos.bottom, left: fixedPos.left } : undefined}
    >
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
  online:  "#22c55e",
  away:    "#eab308",
  offline: "#ef4444",
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages]               = useState<Message[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [emojiTarget, setEmojiTarget]         = useState<string | null>(null);
  const [channels, setChannels]               = useState<Channel[]>([]);
  const [dmUsers, setDmUsers]                 = useState<WorkspaceUser[]>([]);
  const [openDMs, setOpenDMs]                 = useState<string[]>([]);
  const [dmContactMap, setDmContactMap]       = useState<Record<string, WorkspaceUser>>({});
  const [dmUnread, setDmUnread]               = useState<Record<string, number>>({});
  const [threadMsgId, setThreadMsgId]         = useState<string | null>(null);
  const [threadReplies, setThreadReplies]     = useState<Message[]>([]);
  const [threadInput, setThreadInput]         = useState("");
  const [threadCounts, setThreadCounts]       = useState<Record<string, number>>({});
  const [threadUnread, setThreadUnread]       = useState<Record<string, number>>({});
  const [threadLoading, setThreadLoading]     = useState(false);
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
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
  const [sidebarSearchFocused, setSidebarSearchFocused] = useState(false);
  const [showPinned, setShowPinned]           = useState(false);
  const [messageMenuId, setMessageMenuId]     = useState<string | null>(null);
  const [reportMsgId, setReportMsgId]         = useState<string | null>(null);
  const [reportCategory, setReportCategory]   = useState("other");
  const [reportDesc, setReportDesc]           = useState("");
  const [reportStatus, setReportStatus]       = useState<"idle" | "loading" | "done" | "error">("idle");
  const [picModalOpen, setPicModalOpen]       = useState(false);
  const [customPic, setCustomPic]             = useState<string | null>(null);
  const [avatarPopup, setAvatarPopup]         = useState<{ user: WorkspaceUser; x: number; y: number; msgId: string; msgPinned: boolean } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_PIC_KEY);
      if (stored) setCustomPic(stored);
    } catch { /* noop */ }
  }, []);

  // Load persisted DMs on mount (client-only, avoids SSR mismatch)
  useEffect(() => {
    try {
      const s = localStorage.getItem("communion_open_dms");
      if (s) setOpenDMs(JSON.parse(s));
      const c = localStorage.getItem("communion_dm_contacts");
      if (c) setDmContactMap(JSON.parse(c));
    } catch { /* noop */ }
  }, []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef   = useRef<HTMLDivElement>(null);
  const emojiInputBtnRef = useRef<HTMLButtonElement>(null);
  const [emojiInputPos, setEmojiInputPos] = useState<{ bottom: number; left: number } | null>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const threadEndRef    = useRef<HTMLDivElement>(null);
  // accumulates IDs of messages the current user has authored (for thread notification matching)
  const myMsgIdsRef     = useRef<Set<string>>(new Set());

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

  // Supplement dmUsers with unique senders from messages (catches users who haven't visited recently)
  useEffect(() => {
    supabase.from("messages")
      .select("user_id, user_name, user_initials, user_color, user_image_url")
      .then(({ data }) => {
        if (!data) return;
        const seen = new Set<string>();
        const extras: WorkspaceUser[] = [];
        for (const row of data) {
          if (seen.has(row.user_id)) continue;
          seen.add(row.user_id);
          extras.push({
            id: row.user_id, name: row.user_name,
            initials: row.user_initials, color: row.user_color,
            imageUrl: row.user_image_url ?? undefined, lastSeen: "",
          });
        }
        setDmUsers((prev) => {
          const merged = [...prev];
          for (const u of extras) {
            if (!merged.some((m) => m.id === u.id)) merged.push(u);
          }
          return merged;
        });
      });
  }, []);

  // Auto-add incoming DM channels to the sidebar for the recipient
  useEffect(() => {
    if (!myId || myId === "anon") return;
    const incomingSub = supabase
      .channel("incoming-dms:" + myId)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as Record<string, string>;
          const chId = row.channel_id;
          // ── DM notifications ──
          if (chId?.startsWith("dm:") && chId.includes(myId)) {
            setOpenDMs((prev) => {
              if (prev.includes(chId)) return prev;
              const next = [...prev, chId];
              try { localStorage.setItem("communion_open_dms", JSON.stringify(next)); } catch { /* noop */ }
              return next;
            });
            if (row.user_id !== myId) {
              setDmUnread((prev) => {
                const active = window.__communionActiveChannel__ as string | undefined;
                if (active === chId) return prev;
                return { ...prev, [chId]: (prev[chId] ?? 0) + 1 };
              });
            }
          }
          // ── Thread reply notifications ──
          if (chId?.startsWith("thread:") && row.user_id !== myId) {
            const parentMsgId = chId.replace("thread:", "");
            if (myMsgIdsRef.current.has(parentMsgId)) {
              setThreadUnread((prev) => {
                const activeThread = window.__communionThreadMsgId__;
                if (activeThread === parentMsgId) return prev;
                return { ...prev, [parentMsgId]: (prev[parentMsgId] ?? 0) + 1 };
              });
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(incomingSub); };
  }, [myId]);

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

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadReplies]);

  // Load thread reply counts for the current channel's messages
  useEffect(() => {
    if (messages.length === 0) return;
    const chIds = messages.map((m) => `thread:${m.id}`);
    supabase.from("messages").select("channel_id")
      .in("channel_id", chIds)
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        for (const row of data) counts[row.channel_id.replace("thread:", "")] = (counts[row.channel_id.replace("thread:", "")] ?? 0) + 1;
        setThreadCounts(counts);
      });
  }, [messages]);

  // Load and subscribe to thread replies
  useEffect(() => {
    if (!threadMsgId) { setThreadReplies([]); return; }
    const chId = `thread:${threadMsgId}`;
    setThreadLoading(true);
    supabase.from("messages").select("*").eq("channel_id", chId).order("created_at", { ascending: true })
      .then(({ data }) => {
        setThreadReplies((data ?? []).map((row) => ({
          id: row.id, userId: row.user_id, user: row.user_name,
          initials: row.user_initials, color: row.user_color,
          imageUrl: row.user_image_url ?? undefined,
          time: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: row.text, reactions: [], pinned: false,
          attachmentUrl: row.attachment_url ?? undefined,
          attachmentName: row.attachment_name ?? undefined,
        })));
        setThreadLoading(false);
      });
    const sub = supabase.channel(`thread-room:${threadMsgId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${chId}` },
        (payload) => {
          const row = payload.new as Record<string, string>;
          setThreadReplies((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, {
              id: row.id, userId: row.user_id, user: row.user_name,
              initials: row.user_initials, color: row.user_color,
              imageUrl: row.user_image_url ?? undefined,
              time: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              text: row.text, reactions: [], pinned: false,
            }];
          });
          setThreadCounts((prev) => ({ ...prev, [threadMsgId]: (prev[threadMsgId] ?? 0) + 1 }));
        }
      ).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [threadMsgId]);

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

  // Sync active channel to window for the unread closure, and clear unread when switching into a DM
  useEffect(() => {
    window.__communionActiveChannel__ = activeChannel;
    if (activeChannel.startsWith("dm:")) {
      setDmUnread((prev) => {
        if (!prev[activeChannel]) return prev;
        const next = { ...prev };
        delete next[activeChannel];
        return next;
      });
    }
  }, [activeChannel]);

  // Track my authored message IDs so the incoming subscription can match thread notifications
  useEffect(() => {
    messages.forEach((m) => { if (m.userId === myId) myMsgIdsRef.current.add(m.id); });
  }, [messages, myId]);

  // Sync active thread to window and clear thread unread when opening a thread
  useEffect(() => {
    window.__communionThreadMsgId__ = threadMsgId ?? "";
    if (threadMsgId) {
      setThreadUnread((prev) => {
        if (!prev[threadMsgId]) return prev;
        const next = { ...prev };
        delete next[threadMsgId];
        return next;
      });
    }
  }, [threadMsgId]);
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

  async function sendThreadReply() {
    const text = threadInput.trim();
    if (!text || !threadMsgId) return;
    setThreadInput("");
    const tempId = `temp-${Date.now()}`;
    const now = new Date();
    const localImageUrl = customPic || user?.imageUrl || undefined;
    const dbImageUrl = customPic && !customPic.startsWith("data:") && !customPic.includes("gradient") ? customPic : user?.imageUrl ?? null;
    setThreadReplies((prev) => [...prev, {
      id: tempId, userId: myId, user: myName, initials: myInitials,
      color: "#f97316", imageUrl: localImageUrl,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text, reactions: [], pinned: false,
    }]);
    const { data, error } = await db.from("messages").insert({
      channel_id: `thread:${threadMsgId}`,
      user_id: myId, user_name: myName, user_initials: myInitials,
      user_color: "#f97316", user_image_url: dbImageUrl, text,
    }).select("id").single();
    if (!error && data?.id) {
      setThreadReplies((prev) => prev.map((m) => m.id === tempId ? { ...m, id: data.id } : m));
      setThreadCounts((prev) => ({ ...prev, [threadMsgId]: (prev[threadMsgId] ?? 0) + 1 }));
    }
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
    setOpenDMs((prev) => {
      if (prev.includes(dmId)) return prev;
      const next = [...prev, dmId];
      try { localStorage.setItem("communion_open_dms", JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
    setDmContactMap((prev) => {
      if (prev[dmId]) return prev;
      const next = { ...prev, [dmId]: other };
      try { localStorage.setItem("communion_dm_contacts", JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
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
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
          <Bell size={18} />
          {(() => {
            const total = Object.values(dmUnread).reduce((a, b) => a + b, 0)
              + Object.values(threadUnread).reduce((a, b) => a + b, 0);
            return total > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                {total > 99 ? "99+" : total}
              </span>
            ) : null;
          })()}
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
            <AvatarDisplay
              pic={customPic}
              fallbackUrl={user?.imageUrl}
              initial={user?.firstName?.[0] ?? "Y"}
              className="w-full h-full"
            />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-zinc-900" />
        </div>
      </div>

      {/* ── Left sidebar ────────────────────────────────── */}
      <aside className={`flex-col bg-zinc-900 border-r border-zinc-800 overflow-y-auto z-40
        ${mobileSidebarOpen ? "flex absolute inset-0 w-full" : "hidden"}
        ${sidebarCollapsed ? "sm:hidden" : "sm:relative sm:flex sm:w-[240px] sm:shrink-0 sm:inset-auto"}`}>
        {/* Workspace header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800/60">
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="flex items-center gap-1.5 text-sm font-bold text-zinc-100 hover:text-white transition-colors"
          >
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
          <div className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 focus-within:border-zinc-600 focus-within:bg-zinc-800 transition-all">
            <Search size={12} className="text-zinc-500 shrink-0" />
            <input
              value={sidebarSearchQuery}
              onChange={(e) => setSidebarSearchQuery(e.target.value)}
              onFocus={() => setSidebarSearchFocused(true)}
              onBlur={() => setTimeout(() => setSidebarSearchFocused(false), 150)}
              placeholder="Search people…"
              className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-600 outline-none min-w-0"
            />
            {sidebarSearchQuery
              ? <button onMouseDown={(e) => { e.preventDefault(); setSidebarSearchQuery(""); }} className="text-zinc-600 hover:text-zinc-400 transition-colors"><X size={10} /></button>
              : <kbd className="text-[10px] text-zinc-700 bg-zinc-800 border border-zinc-700 rounded px-1 shrink-0">⌘K</kbd>
            }
          </div>

          {/* Suggestions render inline so sidebar overflow-y-auto doesn't clip them */}
          {sidebarSearchFocused && sidebarSearchQuery.trim() && (() => {
            const q = sidebarSearchQuery.toLowerCase();
            const matches = dmUsers.filter((u) => u.id !== myId && u.name.toLowerCase().includes(q));
            return (
              <div className="mt-1 rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
                {matches.length === 0 ? (
                  <p className="text-[10px] text-zinc-600 text-center py-3">No users found</p>
                ) : matches.slice(0, 6).map((u) => (
                  <button
                    key={u.id}
                    onMouseDown={(e) => { e.preventDefault(); openDM(u); setSidebarSearchQuery(""); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-zinc-800 transition-all text-left"
                  >
                    <div className="relative shrink-0">
                      <AvatarDisplay
                        pic={u.imageUrl ?? null}
                        initial={u.initials[0]}
                        color={u.color}
                        className="w-7 h-7 rounded-lg text-[11px]"
                      />
                      {onlineUserIds.has(u.id) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-900" style={{ backgroundColor: STATUS_COLOR.online }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-200 truncate">{u.name}</p>
                      <p className="text-[10px] text-zinc-600">{onlineUserIds.has(u.id) ? "Active now" : "Offline"}</p>
                    </div>
                    <MessageSquare size={12} className="text-zinc-700 shrink-0" />
                  </button>
                ))}
              </div>
            );
          })()}
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
                const other = dmUsers.find((u) => u.id === otherId) ?? dmContactMap[dmId];
                if (!other) return null;
                return (
                  <div key={dmId} className="group relative flex items-center">
                    <button
                      onClick={() => { setActiveChannel(dmId); setMobileSidebar(false); }}
                      className={`flex items-center gap-2 flex-1 min-w-0 px-2 py-1 rounded-md text-xs transition-all ${
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
                      {dmUnread[dmId] > 0 && (
                        <span className="shrink-0 min-w-[16px] h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                          {dmUnread[dmId] > 99 ? "99+" : dmUnread[dmId]}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const next = openDMs.filter((id) => id !== dmId);
                        setOpenDMs(next);
                        try { localStorage.setItem("communion_open_dms", JSON.stringify(next)); } catch { /* noop */ }
                        if (activeChannel === dmId) setActiveChannel("general");
                      }}
                      className="hidden group-hover:flex shrink-0 w-4 h-4 items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 transition-all mr-1"
                      title="Remove"
                    >
                      <X size={10} />
                    </button>
                  </div>
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

        {/* Badges */}
        <div className="mt-4 px-2 sm:px-2 pl-12">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-1 mb-2">Badges</p>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="badge-slot w-8 h-8 rounded-full border border-zinc-700 border-dashed"
              />
            ))}
          </div>
        </div>

        <div className="flex-1" />
      </aside>

      {/* ── Main chat area ───────────────────────────────── */}
      <div className={`flex-col flex-1 min-w-0 overflow-hidden ${mobileSidebarOpen ? "hidden sm:flex" : "flex"}`}>

        {/* Channel header */}
        <header className="flex items-center justify-between h-12 shrink-0 px-4 bg-zinc-950 border-b border-zinc-800 z-10">
          <div className="flex items-center gap-2">
            {/* reopen sidebar on desktop when collapsed */}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="hidden sm:flex w-7 h-7 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all -ml-1 mr-1"
                title="Open sidebar"
              >
                <ChevronRight size={15} />
              </button>
            )}
            <button
              onClick={() => setMobileSidebar(true)}
              className="sm:hidden w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all -ml-1 mr-1"
            >
              <ArrowLeft size={16} />
            </button>
            {isDM ? (
              <>
                <AvatarDisplay
                  pic={activeDMUser?.imageUrl ?? null}
                  initial={activeDMUser?.initials[0] ?? "?"}
                  color={activeDMUser?.color}
                  className="w-6 h-6 rounded-md shrink-0 text-[10px]"
                />
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

          {/* DM intro */}
          {isDM && activeDMUser && (
            <div className="mb-6 pb-6 border-b border-zinc-800/60 flex flex-col items-start gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: activeDMUser.color }}>
                  <AvatarDisplay
                    pic={activeDMUser.imageUrl ?? null}
                    initial={activeDMUser.initials[0]}
                    color={activeDMUser.color}
                    className="w-full h-full"
                  />
                </div>
                <span
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-950"
                  style={{ backgroundColor: onlineUserIds.has(activeDMUser.id) ? STATUS_COLOR.online : STATUS_COLOR.offline }}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100">{activeDMUser.name}</h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  This is the beginning of your direct message history with <span className="text-zinc-300 font-medium">{activeDMUser.name}</span>.
                </p>
              </div>
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
                      <div
                        className="relative cursor-pointer"
                        onClick={(e) => {
                          if (msg.userId === myId) {
                            setPicModalOpen(true);
                          } else {
                            setAvatarPopup({
                              user: { id: msg.userId, name: msg.user, initials: msg.initials, imageUrl: msg.imageUrl, color: msg.color, lastSeen: "" },
                              x: e.clientX,
                              y: e.clientY,
                              msgId: msg.id,
                              msgPinned: msg.pinned,
                            });
                          }
                        }}
                      >
                        {(() => {
                          // always reflect the latest pic for own messages
                          const pic = msg.userId === myId ? (customPic || msg.imageUrl) : msg.imageUrl;
                          return <AvatarDisplay pic={pic ?? null} initial={msg.initials[0]} color={msg.color} className="w-9 h-9 rounded-xl" />;
                        })()}
                        {/* Status dot */}
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950"
                          style={{ backgroundColor: onlineUserIds.has(msg.userId) ? STATUS_COLOR.online : STATUS_COLOR.offline }}
                        />
                      </div>
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
                        {msg.reactions.map((r) => {
                          const reactorNames = r.users.map((uid) => ({
                            uid,
                            name: uid === myId ? myName : (dmUsers.find((u) => u.id === uid)?.name ?? "Unknown"),
                          }));
                          return (
                            <div key={r.emoji} className="relative group/rx">
                              <button
                                onClick={() => toggleReaction(msg.id, r.emoji)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs transition-all ${
                                  r.users.includes(myId)
                                    ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                                    : "bg-zinc-800 border-zinc-700 hover:border-orange-500/40 hover:bg-zinc-700 text-zinc-300"
                                }`}
                              >
                                {r.emoji} <span className="text-zinc-400 ml-0.5">{r.users.length}</span>
                              </button>
                              {/* Hover tooltip listing every reactor */}
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/rx:block z-50">
                                <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap min-w-max">
                                  <p className="text-[10px] font-semibold text-zinc-400 mb-1">{r.emoji} Reacted</p>
                                  {reactorNames.map(({ uid, name }) => (
                                    <p key={uid} className="text-[11px] text-zinc-200 leading-snug">{name}</p>
                                  ))}
                                </div>
                                <div className="w-2 h-2 bg-zinc-800 border-r border-b border-zinc-700 rotate-45 mx-auto -mt-1" />
                              </div>
                            </div>
                          );
                        })}
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
                    {/* Thread reply count */}
                    {threadCounts[msg.id] > 0 && (
                      <button
                        onClick={() => { setThreadMsgId(msg.id); setShowPinned(false); }}
                        className="flex items-center gap-1.5 mt-1.5 text-[11px] text-orange-400 hover:text-orange-300 hover:underline transition-colors"
                      >
                        <MessageSquare size={11} />
                        {threadCounts[msg.id]} {threadCounts[msg.id] === 1 ? "reply" : "replies"}
                        {threadUnread[msg.id] > 0 && (
                          <span className="ml-1 min-w-[16px] h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                            {threadUnread[msg.id]}
                          </span>
                        )}
                      </button>
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
                    <button
                      onClick={() => { setThreadMsgId(msg.id); setShowPinned(false); }}
                      className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-all" title="Reply in thread">
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
                          {msg.userId !== myId && (
                            <button
                              onClick={() => { setReportMsgId(msg.id); setMessageMenuId(null); setReportCategory("other"); setReportDesc(""); setReportStatus("idle"); }}
                              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-orange-400 hover:bg-zinc-700 hover:text-orange-300 transition-all"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                              Report
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
                    ref={emojiInputBtnRef}
                    onClick={() => {
                      if (emojiTarget !== "input") {
                        const rect = emojiInputBtnRef.current?.getBoundingClientRect();
                        if (rect) setEmojiInputPos({ bottom: window.innerHeight - rect.top + 6, left: Math.max(8, rect.right - 288) });
                      }
                      setEmojiTarget(emojiTarget === "input" ? null : "input");
                    }}
                    className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all"
                    title="Emoji"
                  >
                    <Smile size={15} />
                  </button>
                  {emojiTarget === "input" && <EmojiPicker onSelect={handleEmojiSelect} onGifSelect={(url) => { setGifUrl(url); setEmojiTarget(null); }} fixedPos={emojiInputPos ?? undefined} />}
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
                      <AvatarDisplay
                        pic={msg.userId === myId ? (customPic || msg.imageUrl || null) : (msg.imageUrl || null)}
                        initial={msg.initials[0]}
                        color={msg.color}
                        className="w-5 h-5 rounded-md shrink-0 text-[9px]"
                      />
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

        {/* ── Thread panel ── */}
        {threadMsgId && (() => {
          const parent = currentMessages.find((m) => m.id === threadMsgId);
          return (
            <div className="absolute inset-y-0 right-0 w-[360px] bg-zinc-900 border-l border-zinc-800 flex flex-col z-20 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-orange-400" />
                  <span className="text-sm font-bold text-zinc-100">Thread</span>
                </div>
                <button onClick={() => setThreadMsgId(null)} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X size={14} /></button>
              </div>

              {/* Original message */}
              {parent && (
                <div className="px-4 py-3 border-b border-zinc-800/60 shrink-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AvatarDisplay
                      pic={parent.userId === myId ? (customPic || parent.imageUrl || null) : (parent.imageUrl || null)}
                      initial={parent.initials[0]} color={parent.color}
                      className="w-7 h-7 rounded-lg shrink-0 text-[11px]"
                    />
                    <span className="text-xs font-bold text-zinc-100">{parent.user}</span>
                    <span className="text-[11px] text-zinc-600">{parent.time}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{parent.text}</p>
                  <p className="text-[10px] text-zinc-600 mt-1.5">
                    {threadCounts[threadMsgId] ?? 0} {(threadCounts[threadMsgId] ?? 0) === 1 ? "reply" : "replies"}
                  </p>
                </div>
              )}

              {/* Replies */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {threadLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                  </div>
                ) : threadReplies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-zinc-700 gap-2">
                    <MessageSquare size={28} strokeWidth={1} />
                    <p className="text-xs">No replies yet. Start the conversation!</p>
                  </div>
                ) : (
                  threadReplies.map((reply, i) => {
                    const prevReply = threadReplies[i - 1];
                    const grouped = prevReply?.user === reply.user;
                    return (
                      <div key={reply.id} className="flex gap-2.5" style={{ marginTop: grouped ? 0 : 8 }}>
                        <div className="shrink-0 w-7 mt-0.5">
                          {!grouped && (
                            <AvatarDisplay
                              pic={reply.userId === myId ? (customPic || reply.imageUrl || null) : (reply.imageUrl || null)}
                              initial={reply.initials[0]} color={reply.color}
                              className="w-7 h-7 rounded-lg text-[11px]"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {!grouped && (
                            <div className="flex items-baseline gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-zinc-100">{reply.user}</span>
                              <span className="text-[10px] text-zinc-600">{reply.time}</span>
                            </div>
                          )}
                          <p className="text-sm text-zinc-300 leading-relaxed">{reply.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Reply input */}
              <div className="shrink-0 px-4 pb-4 pt-2 border-t border-zinc-800">
                <div className="rounded-xl border border-zinc-700 bg-zinc-950 focus-within:border-zinc-600 transition-colors">
                  <textarea
                    rows={2}
                    value={threadInput}
                    onChange={(e) => setThreadInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendThreadReply(); } }}
                    placeholder="Reply in thread…"
                    className="w-full resize-none bg-transparent px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none leading-relaxed"
                  />
                  <div className="flex justify-end px-3 pb-2">
                    <button
                      onClick={sendThreadReply}
                      disabled={!threadInput.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all"
                    >
                      <Send size={12} /> Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

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

      {/* Avatar DM popup */}
      {avatarPopup && (
        <div className="fixed inset-0 z-[55]" onClick={() => setAvatarPopup(null)}>
          <div
            className="absolute bg-zinc-900 border border-zinc-700 rounded-2xl p-4 w-52 shadow-2xl"
            style={{
              left: Math.min(avatarPopup.x, (typeof window !== "undefined" ? window.innerWidth : 800) - 220),
              top:  Math.min(avatarPopup.y, (typeof window !== "undefined" ? window.innerHeight : 600) - 220),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <AvatarDisplay
                pic={avatarPopup.user.imageUrl ?? null}
                initial={avatarPopup.user.initials[0]}
                color={avatarPopup.user.color}
                className="w-10 h-10 rounded-xl shrink-0"
              />
              <p className="text-sm font-bold text-zinc-100 truncate">{avatarPopup.user.name}</p>
            </div>
            <button
              onClick={() => { openDM(avatarPopup.user); setAvatarPopup(null); }}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-sm text-orange-300 hover:bg-orange-500/30 transition-all"
            >
              <MessageSquare size={14} />
              Send DM
            </button>

            {/* Mobile-only message actions */}
            <div className="sm:hidden mt-3 pt-3 border-t border-zinc-700/60 flex flex-col gap-1">
              <button
                onClick={() => { setThreadMsgId(avatarPopup.msgId); setAvatarPopup(null); setShowPinned(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800 transition-all"
              >
                <MessageSquare size={13} />
                Reply in thread
              </button>
              <button
                onClick={() => { togglePin(avatarPopup.msgId, avatarPopup.msgPinned); setAvatarPopup(null); }}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm hover:bg-zinc-800 transition-all ${
                  avatarPopup.msgPinned ? "text-orange-400" : "text-zinc-300"
                }`}
              >
                <Bookmark size={13} className={avatarPopup.msgPinned ? "fill-orange-400" : ""} />
                {avatarPopup.msgPinned ? "Unpin message" : "Pin message"}
              </button>
              <button
                onClick={() => { setReportMsgId(avatarPopup.msgId); setReportCategory("other"); setReportDesc(""); setReportStatus("idle"); setAvatarPopup(null); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-orange-400 hover:bg-zinc-800 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                Report
              </button>
            </div>
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

      {/* ── Report message modal ── */}
      {reportMsgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setReportMsgId(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-100">Report Message</h3>
              <button onClick={() => setReportMsgId(null)} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X size={16} /></button>
            </div>
            {reportStatus === "done" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="text-2xl">✅</span>
                <p className="text-sm text-zinc-300">Report submitted. Thank you.</p>
                <button onClick={() => setReportMsgId(null)} className="mt-2 px-4 py-1.5 rounded-xl bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 transition-all">Close</button>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Reason</p>
                <div className="flex flex-col gap-1.5 mb-4">
                  {[
                    { value: "sexual-content", label: "Sexual / inappropriate content" },
                    { value: "glitch",         label: "Glitch / spam" },
                    { value: "other",           label: "Other" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setReportCategory(opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs text-left transition-all border ${
                        reportCategory === opt.value
                          ? "border-orange-500/60 bg-orange-500/10 text-orange-300"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Details (optional)</p>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Describe the issue…"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 placeholder-zinc-600 resize-none outline-none focus:border-zinc-500 mb-4"
                />
                {reportStatus === "error" && <p className="text-xs text-red-400 mb-3">Something went wrong. Try again.</p>}
                <button
                  disabled={reportStatus === "loading"}
                  onClick={async () => {
                    setReportStatus("loading");
                    const msg = currentMessages.find((m) => m.id === reportMsgId);
                    const desc = reportDesc.trim() || `Message by ${msg?.user ?? "unknown"}: "${msg?.text?.slice(0, 200) ?? ""}"`;
                    try {
                      const res = await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: reportCategory, description: desc }) });
                      setReportStatus(res.ok ? "done" : "error");
                    } catch { setReportStatus("error"); }
                  }}
                  className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold transition-all"
                >
                  {reportStatus === "loading" ? "Submitting…" : "Submit Report"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
