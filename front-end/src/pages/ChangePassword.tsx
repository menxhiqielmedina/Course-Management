import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/useAppStore";
import { changePasswordApi } from "@/lib/authService";
import { toast } from "@/hooks/use-toast";

const ChangePassword = () => {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const clearMustChangePassword = useAppStore((s) => s.clearMustChangePassword);
  const logout = useAppStore((s) => s.logout);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{
    current?: string;
    next?: string;
    confirm?: string;
    server?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: typeof errors = {};
    if (!current) errs.current = "Enter your temporary password";
    if (next.length < 6) errs.next = "At least 6 characters";
    if (next === current) errs.next = "New password must differ from the temporary one";
    if (next !== confirm) errs.confirm = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await changePasswordApi(current, next);
      clearMustChangePassword();
      toast({ title: "Password updated", description: "You can use your new password next time you sign in." });
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to change password.";
      setErrors({ server: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold">EduTrack</span>
        </div>

        {/* Header */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Set your password</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Hi <span className="font-medium text-foreground">{user?.name}</span>, your account was
            created by an administrator with a temporary password. Please set a new password before
            continuing.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Temporary password</Label>
            <Input
              id="current"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="The password the admin gave you"
              disabled={loading}
            />
            {errors.current && <p className="text-xs text-destructive">{errors.current}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="next">New password</Label>
            <Input
              id="next"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Min. 6 characters"
              disabled={loading}
            />
            {errors.next && <p className="text-xs text-destructive">{errors.next}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              disabled={loading}
            />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
          </div>

          {errors.server && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {errors.server}
            </p>
          )}

          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition"
            size="lg"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Saving…" : "Set new password"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Wrong account?{" "}
          <button
            type="button"
            onClick={() => { logout(); navigate("/login"); }}
            className="text-primary hover:underline"
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
};

export default ChangePassword;
