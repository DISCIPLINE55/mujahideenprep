import { Outlet, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app")({
  component: AuthGuardLayout,
});

function AuthGuardLayout() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("mpsms_auth") : null;
      if (!raw) {
        navigate({ to: "/" });
        return;
      }
      const auth = JSON.parse(raw);
      if (!auth.loggedIn) {
        navigate({ to: "/" });
        return;
      }
    } catch {
      navigate({ to: "/" });
      return;
    }
    setChecked(true);
  }, [navigate]);

  if (!checked) return null;
  return <DashboardLayout />;
}
