import { Bell, Lock, Palette, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import AppearanceSettings from "./AppearanceSettings";
import NotificationSettings from "./NotificationSettings";
import ProfileSettings from "./ProfileSettings";
import SecuritySettings from "./SecuritySettings";

interface SettingsPanelProps {
  user: {
    full_name: string;
    email: string;
    role: string;
  };
}

const tabs = [
  { value: "profile", label: "Profile", icon: UserRound },
  { value: "appearance", label: "Appearance", icon: Palette },
  { value: "security", label: "Security", icon: Lock },
  { value: "notifications", label: "Notifications", icon: Bell },
] as const;

export default function SettingsPanel({ user }: SettingsPanelProps) {
  return (
    <div className="  space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand mb-1">
          Account
        </p>
        <h2 className="text-2xl font-bold text-text-main tracking-tight">
          Settings
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Manage your profile, appearance, security, and notification preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="gap-6">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-0 rounded-none border-b border-border-main bg-transparent p-0"
        >
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="relative mb-4 h-10 flex-none cursor-pointer rounded-none border-0 bg-transparent px-4 text-text-muted shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand after:opacity-0 after:transition-opacity data-active:bg-transparent data-active:text-brand data-active:shadow-none data-active:after:opacity-100"
            >
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-0 outline-none">
          <ProfileSettings
            fullName={user.full_name}
            email={user.email}
            role={user.role}
          />
        </TabsContent>

        <TabsContent value="appearance" className="mt-0 outline-none">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="security" className="mt-0 outline-none">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-0 outline-none">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
