import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  Eye,
  GraduationCap,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { getAccessToken } from "../../store/auth";
import { fetchClasses, fetchSections, type SchoolClass, type SchoolSection } from "../../store/classes";
import {
  deleteStudent,
  fetchParents,
  fetchStudentStats,
  fetchStudents,
  type Student,
  type StudentParent,
  type StudentStats,
} from "../../store/students";
import { toast } from "../toast/toast";
import Button from "../button/Button";
import Input from "../input/Input";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import StudentFormModal from "../modals/student-form/StudentFormModal";
import StudentViewModal from "../modals/student-view/StudentViewModal";
import ConfirmDeleteModal from "../modals/confirm-delete/ConfirmDeleteModal";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button as UiButton } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];

type StatusFilter = "all" | "active" | "graduated" | "disabled";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "active"
      ? "bg-success-bg text-success border-success-border"
      : status === "disabled"
        ? "bg-danger-bg text-danger border-danger-border"
        : "bg-surface-soft text-text-muted border-border-main";
  const dot =
    status === "active"
      ? "bg-success animate-pulse"
      : status === "disabled"
        ? "bg-danger"
        : "bg-icon-muted";
  const label =
    status === "active" ? "Active" : status === "disabled" ? "Disabled" : "Graduated";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export default function StudentsPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [parents, setParents] = useState<StudentParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async (force = false) => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const [studentRows, studentStats, classRows, sectionRows, parentRows] = await Promise.all([
      fetchStudents(token),
      fetchStudentStats(token),
      fetchClasses(token, { force }),
      fetchSections(token, { force }),
      fetchParents(token),
    ]);

    setStudents(studentRows);
    setStats(studentStats);
    setClasses(classRows);
    setSections(sectionRows);
    setParents(parentRows);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await loadData();
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load students.");
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

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      if (classFilter !== "all" && String(student.class_id) !== classFilter) {
        return false;
      }
      if (statusFilter !== "all" && student.status !== statusFilter) {
        return false;
      }
      if (!query) return true;

      return [
        student.full_name,
        student.email,
        student.phone,
        student.class_name,
        student.section_name,
        student.parent.full_name,
        student.parent.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [classFilter, search, statusFilter, students]);

  const { paginatedItems, totalPages, safePage, startIndex, endIndex } = paginateItems(
    filteredStudents,
    currentPage,
    pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, classFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const kpiCards = [
    {
      key: "all" as StatusFilter,
      title: "Total Students",
      value: stats?.total_students ?? 0,
      color: "#6366f1",
      icon: Users,
    },
    {
      key: "active" as StatusFilter,
      title: "Active Students",
      value: stats?.active_students ?? 0,
      color: "#10b981",
      icon: UserCheck,
    },
    {
      key: "graduated" as StatusFilter,
      title: "Graduated Students",
      value: stats?.graduated_students ?? 0,
      color: "#f97316",
      icon: GraduationCap,
    },
    {
      key: "disabled" as StatusFilter,
      title: "Disabled Students",
      value: stats?.disabled_students ?? 0,
      color: "#ef4444",
      icon: Ban,
    },
  ];

  const openAddModal = () => {
    setEditingStudent(null);
    setFormOpen(true);
  };

  const openEditModal = (student: Student) => {
    setViewingStudent(null);
    setEditingStudent(student);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingStudent(null);
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;

    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }

    setDeleting(true);
    try {
      await deleteStudent(token, deletingStudent.id);
      setDeletingStudent(null);
      toast.success(`"${deletingStudent.full_name}" was deleted.`);
      void loadData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete student.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<TableColumn<Student>[]>(
    () => [
      {
        key: "full_name",
        header: "Name",
        sortable: true,
        sortValue: (student) => student.full_name,
        render: (student) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-sm font-bold text-brand">
              {initials(student.full_name)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-text-main">{student.full_name}</p>
              <p className="truncate text-xs font-normal text-text-muted">{student.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "class_name",
        header: "Class",
        sortable: true,
        sortValue: (student) => student.class_name,
        render: (student) => (
          <span className="font-semibold text-text-main">{student.class_name}</span>
        ),
      },
      {
        key: "section_name",
        header: "Section",
        sortable: true,
        sortValue: (student) => student.section_name,
        render: (student) => (
          <span className="inline-flex items-center rounded-lg border border-border-main bg-surface-soft px-2.5 py-1 text-xs font-medium text-text-muted">
            {student.section_name}
          </span>
        ),
      },
      {
        key: "parent",
        header: "Parent",
        sortable: true,
        sortValue: (student) => student.parent.full_name,
        render: (student) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-text-main">{student.parent.full_name}</p>
            <p className="truncate text-xs capitalize text-text-muted">
              {student.parent.relationship}
            </p>
          </div>
        ),
      },
      {
        key: "created_at",
        header: "Admission Date",
        sortable: true,
        sortValue: (student) => new Date(student.created_at),
        render: (student) => (
          <span className="font-medium text-text-muted">
            {new Date(student.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        sortValue: (student) => student.status,
        render: (student) => <StatusBadge status={student.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (student) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <UiButton
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer text-text-muted hover:bg-surface-soft hover:text-text-main"
                  aria-label={`Actions for ${student.full_name}`}
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem className="cursor-pointer" onClick={() => setViewingStudent(student)}>
                <Eye className="size-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => openEditModal(student)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={() => setDeletingStudent(student)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const showingLabel =
    filteredStudents.length === 0
      ? "No students found"
      : `Showing ${startIndex}-${endIndex} of ${filteredStudents.length} students`;

  return (
    <div className="mx-auto max-w-350 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">Students</h1>
          <p className="mt-1 text-sm text-text-muted">
            Add students, assign classes and sections, and link parent login accounts.
          </p>
        </div>
        <Button type="button" onClick={openAddModal} className="px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((stat) => {
          const Icon = stat.icon;
          const selected = statusFilter === stat.key;
          return (
            <button
              key={stat.title}
              type="button"
              onClick={() => setStatusFilter(stat.key)}
              className={`dashboard-card cursor-pointer p-5 text-left transition-shadow ${
                selected ? "ring-2 ring-brand" : ""
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                  style={{
                    backgroundColor: stat.color,
                    boxShadow: `0 4px 14px -2px ${stat.color}55`,
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-text-muted">{stat.title}</p>
                  <p className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight text-text-main">
                    {loading && !stats ? "..." : stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-text-main">All Students</h2>
            <p className="mt-0.5 text-xs text-text-muted">{showingLabel}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
            <div className="w-full sm:w-52">
              <div className="mb-2 flex items-center">
                <Label htmlFor="class_filter" className="block text-sm font-medium leading-5 text-text-main">
                  Class
                </Label>
              </div>
              <Select
                id="class_filter"
                name="class_filter"
                value={classFilter}
                onValueChange={(value: string | null) => setClassFilter(value ?? "all")}
                items={[
                  { value: "all", label: "All classes" },
                  ...classes.map((schoolClass) => ({
                    value: String(schoolClass.id),
                    label: schoolClass.name,
                  })),
                ]}
              >
                <SelectTrigger className="h-10.5 w-full rounded-md border-border-main bg-input-bg px-4 py-0 text-sm text-text-main shadow-none dark:bg-input-bg dark:hover:bg-input-bg focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand cursor-pointer">
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
                  {classes.map((schoolClass) => {
                    const count =
                      stats?.by_class.find((item) => item.class_id === schoolClass.id)?.count ?? 0;
                    return (
                      <SelectItem
                        key={schoolClass.id}
                        value={String(schoolClass.id)}
                        className="cursor-pointer"
                      >
                        {schoolClass.name} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-72">
              <div className="mb-2 flex items-center">
                <Label htmlFor="student_search" className="block text-sm font-medium leading-5 text-text-main">
                  Search
                </Label>
              </div>
              <Input
                id="student_search"
                type="search"
                name="student_search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, or parent..."
                leftIcon={<Search className="h-4 w-4" />}
                className="h-10.5 rounded-md py-0 text-sm"
              />
            </div>
          </div>
        </div>

        {loading && students.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-medium text-text-muted">Loading students...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          <>
            <Table columns={columns} data={paginatedItems} rowKey={(student) => student.id} />
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
              <Users className="h-7 w-7" />
            </div>
            <h4 className="mb-1 text-base font-semibold text-text-main">
              {students.length === 0 ? "No Students Yet" : "No Matches Found"}
            </h4>
            <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">
              {students.length === 0
                ? "Add your first student and parent to create login accounts for both."
                : "No students match the current search or class filter."}
            </p>
            {students.length === 0 && (
              <Button
                type="button"
                onClick={openAddModal}
                className="px-5 py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            )}
          </div>
        )}
      </div>

      <StudentFormModal
        open={formOpen}
        student={editingStudent}
        classes={classes}
        sections={sections}
        parents={parents}
        onOpenChange={handleFormOpenChange}
        onSuccess={async () => {
          toast.success(
            editingStudent ? "Student updated successfully." : "Student created successfully.",
          );
          await loadData(true);
        }}
      />

      <StudentViewModal
        open={Boolean(viewingStudent)}
        student={viewingStudent}
        onOpenChange={(open) => {
          if (!open) setViewingStudent(null);
        }}
        onEdit={openEditModal}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingStudent)}
        title="Delete student?"
        description={
          deletingStudent
            ? `Are you sure you want to delete "${deletingStudent.full_name}"? Their login account will also be removed. The parent account is kept if other children are linked.`
            : ""
        }
        loading={deleting}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingStudent(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
