"use client";

import { useState, useEffect, useRef, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { ArrowRightIcon, CheckIcon, XIcon, PlayIcon } from "@/components/icons";
import { api } from "@/lib/api";

interface ContentItem {
  id: string;
  type: "photo" | "video";
  thumbnail_url: string | null;
  original_url: string | null;
  original_caption: string | null;
  taken_at: string | null;
  included_in_narrative: boolean;
}

interface Narrative {
  id: string;
  script: string;
  status: string;
  word_count: number | null;
  estimated_duration: number | null;
}

interface VoiceProfile {
  id: string;
  name: string;
  status: string;
}

interface VideoRender {
  id: string;
  status: "queued" | "rendering" | "completed" | "failed";
  render_progress: number;
  download_url: string | null;
  error_message: string | null;
}

interface Project {
  id: string;
  title: string;
  status: string;
  timeframe_start: string;
  timeframe_end: string;
  voice_profile_id: string | null;
  current_narrative_id: string | null;
}

function ProjectPageContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceContentView = searchParams.get("selectContent") === "true";
  const [project, setProject] = useState<Project | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [videoRender, setVideoRender] = useState<VideoRender | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [view, setView] = useState<"content" | "review">("content");
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [redirectToVoice, setRedirectToVoice] = useState(false);
  const isMountedRef = useRef(true);
  const isNavigatingRef = useRef(false);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safari-friendly redirect: use useEffect to trigger navigation
  // This works because useEffect runs outside the async context
  useEffect(() => {
    if (redirectToVoice) {
      console.log("[Narrative] useEffect redirect triggered, navigating...");
      const voiceUrl = `/voice?project=${id}`;
      // Use router.push - should work in Safari from useEffect
      router.push(voiceUrl);
    }
  }, [redirectToVoice, id, router]);

  useEffect(() => {
    // Only fetch data once on mount
    if (hasFetchedOnce) return;

    const fetchData = async () => {
      setIsLoading(true);

      try {
        const [projectData, contentData] = await Promise.all([
          api.get<Project>(`/api/projects/${id}`),
          api.get<ContentItem[]>(`/api/projects/${id}/content`),
        ]);
        setProject(projectData);
        setContent(contentData);
        // Pre-select all items
        setSelectedIds(new Set(contentData.map((item) => item.id)));

        // If project has a narrative, fetch it and show review view
        // (unless user explicitly wants to select content via ?selectContent=true)
        if (projectData.current_narrative_id) {
          try {
            const narratives = await api.get<Narrative[]>(`/api/projects/${id}/narratives`);
            if (narratives.length > 0) {
              setNarrative(narratives[0]);
              if (!forceContentView) {
                setView("review");
              }
            }
          } catch (err) {
            console.error("Failed to fetch narrative:", err);
          }
        }

        // If project has a voice profile, fetch it
        if (projectData.voice_profile_id) {
          try {
            const profile = await api.get<VoiceProfile>(`/api/voice/profiles/${projectData.voice_profile_id}`);
            setVoiceProfile(profile);
          } catch (err) {
            console.error("Failed to fetch voice profile:", err);
          }
        }

        // Fetch any existing video renders to show completed videos
        try {
          const videos = await api.get<VideoRender[]>(`/api/projects/${id}/videos`);
          if (videos.length > 0) {
            // Get the most recent video
            const latestVideo = videos[0];
            setVideoRender(latestVideo);
            // If video is still rendering, resume polling
            if (latestVideo.status === "queued" || latestVideo.status === "rendering") {
              setIsRendering(true);
              pollVideoStatus(latestVideo.id);
            }
          }
        } catch (err) {
          console.error("Failed to fetch videos:", err);
        }
      } catch (err) {
        setError("Failed to load project");
        console.error(err);
      } finally {
        setIsLoading(false);
        setHasFetchedOnce(true);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, forceContentView]);

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

    // Prevent double-submission
    if (isGenerating || isNavigatingRef.current) {
      console.log("[Narrative] Already in progress, skipping");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log("[Narrative] Starting generation with", selectedIds.size, "items");

      // Update which items are included
      console.log("[Narrative] Updating content item inclusion...");
      const updatePromises = content.map((item) =>
        api.patch(`/api/projects/${id}/content/${item.id}`, {
          included_in_narrative: selectedIds.has(item.id),
        })
      );

      await Promise.all(updatePromises);
      console.log("[Narrative] Content items updated");

      // Check if still mounted
      if (!isMountedRef.current) {
        console.log("[Narrative] Component unmounted, aborting");
        return;
      }

      // Trigger narrative generation
      console.log("[Narrative] Calling narrative regenerate API...");
      const narrativeResult = await api.post<Narrative>(`/api/projects/${id}/narratives/regenerate`);
      console.log("[Narrative] API response:", narrativeResult);

      // Validate that we got a narrative back
      if (!narrativeResult || !narrativeResult.id) {
        throw new Error("No narrative returned from API");
      }

      // Fetch updated project to confirm narrative was set
      const updatedProject = await api.get<Project>(`/api/projects/${id}`);
      console.log("[Narrative] Updated project:", updatedProject);

      if (!updatedProject.current_narrative_id) {
        console.warn("[Narrative] Project doesn't have narrative ID set, but we got one:", narrativeResult.id);
      }

      // Check if still mounted before updating state
      if (!isMountedRef.current) {
        console.log("[Narrative] Component unmounted before state update, aborting");
        return;
      }

      // Update local state with the narrative and project data
      setNarrative(narrativeResult);
      setProject(updatedProject);

      // Show success message
      setSuccessMessage("Narrative created! Redirecting to voice selection...");
      setIsGenerating(false);

      console.log("[Narrative] Narrative generated successfully. Setting redirect state...");

      // Mark that we're navigating to prevent further state updates
      isNavigatingRef.current = true;

      // Trigger redirect via state change - useEffect will handle the actual navigation
      // This is Safari-friendly because the navigation happens outside the async context
      setRedirectToVoice(true);
    } catch (err) {
      console.error("[Narrative] FAILED:", err);
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to generate narrative: ${errorMessage}`);
        alert(`Failed to generate narrative: ${errorMessage}`);
        setIsGenerating(false);
        isNavigatingRef.current = false;
      }
    }
    // Note: Don't reset isGenerating on success since we're navigating away
  };

  const handleRenderVideo = async () => {
    if (!narrative || !voiceProfile) return;

    setIsRendering(true);
    try {
      const video = await api.post<VideoRender>(`/api/projects/${id}/videos/render`, {
        narrative_id: narrative.id,
        voice_profile_id: voiceProfile.id,
        resolution: "1080p",
      });
      setVideoRender(video);
      // Start polling for status
      pollVideoStatus(video.id);
    } catch (err) {
      console.error("Failed to start video render:", err);
      alert("Failed to start video render. Please try again.");
      setIsRendering(false);
    }
  };

  const pollVideoStatus = async (videoId: string) => {
    const poll = async () => {
      try {
        const video = await api.get<VideoRender>(`/api/projects/${id}/videos/${videoId}`);
        setVideoRender(video);

        if (video.status === "completed") {
          setIsRendering(false);
          // Video is ready!
        } else if (video.status === "failed") {
          setIsRendering(false);
          alert(`Video rendering failed: ${video.error_message || "Unknown error"}`);
        } else {
          // Still rendering, poll again in 3 seconds
          setTimeout(poll, 3000);
        }
      } catch (err) {
        console.error("Failed to poll video status:", err);
        setIsRendering(false);
      }
    };
    poll();
  };

  const handleRegenerateNarrative = async () => {
    setIsGenerating(true);
    try {
      await api.post(`/api/projects/${id}/narratives/regenerate`);
      // Refresh narrative
      const narratives = await api.get<Narrative[]>(`/api/projects/${id}/narratives`);
      if (narratives.length > 0) {
        setNarrative(narratives[0]);
      }
    } catch (err) {
      console.error("Failed to regenerate narrative:", err);
      alert("Failed to regenerate narrative. Please try again.");
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

  // Show narrative review view
  if (view === "review" && narrative) {
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
            Review your narrative before generating the video
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              <CheckIcon className="w-4 h-4" />
            </div>
            <span className="text-sm text-foreground">Content</span>
          </div>
          <div className="flex-1 h-0.5 bg-primary" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              <CheckIcon className="w-4 h-4" />
            </div>
            <span className="text-sm text-foreground">Voice</span>
          </div>
          <div className="flex-1 h-0.5 bg-primary" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="text-sm font-medium text-foreground">Review</span>
          </div>
        </div>

        {/* Voice Profile Card */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MicIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Narration Voice</p>
                <p className="font-medium text-foreground">
                  {voiceProfile?.name || "No voice selected"}
                </p>
              </div>
            </div>
            <Link
              href={`/voice?project=${id}`}
              className="text-sm text-primary hover:text-primary/80"
            >
              Change
            </Link>
          </div>
        </Card>

        {/* Narrative Preview */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Your Narrative</h2>
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              {narrative.word_count && <span>{narrative.word_count} words</span>}
              {narrative.estimated_duration && (
                <span>• ~{Math.ceil(narrative.estimated_duration / 60)} min</span>
              )}
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {narrative.script}
            </p>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => setView("content")}
          >
            Edit Content
          </Button>
          <Button
            variant="outline"
            onClick={handleRegenerateNarrative}
            disabled={isGenerating}
            isLoading={isGenerating}
          >
            Regenerate Narrative
          </Button>
        </div>

        {/* Video Render Progress or Generate Button */}
        <div className="sticky bottom-20 bg-background/80 backdrop-blur py-4 -mx-4 px-4">
          {videoRender?.status === "completed" && videoRender.download_url ? (
            // Video completed - show download/preview and next steps
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Your Memorial is Ready!</p>
                    <p className="text-sm text-foreground-muted">
                      Download and share your video with loved ones
                    </p>
                  </div>
                </div>
                <video
                  src={videoRender.download_url}
                  controls
                  className="w-full rounded-lg"
                  poster="/video-poster.jpg"
                />
              </Card>

              {/* Primary action - Download */}
              <a
                href={videoRender.download_url}
                download={`${project?.title || 'memorial'}.mp4`}
                className="block"
              >
                <Button className="w-full">
                  Download Video
                </Button>
              </a>

              {/* Secondary actions */}
              <div className="flex gap-3">
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to Dashboard
                  </Button>
                </Link>
                <Link href="/create" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Create Another
                  </Button>
                </Link>
              </div>

              {/* Success message */}
              <p className="text-xs text-center text-foreground-muted">
                Your memorial has been saved to your collection
              </p>
            </div>
          ) : isRendering && videoRender ? (
            // Rendering in progress - show progress
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <LoaderIcon className="w-5 h-5 text-primary animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {getProgressStage(videoRender.render_progress)}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    {videoRender.render_progress}% complete
                  </p>
                </div>
              </div>
              <div className="w-full bg-input rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${videoRender.render_progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-foreground-muted mt-3">
                Please keep this page open while your video renders
              </p>
            </Card>
          ) : videoRender?.status === "failed" ? (
            // Video render failed - show error and retry button
            <div className="space-y-3">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XIcon className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Video Generation Failed</p>
                    <p className="text-sm text-foreground-muted">
                      {videoRender.error_message || "An error occurred during video generation"}
                    </p>
                  </div>
                </div>
              </Card>
              <Button
                className="w-full"
                onClick={handleRenderVideo}
                disabled={!voiceProfile}
              >
                Try Again
              </Button>
            </div>
          ) : (
            // Ready to generate
            <>
              <Button
                className="w-full"
                onClick={handleRenderVideo}
                disabled={!voiceProfile || isRendering}
                isLoading={isRendering}
              >
                {isRendering ? (
                  "Starting Video Render..."
                ) : !voiceProfile ? (
                  "Select a voice to continue"
                ) : (
                  <>
                    Generate Video
                    <PlayIcon className="w-4 h-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-foreground-muted mt-2">
                Video rendering typically takes 5-10 minutes
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Content selection view (default)
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
                    onPreview={() => setPreviewItem(item)}
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
                    onPreview={() => setPreviewItem(item)}
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
          {successMessage ? (
            <Card className="p-4 text-center bg-green-500/10 border-green-500/20">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="font-medium text-green-700 dark:text-green-400">{successMessage}</p>
                </div>
                <Link
                  href={`/voice?project=${id}`}
                  className="text-sm text-primary underline hover:text-primary/80"
                >
                  Click here if not redirected automatically
                </Link>
              </div>
            </Card>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={() => setPreviewItem(null)}
          >
            <XIcon className="w-8 h-8" />
          </button>

          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {previewItem.type === "photo" ? (
              previewItem.original_url ? (
                <img
                  src={previewItem.original_url}
                  alt={previewItem.original_caption || "Photo"}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Image not available</span>
                </div>
              )
            ) : previewItem.original_url ? (
              <video
                src={previewItem.original_url}
                controls
                autoPlay
                className="w-full max-h-[80vh] rounded-lg"
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Video not available</span>
              </div>
            )}

            {previewItem.original_caption && (
              <p className="text-white text-center mt-4 px-4">
                {previewItem.original_caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentCard({
  item,
  isSelected,
  onToggle,
  onPreview,
}: {
  item: ContentItem;
  isSelected: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const thumbnailUrl = item.thumbnail_url || item.original_url;
  const [imageError, setImageError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // If clicking the selection checkbox area, toggle selection
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const isCheckboxArea = clickX > rect.width - 40 && clickY < 40;

    if (isCheckboxArea) {
      onToggle();
    } else {
      onPreview();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-transparent hover:border-border"
      }`}
    >
      {/* Thumbnail */}
      <div className="absolute inset-0 bg-input">
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={item.original_caption || "Content"}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <span className="text-2xl">{item.type === "video" ? "🎬" : "📷"}</span>
          </div>
        )}
        {/* Video overlay */}
        {item.type === "video" && thumbnailUrl && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
              <span className="text-white text-xl ml-1">▶</span>
            </div>
          </div>
        )}
      </div>

      {/* Selection checkbox */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
          isSelected ? "bg-primary text-white" : "bg-black/50 text-white hover:bg-black/70"
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

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function getProgressStage(progress: number): string {
  if (progress < 5) return "Preparing...";
  if (progress < 30) return "Generating narration audio...";
  if (progress < 40) return "Downloading your photos...";
  if (progress < 85) return "Creating video...";
  if (progress < 100) return "Uploading video...";
  return "Complete!";
}

// Loading component for Suspense
function ProjectPageLoading() {
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

// Main export with Suspense boundary for useSearchParams
export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense fallback={<ProjectPageLoading />}>
      <ProjectPageContent id={id} />
    </Suspense>
  );
}
