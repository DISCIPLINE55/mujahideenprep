import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Lock, Mail, ShieldCheck, GraduationCap, Users } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ROLE_CREDENTIALS, setAuth, type UserRole, type AuthState } from "@/lib/auth";
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
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState(ROLE_CREDENTIALS.admin.email);
  const [password, setPassword] = useState(ROLE_CREDENTIALS.admin.password);

  function handleRoleSelect(role: UserRole) {
    setSelectedRole(role);
    setEmail(ROLE_CREDENTIALS[role].email);
    setPassword(ROLE_CREDENTIALS[role].password);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const creds = ROLE_CREDENTIALS[selectedRole];
    if (email !== creds.email || password !== creds.password) {
      toast.error("Invalid credentials. Use the default credentials for the selected role.");
      return;
    }
    const auth: AuthState = {
      loggedIn: true,
      role: selectedRole,
      name: creds.name,
      email: creds.email,
      teacherId: creds.teacherId,
      studentIds: creds.studentIds,
    };
    setAuth(auth);
    const dest = selectedRole === "teacher" ? "/teacher-dashboard" : selectedRole === "parent" ? "/parent-dashboard" : "/dashboard";
    window.location.href = dest;
  }

  function handleForgotPassword() {
    if (!resetEmail.trim() || !/\S+@\S+\.\S+/.test(resetEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("Password reset link sent! Check your email.");
    setForgotOpen(false);
    setResetEmail("");
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
            <div className="grid grid-cols-3 gap-6 text-primary-foreground/70 text-sm">
              <div>
                <p className="text-2xl font-bold text-primary-foreground">500+</p>
                <p>Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">30+</p>
                <p>Teachers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">14</p>
                <p>Classes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8 text-center">
              <img src={logoImg} alt="MPSMS Logo" className="mx-auto h-16 w-16 rounded-full shadow-md mb-3" />
              <h2 className="text-xl font-bold text-foreground">MPSMS</h2>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-muted-foreground mb-6">Select your role and sign in</p>

            {/* Role selector */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleRoleSelect(r.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all text-center",
                    selectedRole === r.key
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <r.icon className={cn("h-5 w-5", selectedRole === r.key ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-xs font-semibold", selectedRole === r.key ? "text-primary" : "text-foreground")}>{r.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{r.desc}</span>
                </button>
              ))}
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
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

              <Button type="submit" className="w-full h-10">
                Sign In as {ROLES.find((r) => r.key === selectedRole)?.label}
              </Button>
            </form>

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
              <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="admin@mpsms.edu.gh" />
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
