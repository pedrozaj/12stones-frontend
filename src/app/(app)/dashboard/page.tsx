"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui";
import { PlayIcon, ArrowRightIcon } from "@/components/icons";
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

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.get<Project[]>("/api/projects");
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Filter projects by type (for now, show all as milestones if no type)
  const completedProjects = projects.filter(p => p.current_video_id);
  const draftProjects = projects.filter(p => !p.current_video_id);

  const userName = user?.name?.split(" ")[0] || "Guest";

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-20 w-20 rounded-full bg-input" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <section className="px-4 py-8 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-input flex items-center justify-center text-3xl">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={userName} className="w-full h-full rounded-full object-cover" />
            ) : (
              "👤"
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {userName}&apos;s Memorials
            </h1>
            <p className="text-sm text-foreground-muted italic mt-1 line-clamp-2">
              &quot;In the future when your descendants ask their parents, &apos;What do these stones mean?&apos; Tell them...&quot;
            </p>
            <p className="text-xs text-accent mt-1">— Joshua 4:21-22</p>
          </div>
        </div>
      </section>

      {/* Completed Memorials Section */}
      {completedProjects.length > 0 && (
        <section className="px-4 py-6">
          <SectionHeader title="Completed Memorials" href="/memorials" />
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {completedProjects.map((project) => (
              <MemorialCard
                key={project.id}
                id={project.id}
                title={project.title}
                subtitle={new Date(project.created_at).getFullYear().toString()}
                thumbnailUrl={project.thumbnail_url}
                count={project.content_count}
                hasVideo={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Draft Projects Section */}
      <section className="px-4 py-6">
        <SectionHeader title="In Progress" href="/memorials" />
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {isLoadingProjects ? (
            <div className="flex gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="w-40 aspect-[3/4] rounded-radius-xl bg-input animate-pulse" />
              ))}
            </div>
          ) : draftProjects.length > 0 ? (
            draftProjects.map((project) => (
              <MemorialCard
                key={project.id}
                id={project.id}
                title={project.title}
                subtitle={project.status === "draft" ? "Draft" : "Processing"}
                thumbnailUrl={project.thumbnail_url}
                count={project.content_count}
                hasVideo={false}
              />
            ))
          ) : null}
          <CreateCard type="milestone" />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 py-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            title="Import from Social"
            description="Connect Instagram, Facebook, or TikTok"
            icon="📱"
            href="/connections"
          />
          <QuickActionCard
            title="Upload Photos"
            description="Add photos from your device"
            icon="📷"
            href="/upload"
          />
          <QuickActionCard
            title="Clone Your Voice"
            description="Create your AI voice profile"
            icon="🎙️"
            href="/voice"
          />
          <QuickActionCard
            title="Create Memorial"
            description="Start a new video memorial"
            icon="🎬"
            href="/create"
          />
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <Link
        href={href}
        className="text-sm text-accent flex items-center gap-1 hover:text-accent-hover transition-colors"
      >
        See all
        <ArrowRightIcon className="w-4 h-4" />
      </Link>
    </div>
  );
}

function MemorialCard({
  id,
  title,
  subtitle,
  thumbnailUrl,
  count,
  hasVideo,
}: {
  id: string;
  title: string;
  subtitle?: string;
  thumbnailUrl: string | null;
  count: number;
  hasVideo: boolean;
}) {
  return (
    <Link href={`/project/${id}`} className="flex-shrink-0 w-40 group">
      <div className="relative aspect-[3/4] rounded-radius-xl overflow-hidden bg-input mb-2">
        {/* Thumbnail or placeholder gradient */}
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
        )}

        {/* Play button overlay for completed videos */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <PlayIcon className="w-5 h-5 text-primary ml-0.5" />
            </div>
          </div>
        )}

        {/* Status/year badge */}
        {subtitle && (
          <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-radius-md text-white text-xs font-medium ${
            hasVideo ? "bg-green-500/80" : "bg-black/50"
          }`}>
            {hasVideo ? "✓ " : ""}{subtitle}
          </div>
        )}
      </div>
      <h3 className="font-medium text-foreground text-sm truncate">{title}</h3>
      <p className="text-xs text-foreground-muted">{count} memories</p>
    </Link>
  );
}

function CreateCard({ type }: { type: string }) {
  return (
    <Link
      href={`/create?type=${type}`}
      className="flex-shrink-0 w-40 aspect-[3/4] rounded-radius-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-foreground-muted hover:border-primary hover:text-primary transition-colors"
    >
      <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center">
        <span className="text-xl">+</span>
      </div>
      <span className="text-sm">Create New</span>
    </Link>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-4 hover:bg-input transition-colors h-full">
        <span className="text-2xl mb-2 block">{icon}</span>
        <h3 className="font-medium text-foreground text-sm">{title}</h3>
        <p className="text-xs text-foreground-muted mt-1">{description}</p>
      </Card>
    </Link>
  );
}
