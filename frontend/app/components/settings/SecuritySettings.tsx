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
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";

export default function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card className="bg-panel-bg text-text-main ring-border-main">
        <CardHeader className="border-b border-border-main">
          <CardTitle className="text-text-main">Change password</CardTitle>
          <CardDescription className="text-text-muted">
            Use a strong password you do not reuse on other sites.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current password</Label>
            <Input
              id="current_password"
              name="current_password"
              type="password"
              placeholder="••••••••"
              className="bg-input-bg border-border-main h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              placeholder="••••••••"
              className="bg-input-bg border-border-main h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="••••••••"
              className="bg-input-bg border-border-main h-10"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end bg-transparent border-border-main">
          <Button type="button">Update password</Button>
        </CardFooter>
      </Card>

      <Card className="bg-panel-bg text-text-main ring-border-main">
        <CardHeader className="border-b border-border-main">
          <CardTitle className="text-text-main">Session & access</CardTitle>
          <CardDescription className="text-text-muted">
            Extra protections for your administrator account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="two-factor">Two-factor authentication</Label>
              <p className="text-xs text-text-muted">
                Require a second step when signing in.
              </p>
            </div>
            <Switch id="two-factor" />
          </div>
          <Separator className="bg-border-main" />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="login-alerts">Login alerts</Label>
              <p className="text-xs text-text-muted">
                Email me when a new device signs in.
              </p>
            </div>
            <Switch id="login-alerts" defaultChecked />
          </div>
        </CardContent>
        <CardFooter className="justify-between gap-2 bg-transparent border-border-main">
          <Button variant="destructive" type="button">
            Sign out all devices
          </Button>
          <Button type="button">Save security settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
