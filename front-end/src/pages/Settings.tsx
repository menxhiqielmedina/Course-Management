import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/hooks/use-toast";
import { Moon, Sun } from "lucide-react";

const Settings = () => {
  const { user, theme, toggleTheme } = useAppStore();

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
            <CardHeader><CardTitle>Profile information</CardTitle><CardDescription>Update your personal details</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Full name</Label><Input defaultValue={user?.name} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={user?.email} /></div>
                <div className="space-y-1.5"><Label>Role</Label><Input value={user?.role} disabled className="capitalize" /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input placeholder="+1 555 0123" /></div>
              </div>
              <Button className="gradient-primary text-primary-foreground" onClick={() => toast({ title: "Profile saved (simulated)" })}>Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Customize how the platform looks</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <div><p className="font-medium">Dark mode</p><p className="text-xs text-muted-foreground">Easier on the eyes at night</p></div>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Choose what you want to be notified about</CardDescription></CardHeader>
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
              <div className="space-y-1.5"><Label>Current password</Label><Input type="password" /></div>
              <div className="space-y-1.5"><Label>New password</Label><Input type="password" /></div>
              <div className="space-y-1.5"><Label>Confirm new password</Label><Input type="password" /></div>
              <Button className="gradient-primary text-primary-foreground" onClick={() => toast({ title: "Password updated (simulated)" })}>Update password</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
