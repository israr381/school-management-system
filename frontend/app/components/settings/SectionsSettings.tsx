import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutList, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { getAccessToken } from "../../store/auth";
import {
  deleteSection,
  fetchClasses,
  fetchSections,
  type SchoolClass,
  type SchoolSection,
} from "../../store/classes";
import { toast } from "../toast/toast";
import Button from "../button/Button";
import ConfirmDeleteModal from "../modals/confirm-delete/ConfirmDeleteModal";
import SectionFormModal from "../modals/section-form/SectionFormModal";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import { Button as UiButton } from "~/components/ui/button";

const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];

export default function SectionsSettings() {
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SchoolSection | null>(null);
  const [deletingSection, setDeletingSection] = useState<SchoolSection | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = useCallback(async (force = false) => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const [sectionData, classData] = await Promise.all([
      fetchSections(token, { force }),
      fetchClasses(token, { force: false }),
    ]);
    setSections(sectionData);
    setClasses(classData);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await loadData();
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load sections.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const { paginatedItems, totalPages, safePage, startIndex, endIndex } = paginateItems(
    sections,
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
    if (!open) setEditingSection(null);
  };

  const openAdd = () => {
    if (classes.length === 0) {
      toast.error("Add a class first before creating a section.");
      return;
    }
    setFormOpen(true);
  };

  const openEdit = (section: SchoolSection) => {
    setEditingSection(section);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSection) return;

    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }

    setDeleting(true);
    try {
      await deleteSection(token, deletingSection.id);
      setDeletingSection(null);
      toast.success(`"${deletingSection.name}" was deleted.`);
      void loadData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete section.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<TableColumn<SchoolSection>[]>(
    () => [
      {
        key: "class_name",
        header: "Class",
        sortable: true,
        sortValue: (row) => row.class_name,
        render: (row) => <span className="font-semibold text-text-main">{row.class_name}</span>,
      },
      {
        key: "name",
        header: "Section",
        sortable: true,
        sortValue: (row) => row.name,
        render: (row) => <span className="font-semibold text-text-main">{row.name}</span>,
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (row) => (
          <div className="flex justify-end gap-1">
            <UiButton
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer text-text-muted hover:bg-surface-soft hover:text-text-main"
              aria-label={`Edit ${row.name}`}
              onClick={() => openEdit(row)}
            >
              <Pencil className="size-4" />
            </UiButton>
            <UiButton
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer text-text-muted hover:bg-danger-hover-bg hover:text-danger"
              aria-label={`Delete ${row.name}`}
              onClick={() => setDeletingSection(row)}
            >
              <Trash2 className="size-4" />
            </UiButton>
          </div>
        ),
      },
    ],
    [],
  );

  const showingLabel =
    sections.length === 0
      ? "No sections found"
      : `Showing ${startIndex}-${endIndex} of ${sections.length} sections`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-main">Sections</h3>
          <p className="mt-1 text-sm text-text-muted">
            Link sections to a class so students can be grouped within each grade.
          </p>
        </div>
        <Button type="button" onClick={openAdd} className="px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      {loading && sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-sm font-medium text-text-muted">Loading sections...</p>
        </div>
      ) : sections.length > 0 ? (
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
            <LayoutList className="h-7 w-7" />
          </div>
          <h4 className="mb-1 text-base font-semibold text-text-main">No Sections Yet</h4>
          <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">
            {classes.length === 0
              ? "Create a class first, then add sections like A, B, or Morning."
              : "Add your first section and link it to a class."}
          </p>
          <Button type="button" onClick={openAdd} className="px-5 py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </div>
      )}

      <SectionFormModal
        open={formOpen}
        section={editingSection}
        classes={classes}
        onOpenChange={handleFormOpenChange}
        onSuccess={async () => {
          await loadData(true);
          toast.success(
            editingSection ? "Section updated successfully." : "Section added successfully.",
          );
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingSection)}
        title="Delete section?"
        description={
          deletingSection
            ? `Are you sure you want to delete "${deletingSection.name}" from ${deletingSection.class_name}?`
            : ""
        }
        loading={deleting}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingSection(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
