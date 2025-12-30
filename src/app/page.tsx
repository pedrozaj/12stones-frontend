export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black text-white">
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
          12 Stones
        </h1>
        <p className="max-w-xl text-lg text-zinc-400">
          Transform your social media memories into cinematic narrative videos,
          narrated in your own AI-cloned voice.
        </p>
        <div className="flex gap-4">
          <a
            href="/login"
            className="rounded-full bg-white px-6 py-3 font-medium text-black transition hover:bg-zinc-200"
          >
            Get Started
          </a>
          <a
            href="/about"
            className="rounded-full border border-zinc-700 px-6 py-3 font-medium transition hover:border-zinc-500"
          >
            Learn More
          </a>
        </div>
      </main>
    </div>
  );
}
