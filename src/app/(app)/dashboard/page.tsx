"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui";
import { PlayIcon, ArrowRightIcon } from "@/components/icons";

// Mock data - would come from API in the future
const MOCK_MILESTONES = [
  { id: "1", year: "2024", title: "A Different Dream", coverUrl: "/placeholder.jpg", count: 12 },
  { id: "2", year: "2023", title: "New Beginnings", coverUrl: "/placeholder.jpg", count: 8 },
];

const MOCK_FAMILY = [
  { id: "1", title: "Christmas 2024", coverUrl: "/placeholder.jpg", count: 24 },
  { id: "2", title: "Summer Vacation", coverUrl: "/placeholder.jpg", count: 45 },
];

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

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

      {/* Mile "Stones" Section */}
      <section className="px-4 py-6">
        <SectionHeader title="Mile Stones" href="/memorials?type=milestones" />
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {MOCK_MILESTONES.map((milestone) => (
            <MemorialCard
              key={milestone.id}
              id={milestone.id}
              title={milestone.title}
              subtitle={milestone.year}
              coverUrl={milestone.coverUrl}
              count={milestone.count}
            />
          ))}
          <CreateCard type="milestone" />
        </div>
      </section>

      {/* Family Memorials Section */}
      <section className="px-4 py-6">
        <SectionHeader title="Family Memorials" href="/memorials?type=family" />
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {MOCK_FAMILY.map((item) => (
            <MemorialCard
              key={item.id}
              id={item.id}
              title={item.title}
              coverUrl={item.coverUrl}
              count={item.count}
            />
          ))}
          <CreateCard type="family" />
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
  count,
}: {
  id: string;
  title: string;
  subtitle?: string;
  coverUrl: string;
  count: number;
}) {
  return (
    <Link href={`/memorial/${id}`} className="flex-shrink-0 w-40 group">
      <div className="relative aspect-[3/4] rounded-radius-xl overflow-hidden bg-input mb-2">
        {/* Placeholder gradient for demo */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <PlayIcon className="w-5 h-5 text-primary ml-0.5" />
          </div>
        </div>

        {/* Year badge */}
        {subtitle && (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-radius-md bg-black/50 text-white text-xs font-medium">
            {subtitle}
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
