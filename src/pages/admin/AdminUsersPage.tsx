import { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import {
  getAdminUser,
  getAdminUsersPage,
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../../services/adminApi";
import type { AdminRole, AdminStatus, AdminUser } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";

type PendingAction = {
  user: AdminUser;
  kind: "role" | "status" | "delete";
  nextRole?: AdminRole;
  nextStatus?: AdminStatus;
  title: string;
  body: string;
  confirmLabel: string;
  tone: "leaf" | "clay";
};

type UserFormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: AdminRole;
  status: AdminStatus;
};

const emptyUserForm: UserFormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "USER",
  status: "ACTIVE",
};

function formatDate(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function badgeClass(kind: "role" | "status", value: AdminRole | AdminStatus) {
  if (kind === "role") {
    return value === "SUPER_ADMIN"
      ? "border-leaf/20 bg-mint text-leaf"
      : "border-ink/10 bg-[#eef8f4] text-ink/60";
  }

  return value === "ACTIVE"
    ? "border-leaf/20 bg-mint text-leaf"
    : "border-clay/20 bg-orange-50 text-clay";
}

function RoleBadge({ role }: { role: AdminRole }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-extrabold ${badgeClass("role", role)}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-extrabold ${badgeClass("status", status)}`}>
      {status}
    </span>
  );
}

function MessageBanner({
  type,
  message,
  onDismiss,
}: {
  type: "success" | "error";
  message: string;
  onDismiss: () => void;
}) {
  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={[
        "mt-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold",
        isSuccess
          ? "border-leaf/20 bg-mint text-leaf"
          : "border-red-200 bg-red-50 text-red-600",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md p-1 transition-colors hover:bg-white/60"
        aria-label="Dismiss message"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <UserRound size={24} className="text-ink/25" aria-hidden="true" />
      <p className="text-sm font-semibold text-ink/45">{message}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: 8 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <div className="h-3 w-full max-w-28 animate-pulse rounded-full bg-ink/8" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function MobileLoadingCards() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-lg border border-ink/10 bg-white p-3">
          <div className="h-3 w-36 rounded-full bg-ink/8" />
          <div className="mt-2 h-2.5 w-48 rounded-full bg-ink/8" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-6 rounded-full bg-ink/8" />
            <div className="h-6 rounded-full bg-ink/8" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  tone = "neutral",
}: {
  label: string;
  icon?: typeof Eye;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "leaf" | "clay";
}) {
  const toneClass =
    tone === "leaf"
      ? "border-leaf/20 text-leaf hover:bg-mint"
      : tone === "clay"
        ? "border-clay/20 text-clay hover:bg-orange-50"
        : "border-ink/15 text-ink/60 hover:bg-[#eef8f4]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${toneClass}`}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {label}
    </button>
  );
}

function ConfirmationModal({
  action,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  action: PendingAction;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isClay = action.tone === "clay";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 py-6">
      <section className="w-full max-w-md rounded-xl border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{action.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/55">{action.body}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-ink/45 transition-colors hover:bg-[#eef8f4] hover:text-ink"
            aria-label="Close confirmation"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-ink/15 bg-white px-4 py-2 text-sm font-bold text-ink/60 transition-colors hover:bg-[#eef8f4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              isClay ? "bg-clay hover:bg-clay/90" : "bg-leaf hover:bg-leaf/90",
            ].join(" ")}
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {action.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function UserDetailsModal({
  user,
  isLoading,
  error,
  onClose,
}: {
  user: AdminUser | null;
  isLoading: boolean;
  error: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/45 px-4 py-6">
      <section className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">User details</p>
            <h2 className="mt-1 font-display text-lg font-bold text-ink">
              {user?.name ?? "Loading user"}
            </h2>
            {user && <p className="mt-1 text-sm font-semibold text-ink/45">{user.email}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink/45 transition-colors hover:bg-[#eef8f4] hover:text-ink"
            aria-label="Close details"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        {isLoading ? (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-ink/10 bg-[#f7faf9] px-4 py-6 text-sm font-semibold text-ink/45">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Loading user details...
          </div>
        ) : error ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        ) : user ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
                <p className="text-xs font-bold uppercase text-ink/40">Role</p>
                <div className="mt-2"><RoleBadge role={user.role} /></div>
              </div>
              <div className="rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
                <p className="text-xs font-bold uppercase text-ink/40">Status</p>
                <div className="mt-2"><StatusBadge status={user.status} /></div>
              </div>
              <div className="rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
                <p className="text-xs font-bold uppercase text-ink/40">Businesses count</p>
                <p className="mt-1 text-xl font-extrabold text-ink">{user.businessCount ?? user.businesses?.length ?? 0}</p>
              </div>
              <div className="rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
                <p className="text-xs font-bold uppercase text-ink/40">Last login</p>
                <p className="mt-1 text-sm font-extrabold text-ink">{formatDate(user.lastLoginAt)}</p>
              </div>
              <div className="rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
                <p className="text-xs font-bold uppercase text-ink/40">Created</p>
                <p className="mt-1 text-sm font-extrabold text-ink">{formatDate(user.createdAt)}</p>
              </div>
              <div className="rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
                <p className="text-xs font-bold uppercase text-ink/40">Updated</p>
                <p className="mt-1 text-sm font-extrabold text-ink">{formatDate(user.updatedAt)}</p>
              </div>
            </div>

            <section className="mt-5 rounded-lg border border-ink/10 bg-white p-3">
              <h3 className="text-sm font-bold text-ink">Businesses</h3>
              {user.businesses?.length ? (
                <div className="mt-2 divide-y divide-ink/8">
                  {user.businesses.map((business) => (
                    <div key={business.id} className="py-3">
                      <p className="text-sm font-extrabold text-ink">{business.name}</p>
                      <p className="mt-0.5 text-xs font-semibold text-ink/45">
                        {business.country} · {business.currency} · Created {formatDate(business.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-lg border border-dashed border-ink/15 bg-[#f7faf9] px-3 py-4 text-sm font-semibold text-ink/45">
                  This user has no businesses yet.
                </p>
              )}
            </section>
          </>
        ) : null}
      </section>
    </div>
  );
}

function UserFormModal({
  mode,
  form,
  isSubmitting,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  form: UserFormState;
  isSubmitting: boolean;
  error: string;
  onChange: (next: UserFormState) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const isCreate = mode === "create";

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/45 px-4 py-6">
      <form onSubmit={onSubmit} className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">{isCreate ? "Add user" : "Edit user"}</p>
            <h2 className="mt-1 font-display text-lg font-bold text-ink">{isCreate ? "Create platform user" : "Update platform user"}</h2>
            <p className="mt-1 text-sm font-semibold text-ink/45">Assign role, status, and login details.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg p-2 text-ink/45 transition-colors hover:bg-[#eef8f4] hover:text-ink" aria-label="Close user form">
            <X size={17} />
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <FormField label="Name" value={form.name} onChange={(value) => onChange({ ...form, name: value })} />
          <FormField label="Email" type="email" value={form.email} onChange={(value) => onChange({ ...form, email: value })} />
          <FormField label="Phone" required={false} value={form.phone} onChange={(value) => onChange({ ...form, phone: value })} />
          <FormField label={isCreate ? "Temporary password" : "New password"} type="password" required={isCreate} minLength={8} value={form.password} onChange={(value) => onChange({ ...form, password: value })} />
          <label className="text-xs font-bold text-ink/55">
            Role
            <select value={form.role} onChange={(event) => onChange({ ...form, role: event.target.value as AdminRole })} className="mt-1 w-full rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15">
              <option value="USER">USER</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </label>
          <label className="text-xs font-bold text-ink/55">
            Status
            <select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as AdminStatus })} className="mt-1 w-full rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15">
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-ink/15 bg-white px-4 py-2 text-sm font-bold text-ink/60 transition-colors hover:bg-[#eef8f4] disabled:opacity-60">Cancel</button>
          <button disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:opacity-60">
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {isCreate ? "Create user" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="text-xs font-bold text-ink/55">
      {label}
      <input required={required} minLength={minLength} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15" />
    </label>
  );
}

function UserActions({
  user,
  currentUserId,
  onView,
  onEdit,
  onRequestAction,
}: {
  user: AdminUser;
  currentUserId?: string;
  onView: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onRequestAction: (action: PendingAction) => void;
}) {
  const isSelf = currentUserId === user.id;
  const cannotSuspendSelf = isSelf && user.status === "ACTIVE";
  const cannotDemoteSelf = isSelf && user.role === "SUPER_ADMIN";

  return (
    <div className="flex flex-wrap gap-1.5">
      <ActionButton label="View" icon={Eye} onClick={() => onView(user)} />
      <ActionButton label="Edit" icon={Pencil} onClick={() => onEdit(user)} />
      {user.role === "USER" ? (
        <ActionButton
          label="Make SUPER_ADMIN"
          icon={ShieldCheck}
          tone="leaf"
          onClick={() =>
            onRequestAction({
              user,
              kind: "role",
              nextRole: "SUPER_ADMIN",
              title: "Make user SUPER_ADMIN?",
              body: `${user.name} will receive full platform administration access.`,
              confirmLabel: "Make SUPER_ADMIN",
              tone: "leaf",
            })
          }
        />
      ) : (
        <ActionButton
          label="Make USER"
          icon={UserRound}
          disabled={cannotDemoteSelf}
          onClick={() =>
            onRequestAction({
              user,
              kind: "role",
              nextRole: "USER",
              title: "Make user USER?",
              body: `${user.name} will lose SUPER_ADMIN access and return to a standard user role.`,
              confirmLabel: "Make USER",
              tone: "clay",
            })
          }
        />
      )}
      {user.status === "ACTIVE" ? (
        <ActionButton
          label="Suspend"
          icon={ShieldAlert}
          tone="clay"
          disabled={cannotSuspendSelf}
          onClick={() =>
            onRequestAction({
              user,
              kind: "status",
              nextStatus: "SUSPENDED",
              title: "Suspend user?",
              body: `${user.name} will lose access to BizTrack until their account is activated again.`,
              confirmLabel: "Suspend",
              tone: "clay",
            })
          }
        />
      ) : (
        <ActionButton
          label="Activate"
          icon={CheckCircle2}
          tone="leaf"
          onClick={() =>
            onRequestAction({
              user,
              kind: "status",
              nextStatus: "ACTIVE",
              title: "Activate user?",
              body: `${user.name} will regain access to BizTrack.`,
              confirmLabel: "Activate",
              tone: "leaf",
            })
          }
        />
      )}
      <ActionButton
        label="Delete"
        icon={Trash2}
        tone="clay"
        disabled={isSelf}
        onClick={() =>
          onRequestAction({
            user,
            kind: "delete",
            title: "Delete user?",
            body: `${user.name}, their businesses, products, sales, expenses, and subscriptions will be permanently deleted.`,
            confirmLabel: "Delete user",
            tone: "clay",
          })
        }
      />
    </div>
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | AdminRole>("");
  const [status, setStatus] = useState<"" | AdminStatus>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [detailsUser, setDetailsUser] = useState<AdminUser | null>(null);
  const [detailsError, setDetailsError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyUserForm);
  const [formError, setFormError] = useState("");
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;

    setIsLoading(true);
    const timeout = window.setTimeout(() => {
      getAdminUsersPage({
        search,
        role: role || undefined,
        status: status || undefined,
        page: page + 1,
        limit: rowsPerPage,
      })
        .then((result) => {
          if (!alive) return;
          setUsers(result.items);
          setTotal(result.pagination.total);
          setError("");
        })
        .catch((err) => {
          if (alive) setError(getApiErrorMessage(err));
        })
        .finally(() => {
          if (alive) setIsLoading(false);
        });
    }, 250);

    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [page, role, rowsPerPage, search, status]);

  useEffect(() => setPage(0), [role, rowsPerPage, search, status]);

  const openDetails = async (user: AdminUser) => {
    setDetailsOpen(true);
    setDetailsUser(null);
    setDetailsError("");
    setIsDetailsLoading(true);

    try {
      setDetailsUser(await getAdminUser(user.id));
    } catch (err) {
      setDetailsError(getApiErrorMessage(err));
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const openCreateForm = () => {
    setFormMode("create");
    setEditingUser(null);
    setForm(emptyUserForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEditForm = (user: AdminUser) => {
    setFormMode("edit");
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: "",
      password: "",
      role: user.role,
      status: user.status,
    });
    setFormError("");
    setFormOpen(true);
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsFormSubmitting(true);
    setFormError("");
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        status: form.status,
        ...(form.password ? { password: form.password } : {}),
      };
      const saved =
        formMode === "create"
          ? await createAdminUser({ ...payload, password: form.password })
          : editingUser
            ? await updateAdminUser(editingUser.id, payload)
            : null;
      if (!saved) return;

      setUsers((current) => {
        const exists = current.some((user) => user.id === saved.id);
        return exists ? current.map((user) => (user.id === saved.id ? { ...user, ...saved } : user)) : [saved, ...current];
      });
      if (formMode === "create") setTotal((current) => current + 1);
      setDetailsUser((current) => (current?.id === saved.id ? { ...current, ...saved } : current));
      setSuccess(`${saved.name} was ${formMode === "create" ? "created" : "updated"} successfully.`);
      setFormOpen(false);
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const requestAction = (action: PendingAction) => {
    const isSelf = currentUser?.id === action.user.id;

    if (isSelf && action.kind === "status" && action.nextStatus === "SUSPENDED") {
      setSuccess("");
      setError("You cannot suspend your own account.");
      return;
    }

    if (isSelf && action.kind === "role" && action.nextRole === "USER") {
      setSuccess("");
      setError("You cannot remove your own SUPER_ADMIN role.");
      return;
    }

    if (isSelf && action.kind === "delete") {
      setSuccess("");
      setError("You cannot delete your own account.");
      return;
    }

    setError("");
    setSuccess("");
    setPendingAction(action);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    setIsMutating(true);
    setError("");
    setSuccess("");

    try {
      if (pendingAction.kind === "delete") {
        await deleteAdminUser(pendingAction.user.id);
        setUsers((current) => current.filter((user) => user.id !== pendingAction.user.id));
        setTotal((current) => Math.max(0, current - 1));
        setDetailsUser((current) => (current?.id === pendingAction.user.id ? null : current));
        if (detailsUser?.id === pendingAction.user.id) setDetailsOpen(false);
        setSuccess(`${pendingAction.user.name} was deleted successfully.`);
        setPendingAction(null);
        return;
      }

      const updatedUser =
        pendingAction.kind === "role" && pendingAction.nextRole
          ? await updateAdminUserRole(pendingAction.user.id, pendingAction.nextRole)
          : pendingAction.nextStatus
            ? await updateAdminUserStatus(pendingAction.user.id, pendingAction.nextStatus)
            : pendingAction.user;

      setUsers((current) =>
        current.map((user) =>
          user.id === updatedUser.id
            ? {
                ...user,
                ...updatedUser,
              }
            : user,
        ),
      );
      setDetailsUser((current) =>
        current?.id === updatedUser.id
          ? {
              ...current,
              ...updatedUser,
              businesses: current.businesses ?? updatedUser.businesses,
            }
          : current,
      );
      setSuccess(`${updatedUser.name} was updated successfully.`);
      setPendingAction(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const hasUsers = users.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">SUPER_ADMIN</p>
          <h1 className="mt-1 font-display text-xl font-bold text-ink">Users management</h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">
            Add, edit, assign roles, view, and remove BizTrack user access.
          </p>
        </div>
        <button onClick={openCreateForm} className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90">
          <Plus size={16} />
          Add user
        </button>
      </div>

      <div className="mt-4 grid gap-2 rounded-lg border border-ink/10 bg-white p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_160px_160px]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email..."
            className="w-full rounded-lg border border-ink/15 bg-[#f7faf9] py-2.5 pl-10 pr-4 text-sm font-medium text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
          />
        </div>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as "" | AdminRole)}
          className="rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
        >
          <option value="">All roles</option>
          <option value="USER">USER</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "" | AdminStatus)}
          className="rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
      </div>

      {success && <MessageBanner type="success" message={success} onDismiss={() => setSuccess("")} />}
      {error && <MessageBanner type="error" message={error} onDismiss={() => setError("")} />}

      <section className="mt-4 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="hidden lg:block">
          <TableContainer>
            <Table aria-label="Admin users table">
              <TableHead>
                <TableRow className="bg-[#f7faf9]">
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Businesses count</TableCell>
                  <TableCell>Created date</TableCell>
                  <TableCell>Last login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <LoadingRows />
                ) : hasUsers ? (
                  users.map((adminUser) => (
                    <TableRow key={adminUser.id} hover>
                      <TableCell className="font-bold text-ink">{adminUser.name}</TableCell>
                      <TableCell>{adminUser.email}</TableCell>
                      <TableCell><RoleBadge role={adminUser.role} /></TableCell>
                      <TableCell><StatusBadge status={adminUser.status} /></TableCell>
                      <TableCell>{adminUser.businessCount ?? 0}</TableCell>
                      <TableCell>{formatDate(adminUser.createdAt)}</TableCell>
                      <TableCell>{formatDate(adminUser.lastLoginAt)}</TableCell>
                      <TableCell>
                        <UserActions
                          user={adminUser}
                          currentUserId={currentUser?.id}
                          onView={openDetails}
                          onEdit={openEditForm}
                          onRequestAction={requestAction}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyState message="No users match the current filters." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <div className="lg:hidden">
          {isLoading ? (
            <MobileLoadingCards />
          ) : hasUsers ? (
            <div className="space-y-3 p-3">
              {users.map((adminUser) => (
                <article key={adminUser.id} className="rounded-lg border border-ink/10 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-extrabold text-ink">{adminUser.name}</h2>
                      <p className="mt-0.5 truncate text-xs font-semibold text-ink/45">{adminUser.email}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <RoleBadge role={adminUser.role} />
                      <StatusBadge status={adminUser.status} />
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-[#f7faf9] p-2">
                      <dt className="font-bold text-ink/35">Businesses</dt>
                      <dd className="mt-0.5 font-extrabold text-ink">{adminUser.businessCount ?? 0}</dd>
                    </div>
                    <div className="rounded-lg bg-[#f7faf9] p-2">
                      <dt className="font-bold text-ink/35">Created</dt>
                      <dd className="mt-0.5 font-extrabold text-ink">{formatDate(adminUser.createdAt)}</dd>
                    </div>
                    <div className="col-span-2 rounded-lg bg-[#f7faf9] p-2">
                      <dt className="font-bold text-ink/35">Last login</dt>
                      <dd className="mt-0.5 font-extrabold text-ink">{formatDate(adminUser.lastLoginAt)}</dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    <UserActions
                      user={adminUser}
                      currentUserId={currentUser?.id}
                      onView={openDetails}
                      onEdit={openEditForm}
                      onRequestAction={requestAction}
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="No users match the current filters." />
          )}
        </div>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </section>

      {pendingAction && (
        <ConfirmationModal
          action={pendingAction}
          isSubmitting={isMutating}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmAction}
        />
      )}

      {detailsOpen && (
        <UserDetailsModal
          user={detailsUser}
          isLoading={isDetailsLoading}
          error={detailsError}
          onClose={() => setDetailsOpen(false)}
        />
      )}

      {formOpen && (
        <UserFormModal
          mode={formMode}
          form={form}
          isSubmitting={isFormSubmitting}
          error={formError}
          onChange={setForm}
          onClose={() => setFormOpen(false)}
          onSubmit={submitForm}
        />
      )}
    </div>
  );
}
