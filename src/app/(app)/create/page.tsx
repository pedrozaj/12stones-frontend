"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card } from "@/components/ui";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

const MEMORIAL_TYPES = [
  {
    id: "milestone",
    name: "Mile Stone",
    description: "A yearly reflection on life's journey",
    icon: "🪨",
    example: "2024 - Year of Growth",
  },
  {
    id: "family",
    name: "Family Memorial",
    description: "Celebrate family moments and gatherings",
    icon: "👨‍👩‍👧‍👦",
    example: "Christmas 2024",
  },
  {
    id: "tribute",
    name: "Tribute",
    description: "Honor and remember a loved one",
    icon: "🕯️",
    example: "In Memory of Grandpa",
  },
  {
    id: "celebration",
    name: "Celebration",
    description: "Mark a special occasion or achievement",
    icon: "🎉",
    example: "Graduation Day",
  },
];

function CreateMemorialContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedType = searchParams.get("type");

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(
    preselectedType || null
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // In real app, would create memorial and redirect to it
    router.push("/dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Choose Type */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Create a Memorial
          </h1>
          <p className="text-foreground-muted mb-8">
            What type of memorial would you like to create?
          </p>

          <div className="grid gap-3">
            {MEMORIAL_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-radius-xl border-2 text-left transition-all ${
                  selectedType === type.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{type.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {type.name}
                      </h3>
                      {selectedType === type.id && (
                        <CheckIcon className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-foreground-muted mt-0.5">
                      {type.description}
                    </p>
                    <p className="text-xs text-accent mt-1">
                      e.g., {type.example}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              className="flex-1"
              disabled={!selectedType}
              onClick={() => setStep(2)}
            >
              Continue
              <ArrowRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Name Your Memorial
          </h1>
          <p className="text-foreground-muted mb-8">
            Give your memorial a meaningful title and description.
          </p>

          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="e.g., 2024 - A Year of Faith"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description (optional)
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-radius-lg border border-border bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                rows={3}
                placeholder="Tell the story behind this memorial..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={!title.trim()}
              onClick={() => setStep(3)}
            >
              Continue
              <ArrowRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Add Content */}
      {step === 3 && (
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Add Memories
          </h1>
          <p className="text-foreground-muted mb-8">
            Choose how you&apos;d like to add content to your memorial.
          </p>

          <div className="space-y-3">
            <Card
              className="p-4 hover:bg-input transition-colors cursor-pointer"
              onClick={() => router.push("/connections")}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">📱</span>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">
                    Import from Social Media
                  </h3>
                  <p className="text-sm text-foreground-muted">
                    Pull in photos and videos from connected accounts
                  </p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-foreground-muted" />
              </div>
            </Card>

            <Card
              className="p-4 hover:bg-input transition-colors cursor-pointer"
              onClick={() => router.push("/upload")}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">📤</span>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">
                    Upload from Device
                  </h3>
                  <p className="text-sm text-foreground-muted">
                    Select photos and videos from your device
                  </p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-foreground-muted" />
              </div>
            </Card>

            <Card
              className="p-4 hover:bg-input transition-colors cursor-pointer"
              onClick={handleCreate}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">⏭️</span>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Add Later</h3>
                  <p className="text-sm text-foreground-muted">
                    Create the memorial now, add content later
                  </p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-foreground-muted" />
              </div>
            </Card>
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              isLoading={isCreating}
            >
              Create Memorial
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateMemorialPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-6">Loading...</div>}>
      <CreateMemorialContent />
    </Suspense>
  );
}
