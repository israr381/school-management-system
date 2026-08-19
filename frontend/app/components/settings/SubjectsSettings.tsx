import { useCallback, useEffect, useMemo, useState } from "react";
import { BookMarked, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { getAccessToken } from "../../store/auth";
import {
  deleteSubject,
  fetchClasses,
  fetchSections,
  fetchSubjects,
  type SchoolClass,
  type SchoolSection,
  type SchoolSubject,
} from "../../store/classes";
import { toast } from "../toast/toast";
import Button from "../button/Button";
import ConfirmDeleteModal from "../modals/confirm-delete/ConfirmDeleteModal";
import SubjectFormModal from "../modals/subject-form/SubjectFormModal";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import { Button as UiButton } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import PermissionGuard from "../auth/PermissionGuard";

const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];

const filterTriggerClass =
  "h-10.5 w-full rounded-md border-border-main bg-input-bg px-4 py-0 text-sm text-text-main shadow-none dark:bg-input-bg dark:hover:bg-input-bg focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand cursor-pointer";

export default function SubjectsSettings() {
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SchoolSubject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SchoolSubject | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = useCallback(async (force = false) => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const [subjectData, classData, sectionData] = await Promise.all([
      fetchSubjects(token, { force }),
      fetchClasses(token, { force: false }),
      fetchSections(token, { force: false }),
    ]);
    setSubjects(subjectData);
    setClasses(classData);
    setSections(sectionData);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await loadData();
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load subjects.");
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

  const filteredSections = useMemo(
    () =>
      classFilter === "all"
        ? sections
        : sections.filter((section) => String(section.class_id) === classFilter),
    [classFilter, sections],
  );

  const filteredSubjects = useMemo(
    () =>
      subjects.filter((subject) => {
        if (classFilter !== "all" && String(subject.class_id) !== classFilter) {
          return false;
        }
        if (sectionFilter !== "all" && String(subject.section_id) !== sectionFilter) {
          return false;
        }
        return true;
      }),
    [classFilter, sectionFilter, subjects],
  );

  const { paginatedItems, totalPages, safePage, startIndex, endIndex } = paginateItems(
    filteredSubjects,
    currentPage,
    pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, classFilter, sectionFilter]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingSubject(null);
  };

  const openAdd = () => {
    if (classes.length === 0) {
      toast.error("Add a class first before creating a subject.");
      return;
    }
    if (sections.length === 0) {
      toast.error("Add a section first before creating a subject.");
      return;
    }
    setFormOpen(true);
  };

  const openEdit = (subject: SchoolSubject) => {
    setEditingSubject(subject);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSubject) return;

    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }

    setDeleting(true);
    try {
      await deleteSubject(token, deletingSubject.id);
      setDeletingSubject(null);
      toast.success(`"${deletingSubject.name}" was deleted.`);
      void loadData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete subject.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<TableColumn<SchoolSubject>[]>(
    () => [
      {
        key: "name",
        header: "Subject",
        sortable: true,
        sortValue: (row) => row.name,
        render: (row) => <span className="font-semibold text-text-main">{row.name}</span>,
      },
      {
        key: "class_name",
        header: "Class",
        sortable: true,
        sortValue: (row) => row.class_name,
        render: (row) => <span className="font-semibold text-text-main">{row.class_name}</span>,
      },
      {
        key: "section_name",
        header: "Section",
        sortable: true,
        sortValue: (row) => row.section_name,
        render: (row) => <span className="font-semibold text-text-main">{row.section_name}</span>,
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (row) => (
          <div className="flex justify-end gap-1">
            <PermissionGuard permission="subjects.update">
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
            <PermissionGuard permission="subjects.delete">
              <UiButton
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer text-text-muted hover:bg-danger-hover-bg hover:text-danger"
                aria-label={`Delete ${row.name}`}
                onClick={() => setDeletingSubject(row)}
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
    filteredSubjects.length === 0
      ? "No subjects found"
      : `Showing ${startIndex}-${endIndex} of ${filteredSubjects.length} subjects`;

  const emptyMessage =
    classes.length === 0
      ? "Create a class first, then add a section, then add subjects."
      : sections.length === 0
        ? "Create a section first, then add subjects for that class and section."
        : subjects.length === 0
          ? "Add your first subject and link it to a class and section."
          : "No subjects match the selected class or section.";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-main">Subjects</h3>
          <p className="mt-1 text-sm text-text-muted">
            Create subjects for a class and section, then browse them by class and section.
          </p>
        </div>
        <PermissionGuard permission="subjects.create">
          <Button type="button" onClick={openAdd} className="px-5 py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        </PermissionGuard>
      </div>

      {loading && subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-sm font-medium text-text-muted">Loading subjects...</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="px-1 text-xs text-text-muted">{showingLabel}</p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <div className="w-full sm:w-48">
                <div className="mb-2 flex items-center">
                  <Label htmlFor="subject_class_filter" className="block text-sm font-medium leading-5 text-text-main">
                    Class
                  </Label>
                </div>
                <Select
                  id="subject_class_filter"
                  name="subject_class_filter"
                  value={classFilter}
                  onValueChange={(value: string | null) => {
                    setClassFilter(value ?? "all");
                    setSectionFilter("all");
                  }}
                  items={[
                    { value: "all", label: "All classes" },
                    ...classes.map((schoolClass) => ({
                      value: String(schoolClass.id),
                      label: schoolClass.name,
                    })),
                  ]}
                >
                  <SelectTrigger className={filterTriggerClass}>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    className="rounded-md border-border-main bg-panel-bg text-text-main"
                  >
                    <SelectItem value="all" className="cursor-pointer">
                      All classes
                    </SelectItem>
                    {classes.map((schoolClass) => (
                      <SelectItem
                        key={schoolClass.id}
                        value={String(schoolClass.id)}
                        className="cursor-pointer"
                      >
                        {schoolClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <div className="mb-2 flex items-center">
                  <Label htmlFor="subject_section_filter" className="block text-sm font-medium leading-5 text-text-main">
                    Section
                  </Label>
                </div>
                <Select
                  id="subject_section_filter"
                  name="subject_section_filter"
                  value={sectionFilter}
                  onValueChange={(value: string | null) => setSectionFilter(value ?? "all")}
                  items={[
                    { value: "all", label: "All sections" },
                    ...filteredSections.map((section) => ({
                      value: String(section.id),
                      label: section.name,
                    })),
                  ]}
                >
                  <SelectTrigger className={filterTriggerClass}>
                    <SelectValue placeholder="All sections" />
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    className="rounded-md border-border-main bg-panel-bg text-text-main"
                  >
                    <SelectItem value="all" className="cursor-pointer">
                      All sections
                    </SelectItem>
                    {filteredSections.map((section) => (
                      <SelectItem
                        key={section.id}
                        value={String(section.id)}
                        className="cursor-pointer"
                      >
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {filteredSubjects.length > 0 ? (
            <>
              <Table columns={columns} data={paginatedItems} rowKey={(row) => row.id} />
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-main bg-brand-soft text-brand">
                <BookMarked className="h-7 w-7" />
              </div>
              <h4 className="mb-1 text-base font-semibold text-text-main">
                {subjects.length === 0 ? "No Subjects Yet" : "No Matches Found"}
              </h4>
              <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">{emptyMessage}</p>
              {subjects.length === 0 && (
                <PermissionGuard permission="subjects.create">
                  <Button type="button" onClick={openAdd} className="px-5 py-2.5 text-sm">
                    <Plus className="h-4 w-4" />
                    Add Subject
                  </Button>
                </PermissionGuard>
              )}
            </div>
          )}
        </div>
      )}

      <SubjectFormModal
        open={formOpen}
        subject={editingSubject}
        classes={classes}
        sections={sections}
        onOpenChange={handleFormOpenChange}
        onSuccess={async () => {
          await loadData(true);
          toast.success(
            editingSubject ? "Subject updated successfully." : "Subject added successfully.",
          );
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingSubject)}
        title="Delete subject?"
        description={
          deletingSubject
            ? `Are you sure you want to delete "${deletingSubject.name}" from ${deletingSubject.class_name} ${deletingSubject.section_name}?`
            : ""
        }
        loading={deleting}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingSubject(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
