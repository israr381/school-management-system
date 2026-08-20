import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import { getAccessToken } from "../../store/auth";
import { fetchClasses, fetchSections, type SchoolClass, type SchoolSection } from "../../store/classes";
import { fetchTeachers, type Teacher } from "../../store/teachers";
import {
  deleteTeacherAssignment,
  fetchTeacherAssignments,
  type TeacherClassAssignment,
} from "../../store/teacherAssignments";
import { toast } from "../toast/toast";
import Button from "../button/Button";
import AssignClassModal from "../modals/assign-class/AssignClassModal";
import ConfirmDeleteModal from "../modals/confirm-delete/ConfirmDeleteModal";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import { Button as UiButton } from "~/components/ui/button";
import PermissionGuard from "../auth/PermissionGuard";

const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];

export default function AssignClassSettings() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [assignments, setAssignments] = useState<TeacherClassAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeacherClassAssignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<TeacherClassAssignment | null>(null);
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

    const [teacherData, classData, sectionData, assignmentData] = await Promise.all([
      fetchTeachers(token, { force }),
      fetchClasses(token, { force: false }),
      fetchSections(token, { force: false }),
      fetchTeacherAssignments(token, { force }),
    ]);
    setTeachers(teacherData);
    setClasses(classData);
    setSections(sectionData);
    setAssignments(assignmentData);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await loadData();
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load assignments.");
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
    assignments,
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
    if (!open) setEditingAssignment(null);
  };

  const openAdd = () => {
    if (teachers.length === 0) {
      toast.error("Add a teacher first before assigning a class.");
      return;
    }
    if (classes.length === 0) {
      toast.error("Add a class first before assigning a teacher.");
      return;
    }
    if (sections.length === 0) {
      toast.error("Add a section first before assigning a teacher.");
      return;
    }
    setFormOpen(true);
  };

  const openEdit = (assignment: TeacherClassAssignment) => {
    setEditingAssignment(assignment);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAssignment) return;

    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }

    setDeleting(true);
    try {
      await deleteTeacherAssignment(token, deletingAssignment.id);
      setDeletingAssignment(null);
      toast.success(
        `"${deletingAssignment.teacher_name}" was unassigned from ${deletingAssignment.class_name}-${deletingAssignment.section_name}.`,
      );
      void loadData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete assignment.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<TableColumn<TeacherClassAssignment>[]>(
    () => [
      {
        key: "teacher_name",
        header: "Teacher",
        sortable: true,
        sortValue: (row) => row.teacher_name,
        render: (row) => <span className="font-semibold text-text-main">{row.teacher_name}</span>,
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
            <PermissionGuard permission="teachers.update">
              <UiButton
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer text-text-muted hover:bg-surface-soft hover:text-text-main"
                aria-label={`Edit assignment for ${row.teacher_name}`}
                onClick={() => openEdit(row)}
              >
                <Pencil className="size-4" />
              </UiButton>
            </PermissionGuard>
            <PermissionGuard permission="teachers.delete">
              <UiButton
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer text-text-muted hover:bg-danger-hover-bg hover:text-danger"
                aria-label={`Delete assignment for ${row.teacher_name}`}
                onClick={() => setDeletingAssignment(row)}
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
    assignments.length === 0
      ? "No assignments found"
      : `Showing ${startIndex}-${endIndex} of ${assignments.length} assignments`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-main">Assign Class</h3>
          <p className="mt-1 text-sm text-text-muted">
            Assign one teacher to one class and section. Example: Teacher Ahmed → Class 10-A.
          </p>
        </div>
        <PermissionGuard permission="teachers.update">
          <Button type="button" onClick={openAdd} className="px-5 py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            Assign Class
          </Button>
        </PermissionGuard>
      </div>

      {loading && assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-sm font-medium text-text-muted">Loading assignments...</p>
        </div>
      ) : assignments.length > 0 ? (
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
            <UserCheck className="h-7 w-7" />
          </div>
          <h4 className="mb-1 text-base font-semibold text-text-main">No Assignments Yet</h4>
          <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">
            Open the form to assign one teacher to one class and section.
          </p>
          <PermissionGuard permission="teachers.update">
            <Button type="button" onClick={openAdd} className="px-5 py-2.5 text-sm">
              <Plus className="h-4 w-4" />
              Assign Class
            </Button>
          </PermissionGuard>
        </div>
      )}

      <AssignClassModal
        open={formOpen}
        assignment={editingAssignment}
        teachers={teachers}
        classes={classes}
        sections={sections}
        assignments={assignments}
        onOpenChange={handleFormOpenChange}
        onSuccess={async () => {
          await loadData(true);
          toast.success(
            editingAssignment ? "Assignment updated successfully." : "Assignment saved.",
          );
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingAssignment)}
        title="Delete assignment?"
        description={
          deletingAssignment
            ? `Are you sure you want to unassign "${deletingAssignment.teacher_name}" from ${deletingAssignment.class_name}-${deletingAssignment.section_name}?`
            : ""
        }
        loading={deleting}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingAssignment(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
