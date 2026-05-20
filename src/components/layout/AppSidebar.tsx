import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  BookOpen,
  ClipboardCheck,
  FileText,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  CalendarDays,
  Sparkles,
  Library,
  MessageSquare,
  BarChart3,
  LogOut,
  TrendingDown,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_NAV, signOut, type UserRole } from "@/lib/auth";
import logoImg from "@/assets/logo.png";
import { useTranslation } from "react-i18next";
import { usePWA } from "@/hooks/use-pwa";
import { InstallPwaDialog } from "@/components/InstallPwaDialog";

const ICON_MAP: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Students: Users,
  Teachers: GraduationCap,
  Parents: Users,
  Classes: School,
  Subjects: BookOpen,
  Attendance: ClipboardCheck,
  Results: FileText,
  Fees: Wallet,
  Expenses: TrendingDown,
  Timetable: CalendarDays,
  Notifications: Bell,
  Calendar: CalendarDays,
  Library: Library,
  Communications: MessageSquare,
  Reports: BarChart3,
  "AI Assistant": Sparkles,
  Settings: Settings,
};

export function AppSidebar({
  collapsed,
  onToggle,
  role,
}: {
  collapsed: boolean;
  onToggle: () => void;
  role: UserRole;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isInstallable, isInstalled, install } = usePWA();
  const [installOpen, setInstallOpen] = useState(false);

  const visibleItems = ROLE_NAV.filter((item) => item.roles.includes(role));

  function handleLogout() {
    signOut();
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar-bg sidebar-transition shadow-lg lg:shadow-none",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo area */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-3">
        <img src={logoImg} alt="MPSMS Logo" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
              Mujahideen Prep
            </p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate">
              ESTD 1997 • Mankessim
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {visibleItems.map((item) => {
          const Icon = ICON_MAP[item.label] || LayoutDashboard;
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/dashboard" && item.to !== "/teacher-dashboard" && item.to !== "/parent-dashboard" && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{t(item.label)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {!isInstalled && (
          <button
            onClick={() => setInstallOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-primary hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Download className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t("Install App")}</span>}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t("Logout")}</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      <InstallPwaDialog
        open={installOpen}
        onOpenChange={setInstallOpen}
        isInstallable={isInstallable}
        onInstall={install}
      />
    </aside>
  );
}

export function MobileSidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-3 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
