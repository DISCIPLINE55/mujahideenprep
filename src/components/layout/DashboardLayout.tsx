import { useState, useEffect } from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import { AppSidebar, MobileSidebarToggle } from "./AppSidebar";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth";

export function DashboardLayout({ role }: { role: UserRole; name: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
        <Outlet />
      </main>
    </div>
  );
}
