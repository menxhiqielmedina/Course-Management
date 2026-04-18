import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ShieldCheck, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/hooks/use-toast";
import type { Role } from "@/data/mockData";

const roles: { id: Role; label: string; icon: typeof ShieldCheck; email: string }[] = [
  { id: "admin", label: "Admin", icon: ShieldCheck, email: "admin@university.edu" },
  { id: "professor", label: "Professor", icon: BookOpen, email: "e.hayes@university.edu" },
  { id: "student", label: "Student", icon: User, email: "alice.johnson@university.edu" },
];

const Login = () => {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("admin@university.edu");
  const [password, setPassword] = useState("demo1234");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSelectRole = (r: typeof roles[number]) => {
    setRole(r.id);
    setEmail(r.email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.includes("@")) errs.email = "Enter a valid email";
    if (password.length < 6) errs.password = "At least 6 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    login(email, role);
    toast({ title: "Welcome back!", description: `Signed in as ${role}.` });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero side */}
      <div className="hidden lg:flex relative gradient-hero text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 40%)",
        }} />
        <div className="relative flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-bold text-lg">Acadia CMS</span>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-5xl font-bold leading-tight">
            The modern platform for academic excellence.
          </h1>
          <p className="text-lg opacity-90 max-w-md">
            Manage courses, students, professors and schedules — all in one elegant, presentation-ready dashboard.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-md">
            {[
              { v: "12K+", l: "Students" },
              { v: "450+", l: "Courses" },
              { v: "98%", l: "Satisfaction" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-3xl font-bold">{s.v}</div>
                <div className="text-xs opacity-80 uppercase tracking-wider">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs opacity-70">© 2025 Acadia University Platform</div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">Acadia CMS</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sign in to your account</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Choose your role to continue. This is a demo — no real auth.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRole(r)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition ${
                  role === r.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <r.icon className={`h-5 w-5 ${role === r.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-medium">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" onClick={() => navigate("/forgot-password")} className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition shadow-glow" size="lg">
              Sign in
            </Button>
          </form>

          <Card className="bg-muted/40 border-dashed">
            <CardContent className="p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Demo mode:</strong> Click any role above to auto-fill credentials, then sign in.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
