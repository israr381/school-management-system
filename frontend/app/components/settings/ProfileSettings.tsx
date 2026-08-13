import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { getAccessToken } from "../../store/auth";
import {
  commitUserAvatar,
  discardUserAvatarStaging,
  uploadUserAvatarStaging,
  type AvatarStagingPayload,
  type UserPayload,
} from "../../store/user";
import { toast } from "../toast/toast";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import Input from "~/components/input/Input";
import { Label } from "~/components/ui/label";
import UserAvatar from "./UserAvatar";

interface ProfileSettingsProps {
  user: {
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
  };
  onUserChange?: (user: UserPayload) => void;
}

export default function ProfileSettings({ user, onUserChange }: ProfileSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAvatarRef = useRef<AvatarStagingPayload | null>(null);
  const localPreviewRef = useRef<string | null>(null);

  const [pendingAvatar, setPendingAvatar] = useState<AvatarStagingPayload | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  pendingAvatarRef.current = pendingAvatar;

  const discardPendingAvatar = useCallback(async (avatar: AvatarStagingPayload | null) => {
    if (!avatar) return;

    const token = getAccessToken();
    if (!token) return;

    await discardUserAvatarStaging(token, avatar.avatar_public_id);
  }, []);

  const clearLocalPreview = useCallback(() => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = null;
    }
    setLocalPreview(null);
  }, []);

  useEffect(() => {
    setPendingAvatar(null);
    setAvatarRemoved(false);
    clearLocalPreview();
  }, [user.avatar_url, clearLocalPreview]);

  useEffect(() => {
    return () => {
      void discardPendingAvatar(pendingAvatarRef.current).catch(() => undefined);
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
      }
    };
  }, [discardPendingAvatar]);

  const hasAvatarChanges = pendingAvatar !== null || avatarRemoved;
  const displayedAvatar =
    localPreview ||
    pendingAvatar?.avatar_url ||
    (!avatarRemoved && user.avatar_url ? user.avatar_url : null);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile photo must be 2MB or smaller.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }

    const previousPending = pendingAvatar;
    const previewUrl = URL.createObjectURL(file);

    clearLocalPreview();
    localPreviewRef.current = previewUrl;
    setLocalPreview(previewUrl);
    setIsUploadingAvatar(true);

    try {
      const uploaded = await uploadUserAvatarStaging(token, file);
      setPendingAvatar(uploaded);
      setAvatarRemoved(false);
      clearLocalPreview();

      if (previousPending) {
        void discardPendingAvatar(previousPending).catch(() => undefined);
      }
    } catch (error) {
      clearLocalPreview();
      toast.error(
        error instanceof Error ? error.message : "Failed to upload profile photo.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true);

    try {
      if (pendingAvatar) {
        const token = getAccessToken();
        if (!token) {
          toast.error("Authentication session expired. Please sign in again.");
          return;
        }

        await discardPendingAvatar(pendingAvatar);
        setPendingAvatar(null);
        clearLocalPreview();
        setAvatarRemoved(false);
      } else if (user.avatar_url) {
        setAvatarRemoved(true);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove profile photo.",
      );
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const handleReset = async () => {
    try {
      if (pendingAvatar) {
        await discardPendingAvatar(pendingAvatar);
      }

      setPendingAvatar(null);
      setAvatarRemoved(false);
      clearLocalPreview();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset profile photo.",
      );
    }
  };

  const handleSaveAvatar = async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = await commitUserAvatar(
        token,
        pendingAvatar
          ? {
              avatar_url: pendingAvatar.avatar_url,
              avatar_public_id: pendingAvatar.avatar_public_id,
            }
          : null,
      );

      onUserChange?.(updatedUser);
      setPendingAvatar(null);
      setAvatarRemoved(false);
      clearLocalPreview();
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Profile photo saved successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile photo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isBusy = isUploadingAvatar || isSaving || isRemovingAvatar;

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
                defaultValue={user.full_name}
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
                defaultValue={user.email}
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
              defaultValue={user.role.replace("_", " ")}
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
          <div className="relative">
            <UserAvatar
              name={user.full_name}
              avatarUrl={displayedAvatar}
              className="h-16 w-16 text-lg"
              uploading={isUploadingAvatar}
            />
            {isUploadingAvatar && (
              <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-white" />
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={isBusy}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
              >
                <ImagePlus className="h-4 w-4" />
                {isUploadingAvatar ? "Uploading..." : "Upload photo"}
              </Button>
              {displayedAvatar && !isUploadingAvatar && (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isBusy}
                >
                  <Trash2 className="h-4 w-4" />
                  {isRemovingAvatar ? "Removing..." : "Remove"}
                </Button>
              )}
            </div>
            <p className="text-xs text-text-muted">PNG, JPG, WEBP, or SVG up to 2MB.</p>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2 bg-transparent border-border-main">
          <Button
            variant="outline"
            type="button"
            onClick={handleReset}
            disabled={!hasAvatarChanges || isBusy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveAvatar}
            disabled={!hasAvatarChanges || isUploadingAvatar}
          >
            {isSaving ? "Saving..." : "Save photo"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
