import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { cn } from "@/lib/utils"

export interface VoiceTextareaProps extends React.ComponentProps<"textarea"> {
  onVoiceInput?: (text: string) => void;
}

export const VoiceTextarea = React.forwardRef<HTMLTextAreaElement, VoiceTextareaProps>(
  ({ className, value, onChange, onVoiceInput, ...props }, ref) => {
    
    const { isListening, toggleListening } = useSpeechRecognition((transcript) => {
      // If the parent passed a custom handler, use it
      if (onVoiceInput) {
        onVoiceInput(transcript);
      } else if (onChange) {
        // Otherwise try to synthesize an onChange event (this is trickier, 
        // usually it's better for the parent to pass `value` and `onChange(val)`)
        // To keep it simple, we expect the parent to pass `onVoiceInput={(val) => setMyState(prev => prev + " " + val)}`
      }
    });

    return (
      <div className="relative w-full">
        <Textarea
          ref={ref}
          value={value}
          onChange={onChange}
          className={cn("pr-10", className)}
          placeholder={isListening ? "Listening..." : props.placeholder}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-2 bottom-2 h-7 w-7 rounded-full transition-all cursor-pointer",
            isListening 
              ? "text-red-500 bg-red-500/10 hover:bg-red-500/20 animate-pulse" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          onClick={toggleListening}
          title={isListening ? "Stop Listening" : "Start Voice Typing"}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      </div>
    )
  }
)
VoiceTextarea.displayName = "VoiceTextarea"
