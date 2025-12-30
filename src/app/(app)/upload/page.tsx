"use client";

import { useState, useRef, useCallback } from "react";
import { Button, Card } from "@/components/ui";
import { CheckIcon, ArrowRightIcon } from "@/components/icons";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Upload Photos & Videos
        </h1>
        <p className="text-foreground-muted">
          Add photos and videos from your device to create memories.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-radius-xl p-8 text-center cursor-pointer transition-colors ${
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
          className="hidden"
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
