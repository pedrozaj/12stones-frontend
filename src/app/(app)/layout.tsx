"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { HomeIcon, GridIcon, PlusIcon, UserIcon } from "@/components/icons";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <button className="w-10 h-10 rounded-full bg-input flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="max-w-md mx-auto px-6 py-2 flex items-center justify-around">
          <NavItem
            href="/dashboard"
            icon={HomeIcon}
            label="Home"
            isActive={pathname === "/dashboard"}
          />
          <NavItem
            href="/memorials"
            icon={GridIcon}
            label="Memorials"
            isActive={pathname === "/memorials"}
          />
          <Link
            href="/create"
            className="w-14 h-14 -mt-6 rounded-full bg-primary shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <PlusIcon className="w-6 h-6 text-primary-foreground" />
          </Link>
          <NavItem
            href="/connections"
            icon={ConnectionsIcon}
            label="Connect"
            isActive={pathname === "/connections"}
          />
          <NavItem
            href="/profile"
            icon={UserIcon}
            label="Profile"
            isActive={pathname === "/profile"}
          />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
        isActive ? "text-primary" : "text-foreground-muted"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs">{label}</span>
    </Link>
  );
}

function ConnectionsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
