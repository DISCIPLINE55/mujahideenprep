import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — MPSMS" },
      { name: "description", content: "Mujahideen Preparatory School Management System Login" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,oklch(0.55_0.16_160/0.4),transparent_60%)]" />
        <div className="relative z-10 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 mb-8">
            <GraduationCap className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-3">
            Mujahideen Preparatory School
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-1">
            Mankessim, Central Region, Ghana
          </p>
          <p className="text-primary-foreground/60 text-sm max-w-md">
            Creche • Nursery • Kindergarten • Primary • JHS
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-primary-foreground/70 text-sm">
            <div>
              <p className="text-2xl font-bold text-primary-foreground">500+</p>
              <p>Students</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-foreground">30+</p>
              <p>Teachers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-foreground">15</p>
              <p>Classes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-3">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">MPSMS</h2>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your account</p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/dashboard";
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="admin@mpsms.edu.gh" className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-9" />
              </div>
            </div>

            <Button type="submit" className="w-full h-10">
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 Mujahideen Preparatory School
          </p>
        </div>
      </div>
    </div>
  );
}
