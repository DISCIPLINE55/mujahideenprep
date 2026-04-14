import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
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

function LoginPage() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex min-h-screen">
        {/* Left panel - branding */}
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

        {/* Right panel - form */}
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8 text-center">
              <img src={logoImg} alt="MPSMS Logo" className="mx-auto h-16 w-16 rounded-full shadow-md mb-3" />
              <h2 className="text-xl font-bold text-foreground">MPSMS</h2>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-muted-foreground mb-8">Sign in to your account</p>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                localStorage.setItem("mpsms_auth", JSON.stringify({ loggedIn: true, role: "admin", name: "Admin" }));
                window.location.href = "/dashboard";
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="admin@mpsms.edu.gh" className="pl-9" defaultValue="admin@mpsms.edu.gh" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs text-secondary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-9" defaultValue="admin123" />
                </div>
              </div>

              <Button type="submit" className="w-full h-10">
                Sign In
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              © 2026 Mujahideen Preparatory School • ESTD 1997
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
