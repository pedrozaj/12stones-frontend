"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { CheckIcon, ArrowRightIcon } from "@/components/icons";
import { api } from "@/lib/api";

interface SocialConnection {
  id: string;
  platform: string;
  platform_username: string | null;
  connected_at: string;
}

const SOCIAL_PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    description: "Import photos and reels from your Instagram account",
    color: "from-pink-500 to-purple-500",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "📘",
    description: "Import photos and videos from your Facebook timeline",
    color: "from-blue-600 to-blue-400",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    description: "Import your TikTok videos and memories",
    color: "from-gray-900 to-gray-700",
  },
];

function ConnectionsContent() {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("connected");

  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing connections on mount
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const data = await api.get<SocialConnection[]>("/api/social/connections");
        setConnections(data);
      } catch (err) {
        console.error("Failed to fetch connections:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnections();
  }, []);

  // Show success message if just connected
  useEffect(() => {
    if (justConnected) {
      // Refresh connections list
      api.get<SocialConnection[]>("/api/social/connections")
        .then(setConnections)
        .catch(console.error);
    }
  }, [justConnected]);

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    setError(null);

    try {
      const response = await api.get<{ auth_url: string }>(
        `/api/social/connect/${platformId}`
      );

      // Redirect to OAuth provider
      window.location.href = response.auth_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setError(message);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectionId: string, platformId: string) => {
    try {
      await api.delete(`/api/social/connections/${connectionId}`);
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  const isConnected = (platformId: string) =>
    connections.some((c) => c.platform === platformId);

  const getConnection = (platformId: string) =>
    connections.find((c) => c.platform === platformId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Connect Your Accounts
        </h1>
        <p className="text-foreground-muted">
          Link your social media accounts to automatically import your photos
          and videos into 12 Stones.
        </p>
      </div>

      {/* Success Message */}
      {justConnected && (
        <Card className="mb-6 p-4 bg-green-500/10 border-green-500/20">
          <div className="flex items-center gap-3">
            <CheckIcon className="w-5 h-5 text-green-500" />
            <p className="text-green-700">
              Successfully connected to {justConnected}!
            </p>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="mb-6 p-4 bg-red-500/10 border-red-500/20">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      )}

      {/* Platform List */}
      <div className="space-y-4">
        {SOCIAL_PLATFORMS.map((platform) => {
          const connected = isConnected(platform.id);
          const connection = getConnection(platform.id);
          const isConnecting = connecting === platform.id;

          return (
            <Card key={platform.id} className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-radius-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-2xl`}
                >
                  {platform.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {platform.name}
                    </h3>
                    {connected && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <CheckIcon className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground-muted mt-0.5">
                    {connected && connection?.platform_username
                      ? `@${connection.platform_username}`
                      : platform.description}
                  </p>
                </div>

                {/* Action */}
                <Button
                  variant={connected ? "outline" : "secondary"}
                  size="sm"
                  onClick={() =>
                    connected && connection
                      ? handleDisconnect(connection.id, platform.id)
                      : handleConnect(platform.id)
                  }
                  isLoading={isConnecting}
                  disabled={isConnecting || isLoading}
                >
                  {connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Import Status */}
      {connections.length > 0 && (
        <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                Ready to Import
              </h3>
              <p className="text-sm text-foreground-muted mb-4">
                You have {connections.length} account
                {connections.length !== 1 ? "s" : ""} connected. Start
                importing your memories to create beautiful video memorials.
              </p>
              <Button>
                Start Import
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card className="mt-8 p-4 bg-amber-500/10 border-amber-500/20">
        <h3 className="font-medium text-foreground mb-2">Setup Required</h3>
        <p className="text-sm text-foreground-muted mb-2">
          To enable social media connections, you need to configure OAuth credentials:
        </p>
        <ul className="text-sm text-foreground-muted list-disc list-inside space-y-1">
          <li>Instagram/Facebook: Create a Meta Developer App</li>
          <li>TikTok: Create a TikTok Developer App</li>
        </ul>
        <p className="text-sm text-foreground-muted mt-2">
          Add the credentials to your backend environment variables.
        </p>
      </Card>

      {/* Privacy Note */}
      <p className="text-xs text-foreground-muted text-center mt-8">
        Your data is secure. We only access the content you choose to import and
        never share your information with third parties.
      </p>
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-6">Loading...</div>}>
      <ConnectionsContent />
    </Suspense>
  );
}
