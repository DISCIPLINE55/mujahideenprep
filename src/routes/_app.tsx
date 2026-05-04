import { useNavigate, useLocation } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { getAuth, getAuthSync, ROLE_NAV, type AuthState, type UserRole } from "@/lib/auth";
import { syncCloudToLocal } from "@/lib/storage";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

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

function AuthGuardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [auth, setAuthState] = useState<AuthState | null>(() => getAuthSync());
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function verify() {
      const a = await getAuth();
      if (!a) {
        navigate({ to: "/" });
        return;
      }
      setAuthState(a);
      setChecked(true);
      // Background sync: pull cloud data into localStorage cache
      syncCloudToLocal().catch(console.error);
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

  if (!checked || !auth) return null;
  if (!isRouteAllowed(location.pathname, auth.role)) return null;
  return (
    <>
      <Toaster position="top-right" richColors />
      <DashboardLayout role={auth.role} name={auth.name} />
    </>
  );
}
