import { useCallback, useEffect, useMemo, useState } from "react";
import { GraduationCap, LayoutList, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { getAccessToken } from "../../store/auth";
import { deleteClass, fetchClasses, type SchoolClass } from "../../store/classes";
import { toast } from "../toast/toast";
import Button from "../button/Button";
import ClassFormModal from "../modals/class-form/ClassFormModal";
import ConfirmDeleteModal from "../modals/confirm-delete/ConfirmDeleteModal";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import { Button as UiButton } from "~/components/ui/button";
import PermissionGuard from "../auth/PermissionGuard";

const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];

export default function ClassesSettings() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<SchoolClass | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadClasses = useCallback(async (force = false) => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const data = await fetchClasses(token, { force });
    setClasses(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await loadClasses();
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load classes.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadClasses]);

  const { paginatedItems, totalPages, safePage, startIndex, endIndex } = paginateItems(
    classes,
    currentPage,
    pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingClass(null);
  };

  const openEdit = (schoolClass: SchoolClass) => {
    setEditingClass(schoolClass);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingClass) return;

    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }

    setDeleting(true);
    try {
      await deleteClass(token, deletingClass.id);
      setDeletingClass(null);
      toast.success(`"${deletingClass.name}" was deleted.`);
      void loadClasses(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete class.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<TableColumn<SchoolClass>[]>(
    () => [
      {
        key: "name",
        header: "Class",
        sortable: true,
        sortValue: (row) => row.name,
        render: (row) => <span className="font-semibold text-text-main">{row.name}</span>,
      },
      {
        key: "description",
        header: "Description",
        sortable: true,
        sortValue: (row) => row.description ?? "",
        render: (row) => (
          <span className="max-w-xs truncate font-medium text-text-muted">
            {row.description || "—"}
          </span>
        ),
      },
      {
        key: "section_count",
        header: "Sections",
        sortable: true,
        sortValue: (row) => row.section_count ?? 0,
        render: (row) => (
          <span className="inline-flex items-center gap-1.5 font-semibold text-text-main">
            <LayoutList className="h-3.5 w-3.5 text-brand" />
            {row.section_count ?? 0}
          </span>
        ),
      },
      {
        key: "student_count",
        header: "Students",
        sortable: true,
        sortValue: (row) => row.student_count ?? 0,
        render: (row) => (
          <span className="inline-flex items-center gap-1.5 font-semibold text-text-main">
            <Users className="h-3.5 w-3.5 text-brand" />
            {row.student_count ?? 0}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (row) => (
          <div className="flex justify-end gap-1">
            <PermissionGuard permission="classes.update">
              <UiButton
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer text-text-muted hover:bg-surface-soft hover:text-text-main"
                aria-label={`Edit ${row.name}`}
                onClick={() => openEdit(row)}
              >
                <Pencil className="size-4" />
              </UiButton>
            </PermissionGuard>
            <PermissionGuard permission="classes.delete">
              <UiButton
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer text-text-muted hover:bg-danger-hover-bg hover:text-danger"
                aria-label={`Delete ${row.name}`}
                onClick={() => setDeletingClass(row)}
              >
                <Trash2 className="size-4" />
              </UiButton>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    [],
  );

  const showingLabel =
    classes.length === 0
      ? "No classes found"
      : `Showing ${startIndex}-${endIndex} of ${classes.length} classes`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-main">Classes</h3>
          <p className="mt-1 text-sm text-text-muted">
            Create and manage the classes offered by your school.
          </p>
        </div>
        <PermissionGuard permission="classes.create">
          <Button type="button" onClick={() => setFormOpen(true)} className="px-5 py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            Add Class
          </Button>
        </PermissionGuard>
      </div>

      {loading && classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-sm font-medium text-text-muted">Loading classes...</p>
        </div>
      ) : classes.length > 0 ? (
        <div className="overflow-hidden">
          <p className="px-5 pb-3 text-xs text-text-muted">{showingLabel}</p>
          <Table columns={columns} data={paginatedItems} rowKey={(row) => row.id} />
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        <div className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-main bg-brand-soft text-brand">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h4 className="mb-1 text-base font-semibold text-text-main">No Classes Yet</h4>
          <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">
            Add your first class to start organizing students into grades.
          </p>
          <PermissionGuard permission="classes.create">
            <Button type="button" onClick={() => setFormOpen(true)} className="px-5 py-2.5 text-sm">
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          </PermissionGuard>
        </div>
      )}

      <ClassFormModal
        open={formOpen}
        schoolClass={editingClass}
        onOpenChange={handleFormOpenChange}
        onSuccess={async () => {
          await loadClasses(true);
          toast.success(editingClass ? "Class updated successfully." : "Class added successfully.");
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingClass)}
        title="Delete class?"
        description={
          deletingClass
            ? `Are you sure you want to delete "${deletingClass.name}"? This will also remove its sections.`
            : ""
        }
        loading={deleting}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingClass(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
