import { useNavigate, useLocation } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { getAuth, getAuthSync, ROLE_NAV, type AuthState, type UserRole } from "@/lib/auth";
import { syncCloudToLocal } from "@/lib/storage";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/_app")({
  component: AuthGuardLayout,
});

// Routes not in ROLE_NAV but still allowed for specific roles
const EXTRA_ALLOWED: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/students/", roles: ["admin"] }, // student detail
  { prefix: "/teachers/", roles: ["admin"] }, // teacher detail
];

function isRouteAllowed(pathname: string, role: UserRole): boolean {
  // Match against ROLE_NAV (exact or prefix match for nested)
  const navMatch = ROLE_NAV.find((item) =>
    pathname === item.to || pathname.startsWith(item.to + "/")
  );
  if (navMatch) return navMatch.roles.includes(role);
  // Check extra allowed prefixes
  const extra = EXTRA_ALLOWED.find((e) => pathname.startsWith(e.prefix));
  if (extra) return extra.roles.includes(role);
  return true; // unknown route — let 404 handle it
}

function defaultDashboard(role: UserRole): string {
  if (role === "teacher") return "/teacher-dashboard";
  if (role === "parent") return "/parent-dashboard";
  return "/dashboard";
}

function AuthLoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "Securing school portal...",
    "Verifying credentials...",
    "Connecting to database...",
    "Welcome back to Mujahideen Prep..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_50%,var(--color-primary)/0.08,transparent_60%)] p-6">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card/60 p-8 text-center shadow-2xl backdrop-blur-xl transition-all">
        {/* Decorative glowing backdrops */}
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
        <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-secondary/15 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo container with pulse animation */}
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-75" />
            <img
              src={logoImg}
              alt="School Logo"
              className="relative h-20 w-20 rounded-full border-2 border-primary/20 shadow-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>

          {/* School Name */}
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Mujahideen Preparatory School
          </h2>
          <p className="mt-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            School Management System
          </p>

          {/* Dual spinning ring loader */}
          <div className="relative mt-8 mb-6 h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent" />
            <div className="absolute inset-2 animate-spin rounded-full border-4 border-b-secondary border-t-transparent border-r-transparent border-l-transparent" style={{ animationDirection: "reverse", animationDuration: "1s" }} />
          </div>

          {/* Dynamic loading text */}
          <p className="min-h-5 text-sm font-medium text-foreground/80 transition-opacity duration-300 animate-pulse">
            {messages[msgIdx]}
          </p>

          {/* School Motto */}
          <p className="mt-8 text-xs italic text-muted-foreground/60 border-t border-border/50 pt-4 w-full">
            "God Fearing and Better Future Starts Here"
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthGuardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [auth, setAuthState] = useState<AuthState | null>(() => getAuthSync());
  const [checked, setChecked] = useState(!!getAuthSync());

  useEffect(() => {
    async function verify() {
      try {
        const a = await getAuth();
        if (!a) {
          localStorage.removeItem("mpsms_auth_meta");
          navigate({ to: "/" });
          return;
        }
        setAuthState(a);
        setChecked(true);
        // Background sync: pull cloud data into localStorage cache
        syncCloudToLocal().catch(console.error);
      } catch (err) {
        console.error("Auth verification failed:", err);
        localStorage.removeItem("mpsms_auth_meta");
        navigate({ to: "/" });
      }
    }
    verify();
  }, [navigate]);

  // Enforce role-based route access on every navigation
  useEffect(() => {
    if (!auth) return;
    if (!isRouteAllowed(location.pathname, auth.role)) {
      toast.error("You don't have permission to access that page.");
      navigate({ to: defaultDashboard(auth.role) });
    }
  }, [auth, location.pathname, navigate]);

  if (!checked || !auth) {
    return <AuthLoadingScreen />;
  }

  if (!isRouteAllowed(location.pathname, auth.role)) {
    return <AuthLoadingScreen />;
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <DashboardLayout role={auth.role} name={auth.name} />
    </>
  );
}
