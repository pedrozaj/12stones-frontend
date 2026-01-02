"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PlayIcon, GridIcon, PlusIcon } from "@/components/icons";
import { api } from "@/lib/api";

interface Project {
  id: string;
  title: string;
  status: string;
  type?: string;
  content_count: number;
  thumbnail_url: string | null;
  current_video_id: string | null;
  created_at: string;
}

function MemorialsContent() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type");
  const [filter, setFilter] = useState<string | null>(typeFilter);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.get<Project[]>("/api/projects");
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = filter
    ? projects.filter((p) => p.type === filter)
    : projects;

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
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-radius-xl bg-input animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
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
          {filteredProjects.map((project) => (
            <MemorialGridCard key={project.id} project={project} />
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

function MemorialGridCard({ project }: { project: Project }) {
  const hasVideo = !!project.current_video_id;
  const year = new Date(project.created_at).getFullYear().toString();

  return (
    <Link href={`/project/${project.id}`} className="group">
      <div className="relative aspect-[3/4] rounded-radius-xl overflow-hidden bg-input mb-2">
        {/* Thumbnail or placeholder gradient */}
        {project.thumbnail_url ? (
          <img src={project.thumbnail_url} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
        )}

        {/* Play overlay for videos */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <PlayIcon className="w-5 h-5 text-primary ml-0.5" />
            </div>
          </div>
        )}

        {/* Year badge */}
        <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-radius-md text-white text-xs font-medium ${
          hasVideo ? "bg-green-500/80" : "bg-black/50"
        }`}>
          {hasVideo ? "✓ " : ""}{year}
        </div>

        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-radius-md text-white text-xs ${
          hasVideo ? "bg-green-500/80" : "bg-yellow-500/80"
        }`}>
          {hasVideo ? "Complete" : project.status === "draft" ? "Draft" : "Processing"}
        </div>
      </div>
      <h3 className="font-medium text-foreground text-sm truncate">
        {project.title}
      </h3>
      <p className="text-xs text-foreground-muted">{project.content_count} memories</p>
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
