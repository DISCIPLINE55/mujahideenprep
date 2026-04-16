import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { AppSidebar, MobileSidebarToggle } from "./AppSidebar";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth";

export function DashboardLayout({ role, name }: { role: UserRole; name: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
            className="fixed inset-0 z-20 bg-foreground/30 lg:hidden"
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
