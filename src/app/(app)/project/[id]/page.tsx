"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { api } from "@/lib/api";

interface ContentItem {
  id: string;
  type: "photo" | "video";
  thumbnail_url: string | null;
  r2_key: string;
  original_caption: string | null;
  taken_at: string | null;
  included_in_narrative: boolean;
}

interface Project {
  id: string;
  title: string;
  status: string;
  timeframe_start: string;
  timeframe_end: string;
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectData, contentData] = await Promise.all([
          api.get<Project>(`/api/projects/${id}`),
          api.get<ContentItem[]>(`/api/projects/${id}/content`),
        ]);
        setProject(projectData);
        setContent(contentData);
        // Pre-select all items
        setSelectedIds(new Set(contentData.map((item) => item.id)));
      } catch (err) {
        setError("Failed to load project");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const toggleSelection = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(content.map((item) => item.id)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const handleGenerateNarrative = async () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one item");
      return;
    }

    setIsGenerating(true);
    try {
      // Update which items are included
      await Promise.all(
        content.map((item) =>
          api.patch(`/api/projects/${id}/content/${item.id}`, {
            included_in_narrative: selectedIds.has(item.id),
          })
        )
      );

      // Trigger narrative generation
      await api.post(`/api/projects/${id}/narratives/regenerate`);

      // Redirect to voice setup or narrative review
      router.push(`/voice?project=${id}`);
    } catch (err) {
      console.error("Failed to generate narrative:", err);
      alert("Failed to generate narrative. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-input rounded w-1/3" />
          <div className="h-4 bg-input rounded w-1/2" />
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-input rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500">{error || "Project not found"}</p>
        <Link href="/dashboard" className="text-primary mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const photos = content.filter((item) => item.type === "photo");
  const videos = content.filter((item) => item.type === "video");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-foreground-muted hover:text-foreground mb-2 inline-flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
        <p className="text-foreground-muted mt-1">
          {content.length} items imported • Select the ones to include in your memorial
        </p>
      </div>

      {/* Selection controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground-muted">
            {selectedIds.size} of {content.length} selected
          </span>
          <button
            onClick={selectAll}
            className="text-sm text-primary hover:text-primary/80"
          >
            Select All
          </button>
          <button
            onClick={selectNone}
            className="text-sm text-primary hover:text-primary/80"
          >
            Select None
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {content.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-foreground-muted mb-4">No content imported yet</p>
          <Link href="/upload">
            <Button>Upload Content</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Photos */}
          {photos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                📷 Photos ({photos.length})
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onToggle={() => toggleSelection(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                🎬 Videos ({videos.length})
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {videos.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onToggle={() => toggleSelection(item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Button */}
      {content.length > 0 && (
        <div className="sticky bottom-20 bg-background/80 backdrop-blur py-4 -mx-4 px-4">
          <Button
            className="w-full"
            onClick={handleGenerateNarrative}
            disabled={selectedIds.size === 0 || isGenerating}
            isLoading={isGenerating}
          >
            {isGenerating ? (
              "Generating Narrative..."
            ) : (
              <>
                Continue with {selectedIds.size} items
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </Button>
          <p className="text-xs text-center text-foreground-muted mt-2">
            AI will analyze your content and create a personalized narrative
          </p>
        </div>
      )}
    </div>
  );
}

function ContentCard({
  item,
  isSelected,
  onToggle,
}: {
  item: ContentItem;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const thumbnailUrl = item.thumbnail_url || "/placeholder-image.jpg";

  return (
    <button
      onClick={onToggle}
      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-transparent hover:border-border"
      }`}
    >
      {/* Thumbnail */}
      <div className="absolute inset-0 bg-input">
        {item.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="text-2xl">🎬</span>
          </div>
        )}
        {item.type === "photo" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <span className="text-2xl">📷</span>
          </div>
        )}
      </div>

      {/* Selection indicator */}
      <div
        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
          isSelected ? "bg-primary text-white" : "bg-black/30 text-white"
        }`}
      >
        {isSelected ? (
          <CheckIcon className="w-4 h-4" />
        ) : (
          <span className="w-4 h-4 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Type badge */}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/50 text-white text-xs">
        {item.type === "video" ? "Video" : "Photo"}
      </div>
    </button>
  );
}
