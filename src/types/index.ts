/**
 * Core types for 12 Stones frontend.
 */

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  timeframeStart?: string;
  timeframeEnd?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = "draft" | "processing" | "completed" | "archived";

// Content types
export interface Content {
  id: string;
  projectId: string;
  type: ContentType;
  platform: SocialPlatform;
  originalUrl?: string;
  r2Key?: string;
  thumbnailR2Key?: string;
  caption?: string;
  metadata?: Record<string, unknown>;
  capturedAt?: string;
  analyzedAt?: string;
  createdAt: string;
}

export type ContentType = "image" | "video" | "text";
export type SocialPlatform = "instagram" | "facebook" | "tiktok";

// Voice types
export interface VoiceProfile {
  id: string;
  name: string;
  status: VoiceProfileStatus;
  sampleUrls: string[];
  sampleDurationSeconds?: number;
  createdAt: string;
}

export type VoiceProfileStatus = "processing" | "ready" | "failed";

// Narrative types
export interface Narrative {
  id: string;
  projectId: string;
  version: number;
  status: NarrativeStatus;
  scriptText: string;
  scenes: Scene[];
  wordCount?: number;
  estimatedDurationSeconds?: number;
  createdAt: string;
}

export type NarrativeStatus = "generating" | "review" | "approved" | "rejected";

export interface Scene {
  id: string;
  order: number;
  text: string;
  contentIds: string[];
  durationSeconds: number;
  transition: string;
}

// Video types
export interface Video {
  id: string;
  projectId: string;
  narrativeId: string;
  status: VideoStatus;
  resolution: VideoResolution;
  durationSeconds?: number;
  fileSizeBytes?: number;
  renderProgress: number;
  createdAt: string;
}

export type VideoStatus = "queued" | "rendering" | "completed" | "failed";
export type VideoResolution = "720p" | "1080p" | "4k";

// Job types
export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  result?: Record<string, unknown>;
  errorMessage?: string;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletionAt?: string;
}

export type JobType =
  | "content:import"
  | "content:analyze"
  | "voice:clone"
  | "narrative:generate"
  | "audio:synthesize"
  | "video:render";

export type JobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

// Social connection types
export interface SocialConnection {
  id: string;
  platform: SocialPlatform;
  username?: string;
  lastSyncAt?: string;
  createdAt: string;
}

// API response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}
