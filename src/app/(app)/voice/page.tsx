"use client";

import { useState, useRef } from "react";
import { Button, Card } from "@/components/ui";
import { CheckIcon, ArrowRightIcon } from "@/components/icons";

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

export default function VoiceClonePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [recordings, setRecordings] = useState<{ [key: number]: Blob }>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

    // In a real implementation, this would upload recordings to the backend
    // and trigger ElevenLabs voice cloning
    const formData = new FormData();
    Object.entries(recordings).forEach(([step, blob]) => {
      formData.append(`recording_${step}`, blob, `recording_${step}.webm`);
    });

    try {
      // TODO: Implement actual API call to backend
      // const response = await fetch('/api/voice/clone', {
      //   method: 'POST',
      //   body: formData,
      // });

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setIsComplete(true);
    } catch (err) {
      console.error("Error submitting recordings:", err);
      alert("Failed to process voice recordings. Please try again.");
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
          Your AI voice clone is ready. It will be used to narrate your video memorials.
        </p>
        <Button onClick={() => window.location.href = "/dashboard"}>
          Return to Dashboard
          <ArrowRightIcon className="w-4 h-4" />
        </Button>
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Clone Your Voice
        </h1>
        <p className="text-foreground-muted">
          Record a few samples so we can create an AI voice that sounds like you.
        </p>
      </div>

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
