"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

const THEMES = [
  {
    id: "family",
    label: "Family",
    description: "Capture moments with loved ones",
    icon: "👨‍👩‍👧‍👦",
  },
  {
    id: "milestones",
    label: "Life Milestones",
    description: "Graduations, weddings, achievements",
    icon: "🎓",
  },
  {
    id: "faith",
    label: "Faith Journey",
    description: "God's faithfulness in your life",
    icon: "✨",
  },
  {
    id: "growth",
    label: "Personal Growth",
    description: "Challenges overcome, lessons learned",
    icon: "🌱",
  },
  {
    id: "adventures",
    label: "Adventures",
    description: "Travel, experiences, discoveries",
    icon: "🌍",
  },
  {
    id: "gratitude",
    label: "Gratitude",
    description: "Things you're thankful for",
    icon: "🙏",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleTheme = (id: string) => {
    setSelectedThemes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    setIsLoading(true);
    // TODO: Save preferences to backend
    setTimeout(() => {
      router.push("/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <Logo size="sm" />
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="max-w-lg w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold text-foreground">
              What stories do you want to tell?
            </h1>
            <p className="text-foreground-muted">
              Select the themes that matter most to you. This helps us craft
              meaningful narratives from your memories.
            </p>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((theme) => {
              const isSelected = selectedThemes.includes(theme.id);
              return (
                <button
                  key={theme.id}
                  onClick={() => toggleTheme(theme.id)}
                  className={`
                    relative p-4 rounded-radius-xl text-left
                    border-2 transition-all duration-200
                    hover:border-primary/50
                    ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }
                  `}
                >
                  {/* Checkmark */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}

                  <span className="text-2xl mb-2 block">{theme.icon}</span>
                  <span className="font-medium text-foreground block">
                    {theme.label}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {theme.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selection count */}
          <p className="text-center text-sm text-foreground-muted">
            {selectedThemes.length === 0
              ? "Select at least one theme to continue"
              : `${selectedThemes.length} theme${selectedThemes.length > 1 ? "s" : ""} selected`}
          </p>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={selectedThemes.length === 0}
            isLoading={isLoading}
            size="lg"
            className="w-full"
          >
            Continue
            <ArrowRightIcon className="w-5 h-5" />
          </Button>
        </div>
      </main>

      {/* Progress indicator */}
      <div className="px-6 py-4">
        <div className="max-w-lg mx-auto flex gap-2">
          <div className="flex-1 h-1 rounded-full bg-primary" />
          <div className="flex-1 h-1 rounded-full bg-border" />
          <div className="flex-1 h-1 rounded-full bg-border" />
        </div>
      </div>
    </div>
  );
}
