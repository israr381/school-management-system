import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, BookMarked, GraduationCap, LayoutList, Lock, Palette, Shield, UserCheck, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { UserPayload } from "../../store/user";
import { usePermission } from "../../hooks/usePermission";
import Button from "../button/Button";
import PermissionGuard from "../auth/PermissionGuard";
import AppearanceSettings from "./AppearanceSettings";
import AssignClassSettings from "./AssignClassSettings";
import ClassesSettings from "./ClassesSettings";
import NotificationSettings from "./NotificationSettings";
import ProfileSettings from "./ProfileSettings";
import SectionsSettings from "./SectionsSettings";
import SecuritySettings from "./SecuritySettings";
import SubjectsSettings from "./SubjectsSettings";

interface SettingsPanelProps {
  user: {
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
  };
  onUserChange?: (user: UserPayload) => void;
}

const tabs = [
  { value: "profile", label: "Profile", icon: UserRound, permission: null },
  { value: "appearance", label: "Appearance", icon: Palette, permission: null },
  { value: "classes", label: "Classes", icon: GraduationCap, permission: "classes.view" },
  { value: "sections", label: "Sections", icon: LayoutList, permission: "sections.view" },
  { value: "subjects", label: "Subjects", icon: BookMarked, permission: "subjects.view" },
  { value: "assign-class", label: "Assign Class", icon: UserCheck, permission: "teachers.view" },
  { value: "security", label: "Security", icon: Lock, permission: null },
  { value: "notifications", label: "Notifications", icon: Bell, permission: null },
] as const;

export default function SettingsPanel({ user, onUserChange }: SettingsPanelProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const visibleTabs = tabs.filter((tab) => !tab.permission || hasPermission(tab.permission));
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["value"]>("profile");
  const currentTab = visibleTabs.some((tab) => tab.value === activeTab)
    ? activeTab
    : visibleTabs[0]?.value ?? "profile";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-main tracking-tight">
            Settings
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Manage your profile, classes, sections, subjects, teacher assignments, appearance, security, and notifications.
          </p>
        </div>
        <PermissionGuard permission="permissions.view">
          <Button
            type="button"
            variant="outline"
            className="px-5 py-2.5 text-sm"
            onClick={() => navigate("/settings/permissions")}
          >
            <Shield className="h-4 w-4" />
            Manage Permissions
          </Button>
        </PermissionGuard>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={(value) => setActiveTab(value as (typeof tabs)[number]["value"])}
        className="gap-6"
      >
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b border-border-main bg-transparent p-0"
        >
          {visibleTabs.map(({ value, label, icon: Icon }) => (
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

        {currentTab === "profile" && (
          <TabsContent value="profile" className="mt-0 outline-none">
            <ProfileSettings user={user} onUserChange={onUserChange} />
          </TabsContent>
        )}

        {currentTab === "appearance" && (
          <TabsContent value="appearance" className="mt-0 outline-none">
            <AppearanceSettings />
          </TabsContent>
        )}

        {currentTab === "classes" && hasPermission("classes.view") && (
          <TabsContent value="classes" className="mt-0 outline-none">
            <ClassesSettings />
          </TabsContent>
        )}

        {currentTab === "sections" && hasPermission("sections.view") && (
          <TabsContent value="sections" className="mt-0 outline-none">
            <SectionsSettings />
          </TabsContent>
        )}

        {currentTab === "subjects" && hasPermission("subjects.view") && (
          <TabsContent value="subjects" className="mt-0 outline-none">
            <SubjectsSettings />
          </TabsContent>
        )}

        {currentTab === "assign-class" && hasPermission("teachers.view") && (
          <TabsContent value="assign-class" className="mt-0 outline-none">
            <AssignClassSettings />
          </TabsContent>
        )}

        {currentTab === "security" && (
          <TabsContent value="security" className="mt-0 outline-none">
            <SecuritySettings />
          </TabsContent>
        )}

        {currentTab === "notifications" && (
          <TabsContent value="notifications" className="mt-0 outline-none">
            <NotificationSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
