import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  BookOpen,
  Eye,
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
import {
  deleteTeacher,
  fetchTeacherStats,
  fetchTeachers,
  type Teacher,
  type TeacherStats,
} from "../../store/teachers";
import { toast } from "../toast/toast";
import Button from "../button/Button";
import Input from "../input/Input";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import TeacherFormModal from "../modals/teacher-form/TeacherFormModal";
import TeacherViewModal from "../modals/teacher-view/TeacherViewModal";
import ConfirmDeleteModal from "../modals/confirm-delete/ConfirmDeleteModal";
import { Label } from "~/components/ui/label";
import { Button as UiButton } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { usePermission } from "../../hooks/usePermission";
import PermissionGuard from "../auth/PermissionGuard";

const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];

type StatusFilter = "all" | "active" | "disabled";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TeacherListAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(avatarUrl) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [avatarUrl]);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-brand-soft text-sm font-bold text-brand">
      {showImage ? (
        <img
          src={avatarUrl ?? undefined}
          alt={`${name} avatar`}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "active"
      ? "bg-success-bg text-success border-success-border"
      : "bg-danger-bg text-danger border-danger-border";
  const dot = status === "active" ? "bg-success animate-pulse" : "bg-danger";
  const label = status === "active" ? "Active" : "Disabled";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export default function TeachersPanel() {
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission("teachers.update");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async (force = false) => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const [teacherRows, teacherStats] = await Promise.all([
      fetchTeachers(token, { force }),
      fetchTeacherStats(token, { force }),
    ]);

    setTeachers(teacherRows);
    setStats(teacherStats);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await loadData();
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load teachers.");
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

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      if (statusFilter !== "all" && teacher.status !== statusFilter) {
        return false;
      }
      if (!query) return true;

      return [teacher.full_name, teacher.email, teacher.phone, teacher.subject, teacher.address]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [search, statusFilter, teachers]);

  const { paginatedItems, totalPages, safePage, startIndex, endIndex } = paginateItems(
    filteredTeachers,
    currentPage,
    pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const kpiCards = [
    {
      key: "all" as StatusFilter,
      title: "Total Teachers",
      value: stats?.total_teachers ?? 0,
      color: "#6366f1",
      icon: Users,
    },
    {
      key: "active" as StatusFilter,
      title: "Active Teachers",
      value: stats?.active_teachers ?? 0,
      color: "#10b981",
      icon: UserCheck,
    },
    {
      key: "disabled" as StatusFilter,
      title: "Disabled Teachers",
      value: stats?.disabled_teachers ?? 0,
      color: "#ef4444",
      icon: Ban,
    },
  ];

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setViewingTeacher(null);
    setEditingTeacher(teacher);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingTeacher(null);
  };

  const handleDelete = async () => {
    if (!deletingTeacher) return;

    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }

    setDeleting(true);
    try {
      await deleteTeacher(token, deletingTeacher.id);
      setDeletingTeacher(null);
      toast.success(`"${deletingTeacher.full_name}" was deleted.`);
      void loadData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete teacher.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<TableColumn<Teacher>[]>(
    () => [
      {
        key: "full_name",
        header: "Name",
        sortable: true,
        sortValue: (teacher) => teacher.full_name,
        render: (teacher) => (
          <div className="flex items-center gap-3">
            <TeacherListAvatar name={teacher.full_name} avatarUrl={teacher.avatar_url} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-text-main">{teacher.full_name}</p>
              <p className="truncate text-xs font-normal text-text-muted">{teacher.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "subject",
        header: "Subject",
        sortable: true,
        sortValue: (teacher) => teacher.subject ?? "",
        render: (teacher) => (
          <span className="font-medium text-text-main">{teacher.subject || "—"}</span>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        sortable: true,
        sortValue: (teacher) => teacher.phone,
        render: (teacher) => (
          <span className="font-medium text-text-muted">{teacher.phone}</span>
        ),
      },
      {
        key: "created_at",
        header: "Joined",
        sortable: true,
        sortValue: (teacher) => new Date(teacher.created_at),
        render: (teacher) => (
          <span className="font-medium text-text-muted">
            {new Date(teacher.created_at).toLocaleDateString(undefined, {
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
        sortValue: (teacher) => teacher.status,
        render: (teacher) => <StatusBadge status={teacher.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (teacher) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <UiButton
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer text-text-muted hover:bg-surface-soft hover:text-text-main"
                  aria-label={`Actions for ${teacher.full_name}`}
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem className="cursor-pointer" onClick={() => setViewingTeacher(teacher)}>
                <Eye className="size-4" />
                View
              </DropdownMenuItem>
              <PermissionGuard permission="teachers.update">
                <DropdownMenuItem className="cursor-pointer" onClick={() => openEditModal(teacher)}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
              </PermissionGuard>
              <PermissionGuard permission="teachers.delete">
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => setDeletingTeacher(teacher)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </PermissionGuard>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const showingLabel =
    filteredTeachers.length === 0
      ? "No teachers found"
      : `Showing ${startIndex}-${endIndex} of ${filteredTeachers.length} teachers`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">Teachers</h1>
          <p className="mt-1 text-sm text-text-muted">
            Add teachers and create login accounts they can use to sign in.
          </p>
        </div>
        <PermissionGuard permission="teachers.create">
          <Button type="button" onClick={openAddModal} className="px-5 py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <h2 className="text-[15px] font-semibold text-text-main">All Teachers</h2>
            <p className="mt-0.5 text-xs text-text-muted">{showingLabel}</p>
          </div>
          <div className="w-full sm:w-72 lg:w-80">
            <div className="mb-2 flex items-center">
              <Label htmlFor="teacher_search" className="block text-sm font-medium leading-5 text-text-main">
                Search
              </Label>
            </div>
            <Input
              id="teacher_search"
              type="search"
              name="teacher_search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or subject..."
              leftIcon={<Search className="h-4 w-4" />}
              className="h-10.5 rounded-md py-0 text-sm"
            />
          </div>
        </div>

        {loading && teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-medium text-text-muted">Loading teachers...</p>
          </div>
        ) : filteredTeachers.length > 0 ? (
          <>
            <Table columns={columns} data={paginatedItems} rowKey={(teacher) => teacher.id} />
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
              <BookOpen className="h-7 w-7" />
            </div>
            <h4 className="mb-1 text-base font-semibold text-text-main">
              {teachers.length === 0 ? "No Teachers Yet" : "No Matches Found"}
            </h4>
            <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">
              {teachers.length === 0
                ? "Add your first teacher to create a login account they can use to sign in."
                : "No teachers match the current search or status filter."}
            </p>
            {teachers.length === 0 && (
              <PermissionGuard permission="teachers.create">
                <Button type="button" onClick={openAddModal} className="px-5 py-2.5 text-sm">
                  <Plus className="h-4 w-4" />
                  Add Teacher
                </Button>
              </PermissionGuard>
            )}
          </div>
        )}
      </div>

      <TeacherFormModal
        open={formOpen}
        teacher={editingTeacher}
        onOpenChange={handleFormOpenChange}
        onSuccess={async () => {
          toast.success(
            editingTeacher ? "Teacher updated successfully." : "Teacher created successfully.",
          );
          await loadData(true);
        }}
      />

      <TeacherViewModal
        open={Boolean(viewingTeacher)}
        teacher={viewingTeacher}
        onOpenChange={(open) => {
          if (!open) setViewingTeacher(null);
        }}
        onEdit={canUpdate ? openEditModal : undefined}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingTeacher)}
        title="Delete teacher?"
        description={
          deletingTeacher
            ? `Are you sure you want to delete "${deletingTeacher.full_name}"? Their login account will also be removed.`
            : ""
        }
        loading={deleting}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingTeacher(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
