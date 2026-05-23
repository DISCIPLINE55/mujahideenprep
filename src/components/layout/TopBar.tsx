import { Bell, Search, ChevronDown, LogOut, Moon, Sun, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getItems, KEYS, defaultTeachers, defaultStudents, defaultClasses, type Notification, type Teacher, type Student, type SchoolClass } from "@/lib/storage";
import { filterNotifications } from "@/lib/notificationFilter";
import { Link } from "@tanstack/react-router";
import { getAuth, getAuthSync, signOut } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { CommandMenu } from "@/components/CommandMenu";

export function TopBar({ title }: { title: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [auth, setAuth] = useState(() => (typeof window !== "undefined" ? getAuthSync() : null));
  const { t, i18n } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(() => (typeof window !== "undefined" && auth ? localStorage.getItem(`avatar_${auth.email}`) : ""));
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));

  useEffect(() => {
    async function refresh() {
      const notifications = getItems<Notification>(KEYS.NOTIFICATIONS, []);
      const teachers = getItems<Teacher>(KEYS.TEACHERS, defaultTeachers);
      const classes = getItems<SchoolClass>(KEYS.CLASSES, defaultClasses);
      const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);

      const a = await getAuth();
      setAuth(a);
      if (a && typeof window !== "undefined") setAvatarUrl(localStorage.getItem(`avatar_${a.email}`) || "");
      
      const visible = filterNotifications(notifications, a, teachers, classes, students);
      setUnreadCount(visible.filter((n) => !n.read).length);
    }
    refresh();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    const interval = setInterval(refresh, 3000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      clearInterval(interval);
    };
  }, []);

  function handleLogout() {
    signOut();
  }

  function toggleDarkMode() {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("mpsms_theme", isDark ? "dark" : "light");
  }

  const initials = (auth?.name ?? "Admin")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = auth?.role === "teacher" ? "Teacher" : auth?.role === "parent" ? "Parent" : "Administrator";

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b bg-card px-3 sm:px-6 pl-14 lg:pl-6">
      <div className="flex items-center gap-2 truncate">
        <h1 className="truncate text-base sm:text-lg font-bold text-foreground">{title}</h1>
        {isOnline ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Offline Mode
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <CommandMenu />

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleDarkMode}>
          <Sun className="h-5 w-5 dark:hidden" />
          <Moon className="h-5 w-5 hidden dark:block" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 font-bold text-xs uppercase">
              {i18n.language.substring(0, 2)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => i18n.changeLanguage("en")}>
              English (EN)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => i18n.changeLanguage("ar")}>
              العربية (AR)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link to="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight max-w-[120px] truncate">
                  {auth?.name ?? "Admin"}
                </p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              {t("Profile")}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">{t("Settings")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t("Logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
