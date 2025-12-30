"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button, Input, Card } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

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
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎙️</span>
              <div>
                <p className="font-medium text-foreground">AI Voice Clone</p>
                <p className="text-sm text-foreground-muted">Not configured</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Set Up
              <ArrowRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </Card>
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
