import Button from "../../button/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  description: string;
  loading?: boolean;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  open,
  title,
  description,
  loading = false,
  confirmLabel = "Yes, delete",
  confirmVariant = "danger",
  onOpenChange,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (loading && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-panel-bg text-text-main sm:max-w-md p-0 gap-0"
        showCloseButton={!loading}
      >
        <DialogHeader className="border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mx-0 mb-0 rounded-none border-border-main bg-transparent px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="px-5 py-2.5 text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            loading={loading}
            onClick={onConfirm}
            className={
              confirmVariant === "danger"
                ? "border border-danger-border bg-danger px-5 py-2.5 text-sm text-white hover:bg-danger/90 hover:text-white"
                : "px-5 py-2.5 text-sm"
            }
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
