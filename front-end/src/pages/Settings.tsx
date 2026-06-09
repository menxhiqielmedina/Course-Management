import { useEffect, useState } from "react";
import { Loader2, Moon, Sun } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/hooks/use-toast";
import { getMyProfile, updateMyProfile } from "@/api/profileApi";
import api from "@/lib/api";

const Settings = () => {
  const { user, theme, toggleTheme } = useAppStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        setFullName(p.fullName);
        setEmail(p.email);
      })
      .catch(() => {
        setFullName(user?.name ?? "");
        setEmail(user?.email ?? "");
      })
      .finally(() => setProfileLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast({ title: "Name and email are required.", variant: "destructive" });
      return;
    }
    setProfileSaving(true);
    try {
      const updated = await updateMyProfile({ fullName: fullName.trim(), email: email.trim() });
      useAppStore.setState((s) => ({
        user: s.user ? { ...s.user, name: updated.fullName, email: updated.email } : null,
      }));
      toast({ title: "Profile saved successfully." });
    } catch (e: any) {
      toast({ title: e?.response?.data?.message ?? "Failed to save profile.", variant: "destructive" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "All password fields are required.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setPasswordSaving(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast({ title: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast({ title: e?.response?.data?.message ?? "Failed to update password.", variant: "destructive" });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and preferences" />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full name</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Input value={user?.role ?? ""} disabled className="capitalize" />
                    </div>
                  </div>
                  <Button
                    className="gradient-primary text-primary-foreground"
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                  >
                    {profileSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save changes
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the platform looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <div>
                    <p className="font-medium">Dark mode</p>
                    <p className="text-xs text-muted-foreground">Easier on the eyes at night</p>
                  </div>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose what you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Email digest", "New assignments", "Grade updates", "Schedule changes", "System announcements"].map((label) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <Label>{label}</Label>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Current password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>New password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm new password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                className="gradient-primary text-primary-foreground"
                onClick={handleChangePassword}
                disabled={passwordSaving}
              >
                {passwordSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;