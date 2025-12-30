import Link from "next/link";
import { Button } from "@/components/ui";
import { PlayIcon, HeartIcon, MessageIcon, ArrowRightIcon } from "@/components/icons";

// This would come from API based on params.id
const MOCK_MEMORIAL = {
  id: "1",
  title: "2024 - A Different Dream",
  year: "2024",
  description: "A year of unexpected turns, new beginnings, and God's faithfulness through it all.",
  author: {
    name: "Kristin Pedroza",
    avatar: null,
  },
  stats: {
    views: 125,
    likes: 47,
    comments: 12,
  },
  memories: [
    { id: "1", title: "Planning 2nd Half", type: "video", coverUrl: null, likes: 20, comments: 3 },
    { id: "2", title: "Family Reunion", type: "video", coverUrl: null, likes: 35, comments: 8 },
    { id: "3", title: "Birthday Celebration", type: "video", coverUrl: null, likes: 28, comments: 5 },
  ],
};

export default async function MemorialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // In real app, fetch memorial data based on id
  const memorial = MOCK_MEMORIAL;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <section className="relative aspect-video bg-gradient-to-br from-primary/30 to-accent/30">
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="w-20 h-20 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors active:scale-95">
            <PlayIcon className="w-8 h-8 text-primary ml-1" />
          </button>
        </div>

        {/* Back button */}
        <Link
          href="/dashboard"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white hover:bg-black/40 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5m7-7l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </section>

      {/* Memorial Info */}
      <section className="px-4 py-6 border-b border-border">
        <div className="flex items-start gap-4">
          {/* Author avatar */}
          <div className="w-12 h-12 rounded-full bg-input flex items-center justify-center text-xl flex-shrink-0">
            👤
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">{memorial.title}</h1>
            <p className="text-sm text-foreground-muted mt-1">
              by {memorial.author.name}
            </p>
            <p className="text-sm text-foreground-muted mt-2">
              {memorial.description}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2 text-foreground-muted">
            <HeartIcon className="w-5 h-5" />
            <span className="text-sm">{memorial.stats.likes}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground-muted">
            <MessageIcon className="w-5 h-5" />
            <span className="text-sm">{memorial.stats.comments}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground-muted">
            <EyeIcon className="w-5 h-5" />
            <span className="text-sm">{memorial.stats.views} views</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button className="flex-1">
            <PlayIcon className="w-5 h-5" />
            Watch Memorial
          </Button>
          <Button variant="secondary">
            <ShareIcon className="w-5 h-5" />
            Share
          </Button>
        </div>
      </section>

      {/* Memories in this Memorial */}
      <section className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Memories ({memorial.memories.length})
          </h2>
          <button className="text-sm text-accent flex items-center gap-1 hover:text-accent-hover transition-colors">
            Edit
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {memorial.memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MemoryCard({
  memory,
}: {
  memory: {
    id: string;
    title: string;
    type: string;
    coverUrl: string | null;
    likes: number;
    comments: number;
  };
}) {
  return (
    <div className="flex gap-4 p-3 rounded-radius-xl bg-card border border-border hover:bg-input transition-colors">
      {/* Thumbnail */}
      <div className="w-24 h-24 rounded-radius-lg bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0 flex items-center justify-center">
        <PlayIcon className="w-8 h-8 text-foreground-muted" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        <h3 className="font-medium text-foreground truncate">{memory.title}</h3>
        <p className="text-sm text-foreground-muted capitalize mt-1">
          {memory.type}
        </p>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-sm text-foreground-muted">
            <HeartIcon className="w-4 h-4" />
            {memory.likes}
          </span>
          <span className="flex items-center gap-1 text-sm text-foreground-muted">
            <MessageIcon className="w-4 h-4" />
            {memory.comments}
          </span>
        </div>
      </div>
    </div>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
