import { useEffect, useState } from "react";
import { CheckCircle2, Eye, Loader2, Pencil, Plus, Shield, Trash2, X } from "lucide-react";
import { createStaff, getBranches, getStaff, removeStaff, updateStaff } from "../services/organizationApi";
import type { Branch, StaffMember, StaffRole } from "../services/organizationApi";
import { getApiErrorMessage } from "../services/apiClient";

const roles: Exclude<StaffRole, "OWNER">[] = ["MANAGER", "CASHIER", "INVENTORY", "ACCOUNTANT", "CUSTOM"];

type StaffFormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Exclude<StaffRole, "OWNER">;
  branchId: string;
  permissions: string[];
  status: "ACTIVE" | "INACTIVE";
};

const emptyForm: StaffFormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "CASHIER",
  branchId: "",
  permissions: [],
  status: "ACTIVE",
};

function PermissionPill({ permission }: { permission: string }) {
  return <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{permission}</span>;
}

function Field({
  label,
  value,
  set,
  type = "text",
  required = true,
  disabled = false,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="text-xs font-bold text-ink/55">
      {label}
      <input
        required={required}
        disabled={disabled}
        type={type}
        minLength={type === "password" && required ? 8 : undefined}
        value={value}
        onChange={(event) => set(event.target.value)}
        className="mt-1 w-full rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15 disabled:opacity-60"
      />
    </label>
  );
}

function StaffFormModal({
  mode,
  form,
  branches,
  permissions,
  error,
  isSubmitting,
  onChange,
  onTogglePermission,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  form: StaffFormState;
  branches: Branch[];
  permissions: string[];
  error: string;
  isSubmitting: boolean;
  onChange: (form: StaffFormState) => void;
  onTogglePermission: (permission: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const isCreate = mode === "create";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
      <form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">{isCreate ? "Add staff" : "Edit staff"}</p>
            <h2 className="mt-1 font-display text-lg font-bold text-ink">{isCreate ? "Create staff account" : "Update role and permissions"}</h2>
            <p className="mt-1 text-sm font-semibold text-ink/45">Assign branch access, role, and custom permissions.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg p-2 text-ink/45 hover:bg-[#eef8f4] hover:text-ink" aria-label="Close staff form">
            <X size={18} />
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={form.name} disabled={!isCreate} set={(value) => onChange({ ...form, name: value })} />
          <Field label="Email" type="email" value={form.email} disabled={!isCreate} set={(value) => onChange({ ...form, email: value })} />
          <Field label="Phone" value={form.phone} required={false} disabled={!isCreate} set={(value) => onChange({ ...form, phone: value })} />
          {isCreate && <Field label="Temporary password" type="password" value={form.password} set={(value) => onChange({ ...form, password: value })} />}
          <label className="text-xs font-bold text-ink/55">
            Role
            <select value={form.role} onChange={(event) => onChange({ ...form, role: event.target.value as Exclude<StaffRole, "OWNER"> })} className="mt-1 w-full rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15">
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-ink/55">
            Branch
            <select value={form.branchId} onChange={(event) => onChange({ ...form, branchId: event.target.value })} className="mt-1 w-full rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15">
              <option value="">All branches</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </label>
          {!isCreate && (
            <label className="text-xs font-bold text-ink/55">
              Status
              <select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as "ACTIVE" | "INACTIVE" })} className="mt-1 w-full rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </label>
          )}
        </div>

        {form.role === "CUSTOM" && (
          <section className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink/45">Custom permissions</p>
              <p className="text-xs font-semibold text-ink/40">{form.permissions.length} selected</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {permissions.map((permission) => (
                <label key={permission} className="flex items-center gap-2 rounded-lg border border-ink/10 bg-white p-2 text-xs font-semibold text-ink/70">
                  <input type="checkbox" checked={form.permissions.includes(permission)} onChange={() => onTogglePermission(permission)} />
                  {permission}
                </label>
              ))}
            </div>
          </section>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-ink/15 bg-white px-4 py-2 text-sm font-bold text-ink/60 hover:bg-[#eef8f4] disabled:opacity-60">Cancel</button>
          <button disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-leaf/90 disabled:opacity-60">
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {isCreate ? "Create staff" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StaffDetailsModal({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">Staff details</p>
            <h2 className="mt-1 font-display text-lg font-bold text-ink">{member.user.name}</h2>
            <p className="mt-1 text-sm font-semibold text-ink/45">{member.user.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-ink/45 hover:bg-[#eef8f4] hover:text-ink" aria-label="Close staff details">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Info label="Role" value={member.role} />
          <Info label="Status" value={member.status} />
          <Info label="Branch" value={member.branch?.name || "All branches"} />
          <Info label="Phone" value={member.user.phone || "Not set"} />
        </div>
        <section className="mt-5 rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink/45">Permissions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {member.permissions.length ? member.permissions.map((permission) => <PermissionPill key={permission} permission={permission} />) : <p className="text-sm font-semibold text-ink/45">No permissions assigned.</p>}
          </div>
        </section>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
      <p className="text-xs font-bold uppercase text-ink/40">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-ink">{value}</p>
    </div>
  );
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffFormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [staffResult, branchesResult] = await Promise.all([getStaff(), getBranches()]);
      setStaff(staffResult.staff);
      setPermissions(staffResult.permissions);
      setBranches(branchesResult);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openCreate = () => {
    setFormMode("create");
    setEditingStaff(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setFormMode("edit");
    setEditingStaff(member);
    setForm({
      name: member.user.name,
      email: member.user.email,
      phone: member.user.phone || "",
      password: "",
      role: member.role === "OWNER" ? "MANAGER" : member.role,
      branchId: member.branch?.id || "",
      permissions: member.permissions,
      status: member.status,
    });
    setFormError("");
    setFormOpen(true);
  };

  const togglePermission = (permission: string) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setError("");
    setSuccess("");
    try {
      const payload = {
        role: form.role,
        branchId: form.branchId || undefined,
        permissions: form.role === "CUSTOM" ? form.permissions : undefined,
      };
      if (formMode === "create") {
        await createStaff({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          ...payload,
        });
      } else if (editingStaff) {
        await updateStaff(editingStaff.id, {
          ...payload,
          branchId: form.branchId || null,
          status: form.status,
        });
      }
      setSuccess(`Staff member ${formMode === "create" ? "created" : "updated"} successfully.`);
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (member: StaffMember) => {
    setError("");
    setSuccess("");
    try {
      await updateStaff(member.id, { status: member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
      setSuccess(`${member.user.name} ${member.status === "ACTIVE" ? "deactivated" : "activated"}.`);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const deleteMember = async (member: StaffMember) => {
    if (!confirm(`Remove ${member.user.name}?`)) return;
    setError("");
    setSuccess("");
    try {
      await removeStaff(member.id);
      setSuccess(`${member.user.name} removed.`);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Staff & Permissions</h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">Add, view, edit, assign permissions, activate, and remove staff users.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-leaf/90">
          <Plus size={16} />
          Add staff
        </button>
      </div>

      {success && <p className="mt-4 rounded-xl border border-leaf/20 bg-mint p-3 text-sm font-semibold text-leaf">{success}</p>}
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      <section className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#f7faf9] text-xs uppercase text-ink/45">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 8 }).map((__, cell) => <td key={cell} className="px-4 py-4"><div className="h-3 w-24 animate-pulse rounded-full bg-ink/8" /></td>)}
                  </tr>
                ))
              ) : staff.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm font-semibold text-ink/45">No staff users found.</td></tr>
              ) : staff.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-bold text-ink">{member.user.name}</td>
                  <td className="px-4 py-3 text-ink/65">{member.user.email}</td>
                  <td className="px-4 py-3 text-ink/65">{member.user.phone || "-"}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-ink/5 px-2 py-1 text-xs font-bold">{member.role}</span></td>
                  <td className="px-4 py-3 text-ink/65">{member.branch?.name || "All branches"}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${member.status === "ACTIVE" ? "bg-mint text-leaf" : "bg-orange-50 text-clay"}`}>{member.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {member.permissions.slice(0, 3).map((permission) => <PermissionPill key={permission} permission={permission} />)}
                      {member.permissions.length > 3 && <span className="rounded-full bg-ink/5 px-2 py-1 text-[11px] font-bold text-ink/50">+{member.permissions.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => setViewingStaff(member)} className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-2.5 py-1.5 text-xs font-bold text-ink/60 hover:bg-[#eef8f4]"><Eye size={13} />View</button>
                      {member.role !== "OWNER" && <button onClick={() => openEdit(member)} className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-2.5 py-1.5 text-xs font-bold text-ink/60 hover:bg-[#eef8f4]"><Pencil size={13} />Edit</button>}
                      {member.role !== "OWNER" && <button onClick={() => void toggleStatus(member)} className="inline-flex items-center gap-1 rounded-lg border border-leaf/20 px-2.5 py-1.5 text-xs font-bold text-leaf hover:bg-mint"><CheckCircle2 size={13} />{member.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>}
                      {member.role !== "OWNER" && <button onClick={() => void deleteMember(member)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={13} />Remove</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {formOpen && <StaffFormModal mode={formMode} form={form} branches={branches} permissions={permissions} error={formError} isSubmitting={isSubmitting} onChange={setForm} onTogglePermission={togglePermission} onClose={() => setFormOpen(false)} onSubmit={save} />}
      {viewingStaff && <StaffDetailsModal member={viewingStaff} onClose={() => setViewingStaff(null)} />}
    </div>
  );
}
