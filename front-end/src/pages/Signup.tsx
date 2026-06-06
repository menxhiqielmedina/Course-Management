import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerApi } from "@/lib/authService";
import { useDepartments } from "@/hooks/use-config";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const departments = useDepartments();
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    server?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs: typeof errors = {};
    if (!fullName.trim()) errs.fullName = "Full name is required";
    if (!email.includes("@")) errs.email = "Enter a valid email";
    if (password.length < 6) errs.password = "At least 6 characters";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await registerApi({ fullName: fullName.trim(), email: email.trim(), password, role: "student", department });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Something went wrong. Please try again.";
      setErrors({ server: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero side */}
      <div className="hidden lg:flex relative gradient-hero text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-bold text-lg">EduTrack</span>
        </div>
        <div className="relative space-y-4">
          <h1 className="text-5xl font-bold leading-tight">Join EduTrack today.</h1>
          <p className="text-lg opacity-90 max-w-md">
            Register as a student to access your courses, assignments, and schedule — all in one place.
          </p>
        </div>
        <div className="relative text-xs opacity-70">© 2025 EduTrack Platform</div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">EduTrack</span>
          </div>

          {submitted ? (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold">Registration submitted!</h2>
              <p className="text-muted-foreground">
                Your account is pending admin approval. You'll be able to sign in once an
                administrator reviews your request.
              </p>
              <Link to="/login" className="block mt-4">
                <Button variant="outline" className="w-full">
                  Back to Sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Student registration</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a student account. An admin will approve your request before you can sign in.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Smith"
                    disabled={loading}
                  />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    disabled={loading}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment} disabled={loading}>
                    <SelectTrigger id="department"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    disabled={loading}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                {errors.server && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {errors.server}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition shadow-glow"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loading ? "Submitting…" : "Request account"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;