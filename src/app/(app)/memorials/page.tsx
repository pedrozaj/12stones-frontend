"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PlayIcon, GridIcon, PlusIcon } from "@/components/icons";

// Mock data - would come from API
const MOCK_MEMORIALS = [
  { id: "1", title: "2024 - A Different Dream", year: "2024", type: "milestone", count: 12, coverUrl: null },
  { id: "2", title: "2023 - New Beginnings", year: "2023", type: "milestone", count: 8, coverUrl: null },
  { id: "3", title: "Christmas 2024", year: null, type: "family", count: 24, coverUrl: null },
  { id: "4", title: "Summer Vacation", year: null, type: "family", count: 45, coverUrl: null },
  { id: "5", title: "Wedding Day", year: "2020", type: "milestone", count: 56, coverUrl: null },
  { id: "6", title: "Baby's First Year", year: null, type: "family", count: 120, coverUrl: null },
];

function MemorialsContent() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type");
  const [filter, setFilter] = useState<string | null>(typeFilter);

  const filteredMemorials = filter
    ? MOCK_MEMORIALS.filter((m) => m.type === filter)
    : MOCK_MEMORIALS;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Memorials</h1>
        <Link
          href="/create"
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
        >
          <PlusIcon className="w-5 h-5" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <FilterTab
          label="All"
          active={filter === null}
          onClick={() => setFilter(null)}
        />
        <FilterTab
          label="Mile Stones"
          active={filter === "milestone"}
          onClick={() => setFilter("milestone")}
        />
        <FilterTab
          label="Family"
          active={filter === "family"}
          onClick={() => setFilter("family")}
        />
      </div>

      {/* Grid */}
      {filteredMemorials.length === 0 ? (
        <div className="text-center py-12">
          <GridIcon className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
          <p className="text-foreground-muted">No memorials yet</p>
          <Link
            href="/create"
            className="text-accent hover:text-accent-hover mt-2 inline-block"
          >
            Create your first memorial
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredMemorials.map((memorial) => (
            <MemorialGridCard key={memorial.id} memorial={memorial} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-input text-foreground-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function MemorialGridCard({
  memorial,
}: {
  memorial: {
    id: string;
    title: string;
    year: string | null;
    type: string;
    count: number;
    coverUrl: string | null;
  };
}) {
  return (
    <Link href={`/memorial/${memorial.id}`} className="group">
      <div className="relative aspect-[3/4] rounded-radius-xl overflow-hidden bg-input mb-2">
        {/* Placeholder gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <PlayIcon className="w-5 h-5 text-primary ml-0.5" />
          </div>
        </div>

        {/* Year badge */}
        {memorial.year && (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-radius-md bg-black/50 text-white text-xs font-medium">
            {memorial.year}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-radius-md bg-black/50 text-white text-xs capitalize">
          {memorial.type}
        </div>
      </div>
      <h3 className="font-medium text-foreground text-sm truncate">
        {memorial.title}
      </h3>
      <p className="text-xs text-foreground-muted">{memorial.count} memories</p>
    </Link>
  );
}

export default function MemorialsPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-6">Loading...</div>}>
      <MemorialsContent />
    </Suspense>
  );
}
