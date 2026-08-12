import { Building2, Globe, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { getAccessToken } from "../../store/auth";
import {
  commitOrganizationLogo,
  discardOrganizationLogoStaging,
  updateOrganization,
  uploadOrganizationLogoStaging,
  type LogoStagingPayload,
  type OrganizationPayload,
} from "../../store/organization";
import Button from "../button/Button";
import Input from "../input/Input";

interface AdminOrganizationPanelProps {
  org: OrganizationPayload | null;
  onOrgChange?: (org: OrganizationPayload) => void;
}

export default function AdminOrganizationPanel({
  org,
  onOrgChange,
}: AdminOrganizationPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingLogoRef = useRef<LogoStagingPayload | null>(null);
  const localPreviewRef = useRef<string | null>(null);
  const orgRef = useRef(org);

  const [form, setForm] = useState({ name: "", domain: "" });
  const [pendingLogo, setPendingLogo] = useState<LogoStagingPayload | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isRemovingLogo, setIsRemovingLogo] = useState(false);

  orgRef.current = org;
  pendingLogoRef.current = pendingLogo;

  const discardPendingLogo = useCallback(async (logo: LogoStagingPayload | null) => {
    if (!logo) return;

    const token = getAccessToken();
    if (!token) return;

    await discardOrganizationLogoStaging(token, logo.logo_public_id);
  }, []);

  const clearLocalPreview = useCallback(() => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = null;
    }
    setLocalPreview(null);
  }, []);

  useEffect(() => {
    if (!org) return;
    setForm({ name: org.name, domain: org.domain });
    setPendingLogo(null);
    setLogoRemoved(false);
    clearLocalPreview();
    setSavedMessage("");
    setErrorMessage("");
  }, [org, clearLocalPreview]);

  useEffect(() => {
    return () => {
      void discardPendingLogo(pendingLogoRef.current).catch(() => undefined);
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
      }
    };
  }, [discardPendingLogo]);

  const initialName = org?.name ?? "";
  const initialDomain = org?.domain ?? "";
  const hasLogoChanges = pendingLogo !== null || logoRemoved;
  const isDirty =
    form.name.trim() !== initialName ||
    form.domain.trim() !== initialDomain ||
    hasLogoChanges;

  const displayedLogo =
    localPreview ||
    pendingLogo?.logo_url ||
    (!logoRemoved && org?.logo_url ? org.logo_url : null);

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Logo file must be 2MB or smaller.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setErrorMessage("Authentication session expired. Please sign in again.");
      return;
    }

    const previousPending = pendingLogo;
    const previewUrl = URL.createObjectURL(file);

    clearLocalPreview();
    localPreviewRef.current = previewUrl;
    setLocalPreview(previewUrl);
    setIsUploadingLogo(true);
    setSavedMessage("");
    setErrorMessage("");

    try {
      const uploaded = await uploadOrganizationLogoStaging(token, file);
      setPendingLogo(uploaded);
      setLogoRemoved(false);
      clearLocalPreview();

      if (previousPending) {
        void discardPendingLogo(previousPending).catch(() => undefined);
      }
    } catch (error) {
      clearLocalPreview();
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload organization logo.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setSavedMessage("");
    setErrorMessage("");
    setIsRemovingLogo(true);

    try {
      if (pendingLogo) {
        const token = getAccessToken();
        if (!token) {
          setErrorMessage("Authentication session expired. Please sign in again.");
          return;
        }

        await discardPendingLogo(pendingLogo);
        setPendingLogo(null);
        clearLocalPreview();
        setLogoRemoved(false);
      } else if (org?.logo_url) {
        setLogoRemoved(true);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to remove organization logo.",
      );
    } finally {
      setIsRemovingLogo(false);
    }
  };

  const handleReset = async () => {
    if (!org) return;

    setSavedMessage("");
    setErrorMessage("");

    try {
      if (pendingLogo) {
        await discardPendingLogo(pendingLogo);
      }

      setForm({ name: org.name, domain: org.domain });
      setPendingLogo(null);
      setLogoRemoved(false);
      clearLocalPreview();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to reset organization changes.",
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!org) return;

    const token = getAccessToken();
    if (!token) {
      setErrorMessage("Authentication session expired. Please sign in again.");
      return;
    }

    setIsSaving(true);
    setSavedMessage("");
    setErrorMessage("");

    try {
      let updatedOrg: OrganizationPayload = org;

      if (
        form.name.trim() !== initialName ||
        form.domain.trim() !== initialDomain
      ) {
        updatedOrg = await updateOrganization(token, {
          name: form.name.trim(),
          domain: form.domain.trim(),
        });
      }

      if (hasLogoChanges) {
        updatedOrg = await commitOrganizationLogo(
          token,
          pendingLogo
            ? {
                logo_url: pendingLogo.logo_url,
                logo_public_id: pendingLogo.logo_public_id,
              }
            : null,
        );
      }

      onOrgChange?.(updatedOrg);
      setPendingLogo(null);
      setLogoRemoved(false);
      clearLocalPreview();
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSavedMessage("Organization details saved successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save organization details.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!org) {
    return (
      <div className="w-full">
        <div className="dashboard-card flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border-main bg-brand-soft text-brand shadow-sm">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-text-main">No organization linked</h2>
          <p className="mt-2 max-w-md text-sm text-text-muted">
            Your account is not associated with a school workspace yet.
          </p>
        </div>
      </div>
    );
  }

  const logoFallback = form.name.trim().charAt(0).toUpperCase() || "O";

  return (
    <div className="w-full space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-[28px]">
          Organization
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Update your school name, domain, and logo.
        </p>
      </div>

      {savedMessage && (
        <div className="rounded-xl border border-success-border bg-success-bg px-4 py-3.5 text-sm text-success">
          {savedMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3.5 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="dashboard-card overflow-hidden">
        <div className="border-b border-border-main/60 p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold text-text-main">School logo</h2>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border-main bg-brand-soft text-2xl font-bold text-brand">
              {displayedLogo ? (
                <>
                  <img
                    src={displayedLogo}
                    alt="Organization logo"
                    className={`h-full w-full object-cover  ${isUploadingLogo ? "opacity-60" : ""}`}
                  />
                  {isUploadingLogo && (
                    <Loader2 className="absolute h-7 w-7 animate-spin text-brand" />
                  )}
                </>
              ) : (
                logoFallback
              )}
            </div>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoChange}
                disabled={isUploadingLogo || isSaving || isRemovingLogo}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="px-4 py-2 text-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo || isSaving || isRemovingLogo}
                >
                  <ImagePlus className="h-4 w-4" />
                  {isUploadingLogo ? "Uploading..." : "Upload logo"}
                </Button>
                {displayedLogo && !isUploadingLogo && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-4 py-2 text-sm"
                    onClick={handleRemoveLogo}
                    disabled={isUploadingLogo || isSaving || isRemovingLogo}
                  >
                    <Trash2 className="h-4 w-4" />
                    {isRemovingLogo ? "Removing..." : "Remove"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-text-muted">PNG, JPG, WEBP, or SVG up to 2MB.</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <Input
            label="Organization name"
            name="organization_name"
            value={form.name}
            onChange={(event) => {
              setForm((current) => ({ ...current, name: event.target.value }));
              setSavedMessage("");
              setErrorMessage("");
            }}
            placeholder="e.g. Opelae High School"
            leftIcon={<Building2 className="h-4 w-4" />}
            className="rounded-md py-2.5 text-sm"
            required
          />

          <Input
            label="Domain"
            name="organization_domain"
            value={form.domain}
            onChange={(event) => {
              setForm((current) => ({ ...current, domain: event.target.value }));
              setSavedMessage("");
              setErrorMessage("");
            }}
            placeholder="e.g. opelae-high.edu"
            leftIcon={<Globe className="h-4 w-4" />}
            className="rounded-md py-2.5 text-sm"
            required
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border-main/60 p-5 sm:flex-row sm:justify-end sm:p-6">
          <Button
            type="button"
            variant="outline"
            className="px-5 py-2.5 text-sm"
            onClick={handleReset}
            disabled={!isDirty || isSaving || isUploadingLogo}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-5 py-2.5 text-sm"
            loading={isSaving}
            disabled={!isDirty || !form.name.trim() || !form.domain.trim() || isUploadingLogo}
          >
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
