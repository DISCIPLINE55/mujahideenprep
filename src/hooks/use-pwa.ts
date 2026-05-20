import { useState, useEffect } from "react";

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(!!(window as any).deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone display mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone
    ) {
      setIsInstalled(true);
    }

    const handleReady = () => {
      setIsInstallable(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      (window as any).deferredPrompt = null;
    };

    window.addEventListener("pwa-install-ready", handleReady);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("pwa-install-ready", handleReady);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return false;

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      (window as any).deferredPrompt = null;
      setIsInstallable(false);
      return true;
    }
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    install,
  };
}
