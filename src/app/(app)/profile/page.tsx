"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button, Input, Card } from "@/components/ui";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

interface VoiceProfile {
  id: string;
  name: string;
  status: "processing" | "ready" | "failed";
}

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState(true);

  // Fetch voice profile
  useEffect(() => {
    const fetchVoiceProfile = async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");

      try {
        const response = await fetch(`${API_URL}/api/voice/profiles`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const profiles = await response.json();
          // Get the first ready profile, or the most recent one
          const readyProfile = profiles.find((p: VoiceProfile) => p.status === "ready");
          setVoiceProfile(readyProfile || profiles[0] || null);
        }
      } catch (err) {
        console.error("Failed to fetch voice profile:", err);
      } finally {
        setIsLoadingVoice(false);
      }
    };

    fetchVoiceProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 w-24 rounded-full bg-input mx-auto" />
          <div className="h-6 w-48 bg-input mx-auto rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Header */}
      <section className="text-center">
        <div className="w-24 h-24 rounded-full bg-input flex items-center justify-center text-4xl mx-auto mb-4">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            "👤"
          )}
        </div>
        <h1 className="text-2xl font-bold text-foreground">{user?.name}</h1>
        <p className="text-foreground-muted">{user?.email}</p>
      </section>

      {/* Account Settings */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Account Settings
        </h2>
        <Card className="divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Name</p>
                <p className="text-sm text-foreground-muted">{user?.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email</p>
                <p className="text-sm text-foreground-muted">{user?.email}</p>
              </div>
              <Button variant="ghost" size="sm" disabled>
                Edit
              </Button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Password</p>
                <p className="text-sm text-foreground-muted">••••••••</p>
              </div>
              <Button variant="ghost" size="sm">
                Change
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Connected Accounts */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Connected Accounts
        </h2>
        <Card className="divide-y divide-border">
          <SocialAccountRow
            name="Instagram"
            icon="📸"
            connected={false}
          />
          <SocialAccountRow
            name="Facebook"
            icon="📘"
            connected={false}
          />
          <SocialAccountRow
            name="TikTok"
            icon="🎵"
            connected={false}
          />
        </Card>
      </section>

      {/* Voice Profile */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Voice Profile
        </h2>
        <Link href="/voice">
          <Card className="p-4 hover:bg-input/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isLoadingVoice ? (
                  <div className="w-10 h-10 rounded-full bg-input animate-pulse" />
                ) : voiceProfile?.status === "ready" ? (
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  </div>
                ) : (
                  <span className="text-2xl">🎙️</span>
                )}
                <div>
                  <p className="font-medium text-foreground">AI Voice Clone</p>
                  <p className="text-sm text-foreground-muted">
                    {isLoadingVoice
                      ? "Loading..."
                      : voiceProfile?.status === "ready"
                      ? voiceProfile.name
                      : voiceProfile?.status === "processing"
                      ? "Processing..."
                      : "Not configured"}
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-radius-lg bg-input text-foreground hover:bg-input/80">
                {voiceProfile ? "Manage" : "Set Up"}
                <ArrowRightIcon className="w-4 h-4" />
              </span>
            </div>
          </Card>
        </Link>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Account Actions
        </h2>
        <div className="space-y-3">
          <Button
            variant="secondary"
            className="w-full"
            onClick={logout}
          >
            Sign Out
          </Button>
          <Button
            variant="outline"
            className="w-full text-red-500 border-red-500/20 hover:bg-red-500/10"
          >
            Delete Account
          </Button>
        </div>
      </section>
    </div>
  );
}

function SocialAccountRow({
  name,
  icon,
  connected,
}: {
  name: string;
  icon: string;
  connected: boolean;
}) {
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-sm text-foreground-muted">
            {connected ? "Connected" : "Not connected"}
          </p>
        </div>
      </div>
      <Button variant={connected ? "ghost" : "secondary"} size="sm">
        {connected ? "Disconnect" : "Connect"}
      </Button>
    </div>
  );
}
