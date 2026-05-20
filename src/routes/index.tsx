import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Lock, Mail, ShieldCheck, GraduationCap, Users } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type UserRole, type AuthState, getAuthSync } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — MPSMS | Mujahideen Preparatory School" },
      { name: "description", content: "Sign in to the Mujahideen Preparatory School Management System (MPSMS). Manage students, teachers, attendance, results, and fees." },
      { property: "og:title", content: "MPSMS — School Management Login" },
      { property: "og:description", content: "Mujahideen Preparatory School Management System. Mankessim, Central Region, Ghana." },
    ],
  }),
  component: LoginPage,
});

const ROLES: { key: UserRole; label: string; icon: typeof ShieldCheck; desc: string }[] = [
  { key: "admin", label: "Admin", icon: ShieldCheck, desc: "Full system access" },
  { key: "teacher", label: "Teacher", icon: GraduationCap, desc: "Classes & attendance" },
  { key: "parent", label: "Parent", icon: Users, desc: "View child's records" },
];

function LoginPage() {
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Redirect instantly if user session already exists locally
  useEffect(() => {
    const auth = getAuthSync();
    if (auth && auth.loggedIn) {
      const dest = auth.role === "teacher" ? "/teacher-dashboard" : auth.role === "parent" ? "/parent-dashboard" : "/dashboard";
      window.location.href = dest;
    }
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        toast.success("Account created! Please check your email for confirmation.");
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          toast.success("Logged in successfully!");
          // Fetch role from user_roles table (single source of truth)
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id);
          const role = roles?.[0]?.role || data.user.user_metadata.role || "parent";
          const dest = role === "teacher" ? "/teacher-dashboard" : role === "parent" ? "/parent-dashboard" : "/dashboard";
          window.location.href = dest;
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!resetEmail.trim() || !/\S+@\S+\.\S+/.test(resetEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent! Check your email.");
      setForgotOpen(false);
      setResetEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    }
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,oklch(0.55_0.22_340/0.3),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,oklch(0.85_0.20_130/0.15),transparent_50%)]" />
          <div className="relative z-10 text-center">
            <img src={logoImg} alt="MPSMS Logo" className="mx-auto h-28 w-28 rounded-full border-4 border-primary-foreground/20 shadow-xl mb-6" />
            <h1 className="text-3xl font-bold text-primary-foreground mb-2">
              Mujahideen Preparatory School
            </h1>
            <p className="text-primary-foreground/80 text-lg mb-1">
              Mankessim, Central Region, Ghana
            </p>
            <p className="text-primary-foreground/50 text-sm italic mb-1">
              "God Fearing and Better Future Starts Here"
            </p>
            <p className="text-primary-foreground/40 text-xs mb-8">
              Established 1997 • Creche • Nursery • KG • Primary • JHS
            </p>
            <div className="mt-8 text-primary-foreground/70 text-sm max-w-md">
               <p className="font-medium mb-2">Excellence • Discipline • Faith</p>
               <p className="text-xs leading-relaxed opacity-60">
                 Dedicated to providing quality holistic education and character building for every child.
               </p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8 text-center">
              <img src={logoImg} alt="MPSMS Logo" className="mx-auto h-16 w-16 rounded-full shadow-md mb-3" />
              <h2 className="text-xl font-bold text-foreground">MPSMS</h2>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1">{isSignUp ? "Create Account" : "Welcome back"}</h2>
            <p className="text-muted-foreground mb-6">{isSignUp ? "Join the Mujahideen Prep system" : "Select your role and sign in"}</p>

            <form className="space-y-4" onSubmit={handleAuth}>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="fullName" type="text" className="pl-9" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs text-secondary hover:underline" onClick={() => setForgotOpen(true)}>
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? (isSignUp ? "Creating Account..." : "Signing In...") : (isSignUp ? "Create Account" : "Sign In")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)} 
                className="text-sm text-primary hover:underline"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              © 2026 Mujahideen Preparatory School • ESTD 1997
            </p>
          </div>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Enter your email address and we'll send you a password reset link.</p>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="mujahideen216@gmail.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotOpen(false)}>Cancel</Button>
            <Button onClick={handleForgotPassword}>Send Reset Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
