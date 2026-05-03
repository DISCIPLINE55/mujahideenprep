import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Send, CheckCircle, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { logActivity } from "@/lib/auth";

export interface Recipient {
  id: string;
  name: string;
  guardian: string;
  phone: string;
  message: string;
  status: "pending" | "sent" | "error";
}

interface BulkWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: Recipient[];
  onComplete?: () => void;
  title?: string;
}

export function BulkWhatsAppDialog({ open, onOpenChange, recipients: initialRecipients, onComplete, title = "Bulk WhatsApp Sender" }: BulkWhatsAppDialogProps) {
  const [recipients, setRecipients] = React.useState<Recipient[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setRecipients(initialRecipients);
      setCurrentIndex(0);
    }
  }, [open, initialRecipients]);

  const sentCount = recipients.filter(r => r.status === "sent").length;
  const progress = recipients.length > 0 ? (sentCount / recipients.length) * 100 : 0;
  const currentRecipient = recipients[currentIndex];

  const handleSendNext = () => {
    if (!currentRecipient) return;

    const phone = currentRecipient.phone.replace(/\D/g, "");
    if (!phone) {
      toast.error(`Invalid phone for ${currentRecipient.name}`);
      const updated = [...recipients];
      updated[currentIndex].status = "error";
      setRecipients(updated);
      if (currentIndex < recipients.length - 1) setCurrentIndex(prev => prev + 1);
      return;
    }

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(currentRecipient.message)}`;
    window.open(waUrl, "_blank");
    
    const updated = [...recipients];
    updated[currentIndex].status = "sent";
    setRecipients(updated);
    
    logActivity(`Sent WhatsApp reminder to ${currentRecipient.guardian} (${currentRecipient.name})`);
    
    if (currentIndex < recipients.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast.success("Bulk sending complete!");
      if (onComplete) onComplete();
    }
  };

  const handleSkip = () => {
    if (currentIndex < recipients.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-success" />
            {title}
          </DialogTitle>
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-medium">
              <span>Progress: {sentCount} of {recipients.length} sent</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-muted" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          <div className="md:col-span-1 border-r pr-4 overflow-hidden flex flex-col">
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Recipients</h4>
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {recipients.map((r, i) => (
                  <div 
                    key={r.id} 
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      i === currentIndex ? "border-primary bg-primary/5" : 
                      r.status === "sent" ? "border-success/30 bg-success/5" : "border-border"
                    }`}
                    onClick={() => setCurrentIndex(i)}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className="truncate">{r.guardian}</span>
                      {r.status === "sent" && <CheckCircle className="h-3 w-3 text-success" />}
                      {r.status === "error" && <AlertCircle className="h-3 w-3 text-destructive" />}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">Student: {r.name}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="md:col-span-2 flex flex-col gap-4">
            {currentRecipient ? (
              <>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg border">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">To: {currentRecipient.guardian} ({currentRecipient.phone})</div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{currentRecipient.message}</div>
                  </div>
                </div>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={handleSkip} disabled={currentIndex === recipients.length - 1}>
                    Skip Student
                  </Button>
                  <Button className="bg-success hover:bg-success/90" onClick={handleSendNext}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open WhatsApp & Next
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <CheckCircle className="h-12 w-12 text-success mb-4" />
                <h3 className="text-lg font-bold">All Set!</h3>
                <p className="text-sm text-muted-foreground">All selected messages have been processed.</p>
                <Button variant="outline" className="mt-6" onClick={() => onOpenChange(false)}>Close Window</Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
