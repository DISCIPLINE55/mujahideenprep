import { Bell, Search, ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getItems, KEYS, type Notification } from "@/lib/storage";
import { Link } from "@tanstack/react-router";
import { getAuth, clearAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

export function TopBar({ title }: { title: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [auth, setAuth] = useState(() => (typeof window !== "undefined" ? getAuth() : null));

  useEffect(() => {
    function refresh() {
      const notifications = getItems<Notification>(KEYS.NOTIFICATIONS, []);
      setUnreadCount(notifications.filter((n) => !n.read).length);
      setAuth(getAuth());
    }
    refresh();
    // Refresh on storage change (multi-tab) and on focus
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      clearInterval(interval);
    };
  }, []);

  function handleLogout() {
    clearAuth();
    window.location.href = "/";
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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b bg-card px-3 sm:px-6 pl-14 lg:pl-6">
      <h1 className="truncate text-base sm:text-lg font-bold text-foreground">{title}</h1>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("mpsms:open-search"))}
          className="hidden md:flex items-center gap-2 w-48 lg:w-64 h-9 rounded-md border bg-background px-3 text-sm text-muted-foreground hover:bg-accent transition-colors"
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:hidden"
          onClick={() => window.dispatchEvent(new Event("mpsms:open-search"))}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleDarkMode}>
          <Sun className="h-5 w-5 dark:hidden" />
          <Moon className="h-5 w-5 hidden dark:block" />
        </Button>

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
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
