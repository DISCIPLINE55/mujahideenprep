import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery hash and emits PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also check existing session in case event already fired
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <img src={logoImg} alt="MPSMS" className="mx-auto h-16 w-16 rounded-full mb-3" />
            <h1 className="text-xl font-bold">Reset your password</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter a new password for your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!ready} />
            </div>
            <div className="space-y-2">
              <Label>Confirm password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!ready} />
            </div>
            <Button type="submit" className="w-full" disabled={!ready || loading}>
              {loading ? "Updating..." : ready ? "Update password" : "Verifying link..."}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}