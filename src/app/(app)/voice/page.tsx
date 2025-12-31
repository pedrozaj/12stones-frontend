"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Button, Card } from "@/components/ui";
import { CheckIcon, ArrowRightIcon, PlayIcon } from "@/components/icons";

interface VoiceProfile {
  id: string;
  name: string;
  status: "processing" | "ready" | "failed";
  sample_duration: number | null;
  sample_urls: string[];
  created_at: string;
}

const RECORDING_STEPS = [
  {
    id: 1,
    title: "Read a short passage",
    description: "We'll use this to capture your voice characteristics",
    script: "In the future when your descendants ask their parents, 'What do these stones mean?' tell them, 'Israel crossed the Jordan on dry ground.' For the Lord your God dried up the Jordan before you until you had crossed over.",
  },
  {
    id: 2,
    title: "Share a memory",
    description: "Tell us about a meaningful moment in your life",
    script: "Speak naturally for 30-60 seconds about a favorite memory, a lesson you've learned, or something you're grateful for.",
  },
  {
    id: 3,
    title: "Express emotions",
    description: "Help us capture your emotional range",
    script: "Read these phrases with feeling: 'I'm so proud of you.' 'This was the happiest day of my life.' 'I'll always remember this moment.' 'Thank you for everything.'",
  },
];

function VoiceCloneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const [currentStep, setCurrentStep] = useState(0);
  const [recordings, setRecordings] = useState<{ [key: number]: Blob }>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingProfileId, setPlayingProfileId] = useState<string | null>(null);
  const [playingSampleIndex, setPlayingSampleIndex] = useState(0);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // In project context mode
  const isProjectFlow = !!projectId;

  const playProfileSample = (profile: VoiceProfile) => {
    if (!profile.sample_urls || profile.sample_urls.length === 0) return;

    // If already playing this profile, stop it
    if (playingProfileId === profile.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingProfileId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Play the first sample
    const audio = new Audio(profile.sample_urls[0]);
    audioRef.current = audio;
    setPlayingProfileId(profile.id);
    setPlayingSampleIndex(0);

    audio.onended = () => {
      // Play next sample if available
      const nextIndex = playingSampleIndex + 1;
      if (nextIndex < profile.sample_urls.length) {
        setPlayingSampleIndex(nextIndex);
        const nextAudio = new Audio(profile.sample_urls[nextIndex]);
        audioRef.current = nextAudio;
        nextAudio.onended = audio.onended;
        nextAudio.play();
      } else {
        setPlayingProfileId(null);
        setPlayingSampleIndex(0);
        audioRef.current = null;
      }
    };

    audio.play();
  };

  const handleContinueWithVoice = async () => {
    if (!selectedProfileId || !projectId) return;

    setIsGeneratingAudio(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const token = localStorage.getItem("access_token");

    try {
      // Update project with selected voice profile
      await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voice_profile_id: selectedProfileId }),
      });

      // Redirect back to project review page
      router.push(`/project/${projectId}`);
    } catch (err) {
      console.error("Failed to continue with voice:", err);
      setError("Failed to proceed. Please try again.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Fetch existing voice profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");

      try {
        const response = await fetch(`${API_URL}/api/voice/profiles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVoiceProfiles(data);
        }
      } catch (err) {
        console.error("Failed to fetch voice profiles:", err);
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    fetchProfiles();
  }, [isComplete]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordings((prev) => ({ ...prev, [currentStep]: blob }));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to record your voice.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleNext = () => {
    if (currentStep < RECORDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const token = localStorage.getItem("access_token");

    const formData = new FormData();
    formData.append("name", `Voice Profile ${format(new Date(), "MMM d, yyyy")}`);
    Object.entries(recordings).forEach(([step, blob]) => {
      formData.append("samples", blob, `recording_${step}.webm`);
    });

    try {
      const response = await fetch(`${API_URL}/api/voice/profiles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create voice profile");
      }

      setIsComplete(true);
      setRecordings({});
      setCurrentStep(0);
    } catch (err) {
      console.error("Error submitting recordings:", err);
      setError(err instanceof Error ? err.message : "Failed to process voice recordings");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckIcon className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Voice Profile Created!
        </h1>
        <p className="text-foreground-muted mb-8">
          {isProjectFlow
            ? "Your AI voice clone is ready. Select it to continue with your memorial."
            : "Your AI voice clone is ready. It will be used to narrate your video memorials."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setIsComplete(false); setShowRecorder(false); }}>
            {isProjectFlow ? "Select Voice" : "View My Profiles"}
          </Button>
          {!isProjectFlow && (
            <Button onClick={() => router.push("/dashboard")}>
              Return to Dashboard
              <ArrowRightIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <span className="text-4xl">🎙️</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Creating Your Voice Profile
        </h1>
        <p className="text-foreground-muted mb-4">
          Our AI is analyzing your recordings and creating your unique voice clone...
        </p>
        <div className="w-48 h-2 bg-border rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  const step = RECORDING_STEPS[currentStep];
  const hasRecording = recordings[currentStep];

  // Show recorder UI
  if (showRecorder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => { setShowRecorder(false); setRecordings({}); setCurrentStep(0); }}
            className="text-sm text-foreground-muted hover:text-foreground mb-4 flex items-center gap-1"
          >
            ← Back to profiles
          </button>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Clone Your Voice
          </h1>
          <p className="text-foreground-muted">
            Record a few samples so we can create an AI voice that sounds like you.
          </p>
        </div>

        {/* Error */}
        {error && (
          <Card className="mb-6 p-4 bg-red-500/10 border-red-500/20">
            <p className="text-red-600 text-sm">{error}</p>
          </Card>
        )}

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {RECORDING_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex-1 h-2 rounded-full transition-colors ${
                i < currentStep
                  ? "bg-primary"
                  : i === currentStep
                  ? "bg-primary/50"
                  : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Current Step */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {currentStep + 1}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{step.title}</h2>
              <p className="text-sm text-foreground-muted">{step.description}</p>
            </div>
          </div>

          {/* Script */}
          <div className="bg-input rounded-radius-lg p-4 mb-6">
            <p className="text-sm text-foreground-muted mb-2">
              {currentStep === 1 ? "Speak naturally:" : "Read aloud:"}
            </p>
            <p className="text-foreground italic">&quot;{step.script}&quot;</p>
          </div>

          {/* Recording Controls */}
          <div className="flex flex-col items-center gap-4">
            {isRecording ? (
              <>
                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                  <MicIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-foreground-muted">Recording...</p>
                <Button variant="secondary" onClick={stopRecording}>
                  Stop Recording
                </Button>
              </>
            ) : (
              <>
                <button
                  onClick={startRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                    hasRecording
                      ? "bg-green-500/10 border-2 border-green-500"
                      : "bg-primary/10 hover:bg-primary/20"
                  }`}
                >
                  {hasRecording ? (
                    <CheckIcon className="w-8 h-8 text-green-500" />
                  ) : (
                    <MicIcon className="w-8 h-8 text-primary" />
                  )}
                </button>
                <p className="text-sm text-foreground-muted">
                  {hasRecording ? "Recording saved! Tap to re-record" : "Tap to start recording"}
                </p>
              </>
            )}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              Back
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={!hasRecording}
            onClick={handleNext}
          >
            {currentStep === RECORDING_STEPS.length - 1 ? "Create Voice Profile" : "Next Step"}
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-foreground-muted text-center mt-8">
          Your voice recordings are encrypted and used only to create your personal AI voice clone.
          They are never shared with third parties.
        </p>
      </div>
    );
  }

  // Show voice profiles list
  const readyProfiles = voiceProfiles.filter((p) => p.status === "ready");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        {isProjectFlow && (
          <button
            onClick={() => router.push(`/project/${projectId}`)}
            className="text-sm text-foreground-muted hover:text-foreground mb-4 flex items-center gap-1"
          >
            ← Back to project
          </button>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isProjectFlow ? "Select a Voice" : "My Voice Profiles"}
            </h1>
            <p className="text-foreground-muted">
              {isProjectFlow
                ? "Choose a voice to narrate your memorial, or create a new one."
                : "Your AI voice clones for narrating memorials."}
            </p>
          </div>
          <Button onClick={() => setShowRecorder(true)}>
            <MicIcon className="w-4 h-4" />
            New Profile
          </Button>
        </div>
      </div>

      {/* Voice Profiles List */}
      {isLoadingProfiles ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-input" />
                <div className="flex-1">
                  <div className="h-4 bg-input rounded w-1/3 mb-2" />
                  <div className="h-3 bg-input rounded w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : voiceProfiles.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MicIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground mb-2">No voice profiles yet</h2>
          <p className="text-foreground-muted mb-6">
            Create your first AI voice clone to narrate your memorials.
          </p>
          <Button onClick={() => setShowRecorder(true)}>
            Create Voice Profile
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {voiceProfiles.map((profile) => {
            const isSelected = selectedProfileId === profile.id;
            const isSelectable = isProjectFlow && profile.status === "ready";

            return (
              <Card
                key={profile.id}
                className={`p-4 transition-all ${
                  isSelectable ? "cursor-pointer hover:border-primary" : ""
                } ${isSelected ? "border-primary ring-2 ring-primary/20" : ""}`}
                onClick={() => {
                  if (isSelectable) {
                    setSelectedProfileId(isSelected ? null : profile.id);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Selection indicator or play button */}
                  {isProjectFlow && profile.status === "ready" ? (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isSelected ? (
                        <CheckIcon className="w-6 h-6" />
                      ) : (
                        <MicIcon className="w-5 h-5" />
                      )}
                    </div>
                  ) : profile.status === "ready" && profile.sample_urls?.length > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playProfileSample(profile);
                      }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        playingProfileId === profile.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 hover:bg-primary/20 text-primary"
                      }`}
                    >
                      {playingProfileId === profile.id ? (
                        <StopIcon className="w-5 h-5" />
                      ) : (
                        <PlayIcon className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      profile.status === "ready"
                        ? "bg-green-500/10"
                        : profile.status === "processing"
                        ? "bg-yellow-500/10"
                        : "bg-red-500/10"
                    }`}>
                      {profile.status === "ready" ? (
                        <CheckIcon className="w-6 h-6 text-green-500" />
                      ) : profile.status === "processing" ? (
                        <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-red-500">!</span>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{profile.name}</h3>
                    <p className="text-sm text-foreground-muted">
                      {playingProfileId === profile.id
                        ? `Playing sample ${playingSampleIndex + 1} of ${profile.sample_urls?.length || 0}...`
                        : profile.status === "ready"
                        ? "Ready to use"
                        : profile.status === "processing"
                        ? "Processing..."
                        : "Failed to create"}
                      {profile.sample_duration && playingProfileId !== profile.id && ` • ${profile.sample_duration}s of audio`}
                    </p>
                  </div>
                  {isProjectFlow && profile.status === "ready" && profile.sample_urls?.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playProfileSample(profile);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        playingProfileId === profile.id
                          ? "bg-primary/20 text-primary"
                          : "bg-input hover:bg-border text-foreground-muted"
                      }`}
                    >
                      {playingProfileId === profile.id ? (
                        <StopIcon className="w-4 h-4" />
                      ) : (
                        <PlayIcon className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {!isProjectFlow && (
                    <p className="text-xs text-foreground-muted">
                      {format(new Date(profile.created_at), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Continue button for project flow */}
      {isProjectFlow && readyProfiles.length > 0 && (
        <div className="sticky bottom-20 bg-background/80 backdrop-blur py-4 mt-6">
          <Button
            className="w-full"
            disabled={!selectedProfileId || isGeneratingAudio}
            isLoading={isGeneratingAudio}
            onClick={handleContinueWithVoice}
          >
            {isGeneratingAudio ? (
              "Generating Audio..."
            ) : selectedProfileId ? (
              <>
                Continue with Selected Voice
                <ArrowRightIcon className="w-4 h-4" />
              </>
            ) : (
              "Select a voice to continue"
            )}
          </Button>
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-8 p-4 bg-primary/5 border-primary/20">
        <h3 className="font-medium text-foreground mb-2">About Voice Profiles</h3>
        <ul className="text-sm text-foreground-muted space-y-1">
          <li>• Your voice profile is used to narrate your video memorials</li>
          <li>• Recording takes about 2-3 minutes</li>
          <li>• Your recordings are encrypted and never shared</li>
        </ul>
      </Card>
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export default function VoiceClonePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-6">Loading...</div>}>
      <VoiceCloneContent />
    </Suspense>
  );
}
