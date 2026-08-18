import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { getAccessToken } from "../../../store/auth";
import type { SchoolClass, SchoolSection } from "../../../store/classes";
import {
  createStudent,
  updateStudent,
  type Student,
  type StudentParent,
} from "../../../store/students";
import Button from "../../button/Button";
import Input from "../../input/Input";
import Textarea from "../../input/Textarea";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  class_id: "",
  section_id: "",
  parent_full_name: "",
  parent_email: "",
  parent_phone: "",
  parent_relationship: "father",
  parent_address: "",
  parent_id: "",
  status: "active",
};

const selectTriggerClass =
  "h-12.5 w-full rounded-md border-border-main bg-input-bg px-4 py-0 text-sm text-text-main shadow-none dark:bg-input-bg dark:hover:bg-input-bg focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand cursor-pointer";

interface StudentFormModalProps {
  open: boolean;
  student?: Student | null;
  classes: SchoolClass[];
  sections: SchoolSection[];
  parents: StudentParent[];
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export default function StudentFormModal({
  open,
  student,
  classes,
  sections,
  parents,
  onOpenChange,
  onSuccess,
}: StudentFormModalProps) {
  const isEditing = Boolean(student);
  const [form, setForm] = useState(emptyForm);
  const [useExistingParent, setUseExistingParent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(
      student
        ? {
            full_name: student.full_name,
            email: student.email,
            phone: student.phone,
            address: student.address,
            class_id: String(student.class_id),
            section_id: String(student.section_id),
            parent_full_name: student.parent.full_name,
            parent_email: student.parent.email,
            parent_phone: student.parent.phone,
            parent_relationship: student.parent.relationship === "guardian" ? "guardian" : "father",
            parent_address: student.parent.address ?? "",
            parent_id: String(student.parent.id),
            status:
              student.status === "graduated" || student.status === "disabled"
                ? student.status
                : "active",
          }
        : emptyForm,
    );
    setUseExistingParent(false);
    setError("");
    setLoading(false);
  }, [open, student]);

  const classSections = useMemo(
    () => sections.filter((section) => String(section.class_id) === form.class_id),
    [form.class_id, sections],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleClassChange = (value: string | null) => {
    setForm((current) => ({
      ...current,
      class_id: value ?? "",
      section_id: "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!form.class_id) {
      setError(classes.length === 0 ? "Create a class in Settings before adding a student." : "Please select a class.");
      return;
    }
    if (!form.section_id) {
      setError(
        classSections.length === 0
          ? "Create a section for this class in Settings before adding a student."
          : "Please select a section.",
      );
      return;
    }

    if (useExistingParent) {
      if (!form.parent_id) {
        setError("Please select an existing parent.");
        return;
      }
    }

    const token = getAccessToken();
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      return;
    }

    setLoading(true);

    const payload = useExistingParent
      ? {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          class_id: Number(form.class_id),
          section_id: Number(form.section_id),
          parent_id: Number(form.parent_id),
        }
      : {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          class_id: Number(form.class_id),
          section_id: Number(form.section_id),
          parent_full_name: form.parent_full_name.trim(),
          parent_email: form.parent_email.trim(),
          parent_phone: form.parent_phone.trim(),
          parent_relationship: form.parent_relationship as "father" | "guardian",
          parent_address: form.parent_address.trim() || null,
        };

    try {
      if (isEditing && student) {
        await updateStudent(token, student.id, {
          ...payload,
          status: form.status as "active" | "graduated" | "disabled",
        });
      } else {
        await createStudent(token, payload);
      }
      onOpenChange(false);
      void onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col overflow-hidden bg-panel-bg text-text-main sm:max-w-2xl p-0 gap-0"
        showCloseButton={!loading}
      >
        <DialogHeader className="shrink-0 border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            {isEditing ? "Edit Student" : "Add Student"}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            {isEditing
              ? "Update the student profile, class, section, and parent details."
              : "Create a student profile, assign a class and section, and add the father or guardian."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-role-active-text">
              1. Student Details
            </h3>
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              <Input
                type="text"
                name="full_name"
                label="Student Name"
                required
                value={form.full_name}
                onChange={handleInputChange}
                placeholder="e.g. Ali Khan"
                className="h-12.5 rounded-md py-0"
              />
              <Input
                type="email"
                name="email"
                label="Student Email"
                required
                value={form.email}
                onChange={handleInputChange}
                placeholder="e.g. ali.khan@school.edu"
                className="h-12.5 rounded-md py-0"
              />
              <div className="sm:col-span-2">
                <Input
                  type="tel"
                  name="phone"
                  label="Student Phone"
                  required
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 03001234567"
                  className="h-12.5 rounded-md py-0"
                />
              </div>
              <div className="w-full">
                <div className="mb-2 flex items-center">
                  <Label htmlFor="class_id" className="block text-sm font-medium leading-5 text-text-main">
                    Class
                  </Label>
                </div>
                <Select
                  id="class_id"
                  name="class_id"
                  required
                  modal={false}
                  value={form.class_id || null}
                  onValueChange={handleClassChange}
                  items={classes.map((schoolClass) => ({
                    value: String(schoolClass.id),
                    label: schoolClass.name,
                  }))}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    className="rounded-md border-border-main bg-panel-bg text-text-main"
                  >
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
              <div className="w-full">
                <div className="mb-2 flex items-center">
                  <Label htmlFor="section_id" className="block text-sm font-medium leading-5 text-text-main">
                    Section
                  </Label>
                </div>
                <Select
                  id="section_id"
                  name="section_id"
                  required
                  modal={false}
                  disabled={!form.class_id}
                  value={form.section_id || null}
                  onValueChange={(value: string | null) =>
                    setForm((current) => ({ ...current, section_id: value ?? "" }))
                  }
                  items={classSections.map((section) => ({
                    value: String(section.id),
                    label: section.name,
                  }))}
                >
                  <SelectTrigger className={selectTriggerClass} disabled={!form.class_id}>
                    <SelectValue
                      placeholder={form.class_id ? "Select a section" : "Select a class first"}
                    />
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    className="rounded-md border-border-main bg-panel-bg text-text-main"
                  >
                    {classSections.map((section) => (
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
              {isEditing && (
                <div className="w-full sm:col-span-2">
                  <div className="mb-2 flex items-center">
                    <Label htmlFor="status" className="block text-sm font-medium leading-5 text-text-main">
                      Status
                    </Label>
                  </div>
                  <Select
                    id="status"
                    name="status"
                    required
                    modal={false}
                    value={form.status}
                    onValueChange={(value: string | null) =>
                      setForm((current) => ({ ...current, status: value ?? "active" }))
                    }
                    items={[
                      { value: "active", label: "Active" },
                      { value: "graduated", label: "Graduated" },
                      { value: "disabled", label: "Disabled" },
                    ]}
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      alignItemWithTrigger={false}
                      className="rounded-md border-border-main bg-panel-bg text-text-main"
                    >
                      <SelectItem value="active" className="cursor-pointer">
                        Active
                      </SelectItem>
                      <SelectItem value="graduated" className="cursor-pointer">
                        Graduated
                      </SelectItem>
                      <SelectItem value="disabled" className="cursor-pointer">
                        Disabled
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Textarea
              name="address"
              label="Address"
              required
              rows={3}
              value={form.address}
              onChange={handleInputChange}
              placeholder="Street, city, and area"
              className="rounded-md"
            />
          </div>

          <hr className="border-border-main" />

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-role-active-text">
                  2. Father or Guardian
                </h3>
                <p className="mt-1 text-sm text-text-muted">
                  Turn this on to link siblings to a parent who already exists.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 pt-0.5">
                <Label htmlFor="existing_parent" className="text-sm font-medium text-text-main">
                  Parent already exists
                </Label>
                <Switch
                  id="existing_parent"
                  checked={useExistingParent}
                  onCheckedChange={(checked) => {
                    setUseExistingParent(Boolean(checked));
                    if (!checked) {
                      setForm((current) => ({ ...current, parent_id: student ? String(student.parent.id) : "" }));
                    }
                  }}
                  className="data-checked:bg-brand"
                />
              </div>
            </div>

            {useExistingParent ? (
              <ParentSearchSelect
                parents={parents}
                value={form.parent_id}
                onChange={(parentId) => setForm((current) => ({ ...current, parent_id: parentId }))}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                  <div className="w-full">
                    <div className="mb-2 flex items-center">
                      <Label htmlFor="parent_relationship" className="block text-sm font-medium leading-5 text-text-main">
                        Relationship
                      </Label>
                    </div>
                    <Select
                      id="parent_relationship"
                      name="parent_relationship"
                      required
                      modal={false}
                      value={form.parent_relationship}
                      onValueChange={(value: string | null) =>
                        setForm((current) => ({
                          ...current,
                          parent_relationship: value ?? "father",
                        }))
                      }
                      items={[
                        { value: "father", label: "Father" },
                        { value: "guardian", label: "Guardian" },
                      ]}
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        alignItemWithTrigger={false}
                        className="rounded-md border-border-main bg-panel-bg text-text-main"
                      >
                        <SelectItem value="father" className="cursor-pointer">
                          Father
                        </SelectItem>
                        <SelectItem value="guardian" className="cursor-pointer">
                          Guardian
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="text"
                    name="parent_full_name"
                    label="Name"
                    required
                    value={form.parent_full_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Ahmed Khan"
                    className="h-12.5 rounded-md py-0"
                  />
                  <Input
                    type="email"
                    name="parent_email"
                    label="Email"
                    required
                    value={form.parent_email}
                    onChange={handleInputChange}
                    placeholder="e.g. ahmed.khan@email.com"
                    className="h-12.5 rounded-md py-0"
                  />
                  <Input
                    type="tel"
                    name="parent_phone"
                    label="Phone"
                    required
                    value={form.parent_phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 03007654321"
                    className="h-12.5 rounded-md py-0"
                  />
                </div>
                <Textarea
                  name="parent_address"
                  label="Address (optional)"
                  rows={3}
                  value={form.parent_address}
                  onChange={handleInputChange}
                  placeholder="Street, city, and area"
                  className="rounded-md"
                />
              </>
            )}
          </div>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t border-border-main bg-panel-bg px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="px-5 py-2.5 text-sm"
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="px-5 py-2.5 text-sm">
              {isEditing ? "Save Changes" : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ParentSearchSelect({
  parents,
  value,
  onChange,
}: {
  parents: StudentParent[];
  value: string;
  onChange: (parentId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = parents.find((parent) => String(parent.id) === value);

  const filteredParents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return parents;
    return parents.filter((parent) =>
      [parent.full_name, parent.email, parent.phone, parent.relationship]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [parents, query]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <div className="mb-2 flex items-center">
        <Label className="block text-sm font-medium leading-5 text-text-main">
          Select Parent
        </Label>
      </div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-12.5 w-full items-center justify-between gap-2 rounded-md border border-border-main bg-input-bg px-4 py-2 text-left text-sm text-text-main shadow-none focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
      >
        {selected ? (
          <span className="min-w-0">
            <span className="block truncate font-medium">{selected.full_name}</span>
            <span className="block truncate text-xs text-text-muted">{selected.email}</span>
          </span>
        ) : (
          <span className="text-text-muted">Search and select an existing parent</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
      </button>

      {open && (
        <div className="absolute bottom-full z-50 mb-2 w-full overflow-hidden rounded-md border border-border-main bg-panel-bg shadow-lg">
          <div className="border-b border-border-main p-2">
            <Input
              type="search"
              name="parent_search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email..."
              leftIcon={<Search className="h-4 w-4" />}
              className="h-10.5 rounded-md py-0 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-44 overflow-y-auto p-1">
            {filteredParents.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-text-muted">
                {parents.length === 0
                  ? "No parents exist yet. Add a parent first."
                  : "No matching parents found."}
              </p>
            ) : (
              filteredParents.map((parent) => {
                const isSelected = String(parent.id) === value;
                return (
                  <button
                    key={parent.id}
                    type="button"
                    onClick={() => {
                      onChange(String(parent.id));
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full cursor-pointer flex-col items-start rounded-md px-3 py-2 text-left ${
                      isSelected ? "bg-brand-soft text-text-main" : "hover:bg-surface-soft"
                    }`}
                  >
                    <span className="truncate text-sm font-medium text-text-main">
                      {parent.full_name}
                    </span>
                    <span className="truncate text-xs text-text-muted">
                      {parent.email}
                      {typeof parent.student_count === "number"
                        ? ` · ${parent.student_count} student${parent.student_count === 1 ? "" : "s"}`
                        : ""}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
