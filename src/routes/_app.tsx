import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { getAuth, type AuthState } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AuthGuardLayout,
});

function AuthGuardLayout() {
  const navigate = useNavigate();
  const [auth, setAuthState] = useState<AuthState | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const a = getAuth();
    if (!a) {
      navigate({ to: "/" });
      return;
    }
    setAuthState(a);
    setChecked(true);
  }, [navigate]);

  if (!checked || !auth) return null;
  return <DashboardLayout role={auth.role} name={auth.name} />;
}
