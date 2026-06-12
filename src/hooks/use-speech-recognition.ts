import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

export function useSpeechRecognition(onResult?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);

  // Keep ref up to date to avoid re-triggering effect
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => setIsListening(true);
        
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (onResultRef.current) {
            onResultRef.current(transcript);
          }
          toast.success("Voice transcribed!");
        };
        
        rec.onerror = (event: any) => {
          console.error("Speech error:", event.error);
          if (event.error === "not-allowed") {
            toast.error("Microphone access denied.");
          } else if (event.error !== "no-speech") {
            toast.error(`Speech recognition failed: ${event.error}`);
          }
          setIsListening(false);
        };
        
        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser. Try Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start recording:", err);
      }
    }
  }, [isListening]);

  return { isListening, toggleListening };
}
