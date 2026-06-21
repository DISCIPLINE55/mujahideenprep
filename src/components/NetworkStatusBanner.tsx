import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { processSyncOutbox } from "@/lib/storage";
import { notify } from "@/lib/toast-utils";

export function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      notify.warning("You are currently offline. Changes will be saved locally and synced when connection returns.");
    };

    const handleOnline = async () => {
      setIsOffline(false);
      setIsSyncing(true);
      try {
        await processSyncOutbox();
        notify.success("Connection restored. All local changes have been synced.");
      } catch (err) {
        console.error("Failed to sync outbox upon reconnection:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !isSyncing) return null;

  return (
    <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow-sm z-50 relative">
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You are operating offline. Some features may be unavailable.</span>
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Syncing pending changes...</span>
        </>
      )}
    </div>
  );
}
