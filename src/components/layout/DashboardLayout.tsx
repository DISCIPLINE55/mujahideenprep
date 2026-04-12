import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { AppSidebar, MobileSidebarToggle } from "./AppSidebar";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile sidebar overlay */}
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
            />
          </div>
        </>
      )}

      {/* Mobile trigger */}
      <MobileSidebarToggle onClick={() => setMobileOpen(true)} />

      {/* Main content */}
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
