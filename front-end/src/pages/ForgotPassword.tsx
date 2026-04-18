import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    setError("");
    setSent(true);
    toast({ title: "Reset link sent (simulated)", description: `If ${email} exists, you will receive a link.` });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 gradient-subtle">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader>
          <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2" onClick={() => navigate("/login")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
          </Button>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            Enter the email associated with your account and we'll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" size="lg">
                Send reset link
              </Button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <MailCheck className="h-7 w-7 text-success" />
              </div>
              <h3 className="font-semibold">Check your inbox</h3>
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to <strong>{email}</strong>.
              </p>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Return to login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
