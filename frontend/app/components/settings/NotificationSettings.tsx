import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";

const notificationRows = [
  {
    id: "email-digest",
    title: "Weekly email digest",
    description: "Summary of organization activity every Monday.",
    defaultChecked: true,
  },
  {
    id: "product-updates",
    title: "Product updates",
    description: "New features and platform announcements.",
    defaultChecked: true,
  },
  {
    id: "security-notices",
    title: "Security notices",
    description: "Critical alerts about account or tenant access.",
    defaultChecked: true,
  },
  {
    id: "billing-reminders",
    title: "Billing reminders",
    description: "Invoices, renewals, and payment failures.",
    defaultChecked: false,
  },
] as const;

export default function NotificationSettings() {
  return (
    <div className="space-y-6">
      <Card className="bg-panel-bg text-text-main ring-border-main">
        <CardHeader className="border-b border-border-main">
          <CardTitle className="text-text-main">Email notifications</CardTitle>
          <CardDescription className="text-text-muted">
            Choose which messages reach your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {notificationRows.map((row, index) => (
            <div key={row.id}>
              {index > 0 && <Separator className="mb-4 bg-border-main" />}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor={row.id}>{row.title}</Label>
                  <p className="text-xs text-text-muted">{row.description}</p>
                </div>
                <Switch id={row.id} defaultChecked={row.defaultChecked} />
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-end bg-transparent border-border-main">
          <Button type="button">Save notification preferences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
