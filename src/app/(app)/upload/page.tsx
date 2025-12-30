"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { CheckIcon, ArrowRightIcon } from "@/components/icons";
import { api } from "@/lib/api";

interface Project {
  id: string;
  title: string;
  status: string;
}

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
}

interface InstagramImportResult {
  success: boolean;
  imported_count: number;
  imported_items: Array<{
    filename: string;
    type: string;
    caption: string | null;
  }>;
  errors: string[];
  message: string;
}

type TabType = "device" | "instagram";

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<TabType>("device");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Instagram import state
  const [instagramFile, setInstagramFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<InstagramImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const instagramInputRef = useRef<HTMLInputElement>(null);

  // Project selection state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.get<Project[]>("/api/projects");
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    setIsCreatingProject(true);
    try {
      const newProject = await api.post<Project>("/api/projects", {
        title: "Instagram Import",
        timeframe_start: new Date().toISOString().split("T")[0],
        timeframe_end: new Date().toISOString().split("T")[0],
      });
      setProjects((prev) => [newProject, ...prev]);
      setSelectedProjectId(newProject.id);
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = [];

    Array.from(fileList).forEach((file) => {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const id = Math.random().toString(36).substring(7);
        const preview = URL.createObjectURL(file);
        const type = file.type.startsWith("image/") ? "image" : "video";
        newFiles.push({ id, file, preview, type });
      }
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // In a real implementation, this would upload to the backend/R2
      const formData = new FormData();
      files.forEach((f, i) => {
        formData.append(`file_${i}`, f.file);
      });

      // TODO: Implement actual upload to backend
      // const response = await fetch('/api/content/upload', {
      //   method: 'POST',
      //   body: formData,
      // });

      // Simulate upload time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert(`Successfully uploaded ${files.length} files!`);
      setFiles([]);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInstagramImport = async () => {
    if (!instagramFile || !selectedProjectId) return;

    setIsImporting(true);
    setUploadProgress(0);
    setImportError(null);
    setImportResult(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const token = localStorage.getItem("access_token");

    try {
      // Step 1: Get presigned URL for direct R2 upload
      const urlResponse = await fetch(
        `${API_URL}/api/import/instagram/upload-url?filename=${encodeURIComponent(instagramFile.name)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to get upload URL");
      }

      const { upload_url, key } = await urlResponse.json();

      // Step 2: Upload directly to R2 with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            // Upload is 0-90%, processing is 90-100%
            const progress = Math.round((event.loaded / event.total) * 90);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(90);
            resolve();
          } else {
            reject(new Error(`Upload to storage failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed - CORS may not be configured. See docs for R2 CORS setup."));
        });

        xhr.addEventListener("timeout", () => {
          reject(new Error("Upload timed out - file may be too large"));
        });

        xhr.open("PUT", upload_url);
        xhr.timeout = 600000; // 10 minute timeout
        xhr.setRequestHeader("Content-Type", "application/zip");
        xhr.send(instagramFile);
      });

      // Step 3: Process the uploaded file
      setUploadProgress(95);
      const processResponse = await fetch(
        `${API_URL}/api/import/instagram/process?project_id=${selectedProjectId}&r2_key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!processResponse.ok) {
        const errorData = await processResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to process import");
      }

      const result: InstagramImportResult = await processResponse.json();
      setUploadProgress(100);
      setImportResult(result);
      setInstagramFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to import Instagram data";
      setImportError(message);
    } finally {
      setIsImporting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Upload Photos & Videos
        </h1>
        <p className="text-foreground-muted">
          Add photos and videos from your device or import from Instagram.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("device")}
          className={`flex-1 py-3 px-4 rounded-radius-lg font-medium transition-colors ${
            activeTab === "device"
              ? "bg-primary text-primary-foreground"
              : "bg-input text-foreground-muted hover:bg-input/80"
          }`}
        >
          From Device
        </button>
        <button
          onClick={() => setActiveTab("instagram")}
          className={`flex-1 py-3 px-4 rounded-radius-lg font-medium transition-colors ${
            activeTab === "instagram"
              ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
              : "bg-input text-foreground-muted hover:bg-input/80"
          }`}
        >
          From Instagram
        </button>
      </div>

      {activeTab === "device" && (
        <>
        {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-radius-xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div className="w-16 h-16 rounded-full bg-input flex items-center justify-center mx-auto mb-4">
          <UploadIcon className="w-8 h-8 text-foreground-muted" />
        </div>

        <p className="font-medium text-foreground mb-1">
          Drag & drop files here
        </p>
        <p className="text-sm text-foreground-muted mb-4">
          or click to browse your device
        </p>
        <p className="text-xs text-foreground-muted">
          Supports JPG, PNG, GIF, MP4, MOV (max 100MB per file)
        </p>
      </div>

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Selected Files ({files.length})
            </h2>
            <button
              onClick={() => setFiles([])}
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="relative aspect-square rounded-radius-lg overflow-hidden bg-input group"
              >
                {file.type === "image" ? (
                  <img
                    src={file.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={file.preview}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Type badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/50 text-white text-xs">
                  {file.type === "video" ? "🎬" : "📷"}
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <Button
            className="w-full mt-6"
            onClick={handleUpload}
            isLoading={isUploading}
            disabled={isUploading}
          >
            Upload {files.length} {files.length === 1 ? "File" : "Files"}
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Tips */}
      <Card className="mt-8 p-4 bg-primary/5 border-primary/20">
        <h3 className="font-medium text-foreground mb-2">Tips for best results</h3>
        <ul className="text-sm text-foreground-muted space-y-1">
          <li>• Use high-quality photos and videos</li>
          <li>• Include a variety of moments and emotions</li>
          <li>• Videos work best when 15-60 seconds long</li>
          <li>• Vertical videos are great for mobile viewing</li>
        </ul>
      </Card>
        </>
      )}

      {activeTab === "instagram" && (
        <>
          {/* Project Selector */}
          <Card className="mb-6 p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Import to Project
            </label>
            {isLoadingProjects ? (
              <div className="text-sm text-foreground-muted">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-foreground-muted">No projects yet.</span>
                <Button
                  size="sm"
                  onClick={handleCreateProject}
                  isLoading={isCreatingProject}
                  disabled={isCreatingProject}
                >
                  Create Project
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-radius-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateProject}
                  isLoading={isCreatingProject}
                  disabled={isCreatingProject}
                >
                  New
                </Button>
              </div>
            )}
          </Card>

          {/* Instagram Import Zone */}
          <div
            className="relative border-2 border-dashed rounded-radius-xl p-8 text-center cursor-pointer transition-colors border-pink-300 hover:border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50"
          >
            <input
              ref={instagramInputRef}
              type="file"
              accept=".zip"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setInstagramFile(file);
                  setImportResult(null);
                  setImportError(null);
                }
              }}
            />

            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📸</span>
            </div>

            <p className="font-medium text-foreground mb-1">
              {instagramFile ? instagramFile.name : "Upload Instagram Data Export"}
            </p>
            <p className="text-sm text-foreground-muted mb-4">
              {instagramFile
                ? `${(instagramFile.size / 1024 / 1024).toFixed(1)} MB`
                : "Click to select your Instagram ZIP file"}
            </p>
            <p className="text-xs text-foreground-muted">
              Accepts ZIP files from Instagram&apos;s &quot;Download Your Information&quot; feature
            </p>
          </div>

          {/* Import Button */}
          {instagramFile && (
            <div className="mt-6">
              {isImporting && uploadProgress > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-foreground-muted mb-1">
                    <span>
                      {uploadProgress < 90
                        ? "Uploading to cloud..."
                        : uploadProgress < 100
                          ? "Processing your photos..."
                          : "Complete!"}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        uploadProgress >= 100
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
                          : "bg-gradient-to-r from-pink-500 to-purple-500"
                      }`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                onClick={handleInstagramImport}
                isLoading={isImporting}
                disabled={isImporting || !selectedProjectId}
              >
                {!selectedProjectId
                  ? "Select a project first"
                  : isImporting
                    ? "Processing..."
                    : "Upload & Import"}
                {!isImporting && <ArrowRightIcon className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {/* Import Error */}
          {importError && (
            <Card className="mt-6 p-4 bg-red-500/10 border-red-500/20">
              <p className="text-red-600 text-sm">{importError}</p>
            </Card>
          )}

          {/* Import Success */}
          {importResult && (
            <Card className="mt-6 p-4 bg-green-500/10 border-green-500/20">
              <div className="flex items-center gap-3 mb-3">
                <CheckIcon className="w-5 h-5 text-green-500" />
                <p className="font-medium text-green-700">{importResult.message}</p>
              </div>
              {importResult.imported_items.length > 0 && (
                <div className="text-sm text-foreground-muted">
                  <p className="mb-2">Imported items preview:</p>
                  <ul className="space-y-1">
                    {importResult.imported_items.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span>{item.type === "video" ? "🎬" : "📷"}</span>
                        <span className="truncate">{item.filename}</span>
                      </li>
                    ))}
                    {importResult.imported_items.length > 5 && (
                      <li className="text-foreground-muted">
                        ...and {importResult.imported_items.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div className="mt-3 text-sm text-amber-600">
                  <p>Some items could not be imported:</p>
                  <ul className="list-disc list-inside">
                    {importResult.errors.slice(0, 3).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Link href={`/project/${selectedProjectId}`} className="block mt-4">
                <Button className="w-full">
                  Review & Continue
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
          )}

          {/* Instructions Toggle */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full mt-6 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-2"
          >
            {showInstructions ? "Hide" : "Show"} export instructions
            <span className={`transform transition-transform ${showInstructions ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {/* Instagram Export Instructions */}
          {showInstructions && (
            <Card className="mt-4 p-6 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
              <h3 className="font-semibold text-foreground mb-4">
                How to Export Your Instagram Data
              </h3>
              <ol className="text-sm text-foreground-muted space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">1</span>
                  <span>Open the Instagram app → Profile → Menu (☰) → <strong>Settings and privacy</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">2</span>
                  <span>Tap <strong>Accounts Center</strong> → <strong>Your information and permissions</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">3</span>
                  <span>Tap <strong>Export your information</strong> → <strong>Create export</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">4</span>
                  <span>Select <strong>Export to device</strong> → Tap <strong>Customize information</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">5</span>
                  <span>Select <strong>Media</strong> (your photos and videos)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">6</span>
                  <span>Select date range: Choose <strong>All time</strong> for your full history</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold">7</span>
                  <span><strong>Important:</strong> Select <strong>JSON</strong> as the format (not HTML)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">8</span>
                  <span>Submit the request and wait for the email with your download link</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">9</span>
                  <span>Download the ZIP file and upload it here</span>
                </li>
              </ol>
              <p className="mt-4 text-xs text-foreground-muted">
                Note: The export usually takes a few minutes to a few hours. You&apos;ll receive an email when it&apos;s ready. The download link expires after 4 days.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
