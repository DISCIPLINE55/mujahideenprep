import { useState, useEffect } from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import { AppSidebar, MobileSidebarToggle } from "./AppSidebar";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { UserRole } from "@/lib/auth";
import { syncCloudToLocal } from "@/lib/storage";
import { usePWA } from "@/hooks/use-pwa";
import { InstallPwaDialog } from "@/components/InstallPwaDialog";

export function DashboardLayout({ role }: { role: UserRole; name: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isInstallable, isInstalled, install } = usePWA();
  const [autoPromptOpen, setAutoPromptOpen] = useState(false);

  // Master sync from Cloud
  useEffect(() => {
    syncCloudToLocal();
  }, []);

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prompt for PWA installation 3 seconds after opening if not installed
  useEffect(() => {
    if (!isInstalled) {
      const prompted = sessionStorage.getItem("mpsms_pwa_auto_prompted");
      if (!prompted) {
        const timer = setTimeout(() => {
          setAutoPromptOpen(true);
          sessionStorage.setItem("mpsms_pwa_auto_prompted", "true");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isInstalled]);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          role={role}
        />
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden">
            <AppSidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              role={role}
            />
          </div>
        </>
      )}

      <MobileSidebarToggle onClick={() => setMobileOpen(true)} />

      <main
        className={cn(
          "min-h-screen sidebar-transition",
          collapsed ? "lg:ml-16" : "lg:ml-60"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <InstallPwaDialog
        open={autoPromptOpen}
        onOpenChange={setAutoPromptOpen}
        isInstallable={isInstallable}
        onInstall={install}
      />
    </div>
  );
}
