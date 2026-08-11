import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface ProfileSettingsProps {
  fullName?: string;
  email?: string;
  role?: string;
}

export default function ProfileSettings({
  fullName = "",
  email = "",
  role = "",
}: ProfileSettingsProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-panel-bg text-text-main ring-border-main">
        <CardHeader className="border-b border-border-main">
          <CardTitle className="text-text-main">Personal information</CardTitle>
          <CardDescription className="text-text-muted">
            Update your name and contact details used across the workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={fullName}
                placeholder="Your full name"
                className="bg-input-bg border-border-main h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={email}
                placeholder="you@school.edu"
                className="bg-input-bg border-border-main h-10"
              />
            </div>
          </div>
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              name="role"
              defaultValue={role.replace("_", " ")}
              disabled
              className="bg-surface-soft border-border-main h-10 capitalize"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2 bg-transparent border-border-main">
          <Button variant="outline" type="button">
            Cancel
          </Button>
          <Button type="button">Save changes</Button>
        </CardFooter>
      </Card>

      <Card className="bg-panel-bg text-text-main ring-border-main">
        <CardHeader className="border-b border-border-main">
          <CardTitle className="text-text-main">Profile photo</CardTitle>
          <CardDescription className="text-text-muted">
            This avatar appears in the header and member lists.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center pt-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-lg font-semibold text-brand">
            {(fullName || "U").charAt(0).toUpperCase()}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" type="button">
                Upload photo
              </Button>
              <Button variant="ghost" type="button">
                Remove
              </Button>
            </div>
            <p className="text-xs text-text-muted">JPG or PNG up to 2MB.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
