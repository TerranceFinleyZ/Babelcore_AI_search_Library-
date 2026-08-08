"use client";

import { useState } from "react";
import { Briefcase, X, MapPin, Clock, ChevronRight } from "lucide-react";

type Job = {
  id: string;
  title: string;
  type: string;
  location: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
};

const JOBS: Job[] = [
  {
    id: "admin",
    title: "Administrator",
    type: "Full-Time",
    location: "Remote",
    description:
      "Keep Babelcore running smoothly. You'll manage internal operations, coordinate between teams, and ensure day-to-day tasks are executed with excellence.",
    responsibilities: [
      "Oversee internal operations and scheduling",
      "Coordinate cross-team communication and workflows",
      "Maintain records, documentation, and onboarding materials",
      "Support leadership with reporting and organizational tasks",
    ],
    requirements: [
      "Strong organizational and communication skills",
      "Experience with productivity tools (Notion, Google Workspace, etc.)",
      "Ability to manage multiple tasks and deadlines independently",
      "Professional, detail-oriented mindset",
    ],
  },
  {
    id: "developer",
    title: "Developer",
    type: "Full-Time",
    location: "Remote",
    description:
      "Build and improve the Babelcore platform. You'll work across the stack to deliver clean, performant features that serve our growing community.",
    responsibilities: [
      "Design and implement new features across the full stack",
      "Maintain and improve existing codebase (Next.js, TypeScript, Tailwind)",
      "Collaborate with design and product on UI/UX",
      "Write clean, secure, and well-tested code",
    ],
    requirements: [
      "Proficiency in React, Next.js, and TypeScript",
      "Experience with REST APIs and database management",
      "Strong understanding of web performance and security basics",
      "Passion for building polished, user-focused products",
    ],
  },
  {
    id: "marketing",
    title: "Marketing Agent",
    type: "Part-Time / Contract",
    location: "Remote",
    description:
      "Grow the Babelcore brand. You'll craft campaigns, manage social presence, and connect with our audience across platforms to drive awareness and engagement.",
    responsibilities: [
      "Develop and execute marketing campaigns across social platforms",
      "Write compelling copy for announcements, ads, and newsletters",
      "Analyze engagement metrics and optimize strategy",
      "Identify partnership and growth opportunities",
    ],
    requirements: [
      "Proven experience in digital marketing or brand management",
      "Strong writing and creative storytelling skills",
      "Familiarity with social media analytics tools",
      "Self-starter with an entrepreneurial approach",
    ],
  },
  {
    id: "moderator",
    title: "Content Moderator",
    type: "Part-Time",
    location: "Remote",
    description:
      "Protect and cultivate the Babelcore community. You'll review user-generated content, enforce community guidelines, and ensure a safe, respectful environment.",
    responsibilities: [
      "Review and moderate user-submitted content in a timely manner",
      "Enforce community guidelines with consistency and fairness",
      "Flag and escalate policy violations to senior staff",
      "Provide feedback to improve moderation processes",
    ],
    requirements: [
      "Strong judgment and attention to detail",
      "Ability to handle sensitive content professionally",
      "Clear written communication skills",
      "Reliable, consistent availability for assigned shifts",
    ],
  },
];

export default function CareersPanel() {
  const [selected, setSelected] = useState<Job | null>(null);
  const [applied, setApplied] = useState<string[]>([]);

  const handleApply = (id: string) => {
    setApplied((prev) => [...prev, id]);
    setTimeout(() => setSelected(null), 800);
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <Briefcase size={18} className="text-orange-400" />
          Careers at Babelcore
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          We&apos;re building something meaningful. Join the team.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {JOBS.map((job) => (
          <button
            key={job.id}
            onClick={() => setSelected(job)}
            className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-4 text-left hover:border-orange-500/30 hover:bg-zinc-900 transition-all group"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                  {job.title}
                </span>
                {applied.includes(job.id) && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Applied
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {job.type}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {job.location}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{job.description}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-zinc-700 group-hover:text-orange-400 transition-colors" />
          </button>
        ))}
      </div>

      {/* Job detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 text-zinc-600 hover:text-zinc-300 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="mb-5">
              <h3 className="text-lg font-bold text-zinc-100">{selected.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><Clock size={11} />{selected.type}</span>
                <span className="flex items-center gap-1"><MapPin size={11} />{selected.location}</span>
              </div>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{selected.description}</p>
            </div>

            {/* Responsibilities */}
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-500 mb-2">
                Responsibilities
              </p>
              <ul className="flex flex-col gap-1.5">
                {selected.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-500 mb-2">
                Requirements
              </p>
              <ul className="flex flex-col gap-1.5">
                {selected.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleApply(selected.id)}
              disabled={applied.includes(selected.id)}
              className="w-full rounded-2xl bg-orange-500/20 border border-orange-500/30 py-2.5 text-sm font-semibold text-orange-300 hover:bg-orange-500/30 transition-all disabled:opacity-60 disabled:cursor-default"
            >
              {applied.includes(selected.id) ? "Application Sent ✓" : "Apply for this Role"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
