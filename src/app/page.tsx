import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";
import { ArrowRightIcon, PlayIcon } from "@/components/icons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <Logo size="sm" />
        <Link
          href="/login"
          className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Decorative stones */}
          <div className="flex justify-center gap-2 mb-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-accent/60"
                style={{
                  transform: `translateY(${Math.sin(i * 0.8) * 8}px)`,
                  opacity: 0.4 + i * 0.15,
                }}
              />
            ))}
          </div>

          {/* Main heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Your story,
              <br />
              <span className="text-accent">remembered forever</span>
            </h1>
            <p className="text-lg text-foreground-muted max-w-md mx-auto">
              Transform your precious memories into cinematic video memorials,
              narrated in your own voice.
            </p>
          </div>

          {/* Scripture reference - subtle */}
          <blockquote className="text-sm text-foreground-muted italic border-l-2 border-accent/30 pl-4 text-left max-w-sm mx-auto">
            "When your children ask, 'What do these stones mean?' tell them..."
            <footer className="text-xs mt-1 not-italic">— Joshua 4:21-22</footer>
          </blockquote>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRightIcon className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <PlayIcon className="w-5 h-5" />
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <p className="text-sm text-foreground-muted pt-4">
            Join families preserving their legacy
          </p>
        </div>
      </main>

      {/* Features Preview */}
      <section className="px-6 py-16 bg-background-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              step="1"
              title="Connect your memories"
              description="Import photos and videos from your social media or upload directly"
            />
            <FeatureCard
              step="2"
              title="AI crafts your narrative"
              description="Our AI weaves your moments into a meaningful story"
            />
            <FeatureCard
              step="3"
              title="Your voice tells it"
              description="Clone your voice to narrate your memorial in your own words"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex gap-6 text-sm text-foreground-muted">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center space-y-3">
      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-semibold flex items-center justify-center mx-auto">
        {step}
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-foreground-muted">{description}</p>
    </div>
  );
}
