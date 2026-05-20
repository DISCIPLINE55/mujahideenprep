import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Chrome, Compass, Share } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { toast } from "sonner";

interface InstallPwaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInstallable: boolean;
  onInstall: () => Promise<boolean>;
}

export function InstallPwaDialog({
  open,
  onOpenChange,
  isInstallable,
  onInstall,
}: InstallPwaDialogProps) {
  // Detect if user is on iOS
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // Detect if user is on Safari (but not Chrome on iOS)
  const isSafari =
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await onInstall();
      if (success) {
        toast.success("App installation started!");
        onOpenChange(false);
      } else {
        toast.error("Installation was cancelled or failed.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:w-full max-w-md rounded-2xl shadow-2xl border bg-card text-card-foreground">
        <DialogHeader className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
            <img src={logoImg} alt="MPSMS Logo" className="h-12 w-12 rounded-xl object-cover" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Install MPSMS Portal
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Access the school portal instantly from your home screen with offline support and a faster experience.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4 border-t border-b my-2">
          {isInstallable ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <Smartphone className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs text-foreground/80 leading-relaxed">
                  One-click native app installation on compatible browsers like Chrome, Edge, and Samsung Internet.
                </p>
              </div>
              <Button onClick={handleInstallClick} className="w-full flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> Install Now
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <p className="font-semibold text-foreground/90 flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" /> How to install on your device:
              </p>

              {isIOS ? (
                <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                  <div className="flex gap-2.5 items-start">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground shrink-0 mt-0.5">1</span>
                    <p>
                      Tap the <strong className="text-foreground">Share</strong> button <Share className="inline-block h-3.5 w-3.5 mx-0.5 text-primary" /> in Safari at the bottom of the screen.
                    </p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground shrink-0 mt-0.5">2</span>
                    <p>
                      Scroll down the list and select <strong className="text-foreground">Add to Home Screen</strong>.
                    </p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground shrink-0 mt-0.5">3</span>
                    <p>
                      Tap <strong className="text-foreground">Add</strong> in the top-right corner to complete installation.
                    </p>
                  </div>
                </div>
              ) : isSafari ? (
                <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                  <div className="flex gap-2.5 items-start">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground shrink-0 mt-0.5">1</span>
                    <p>
                      Click the <strong className="text-foreground">Share</strong> icon at the top right of Safari.
                    </p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground shrink-0 mt-0.5">2</span>
                    <p>
                      Select <strong className="text-foreground">Add to Dock</strong> or <strong className="text-foreground">Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                  <div className="flex gap-2.5 items-start">
                    <Chrome className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p>
                      Open your browser settings menu (the <strong className="text-foreground">three dots</strong> or <strong className="text-foreground">menu icon</strong>) and select <strong className="text-foreground">Install App</strong> or <strong className="text-foreground">Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between items-center gap-2">
          <p className="text-[10px] text-muted-foreground text-center sm:text-left">
            MPSMS v1.0.0 • Offline Ready
          </p>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
