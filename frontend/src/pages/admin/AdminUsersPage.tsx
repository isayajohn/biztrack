import { useEffect, useState } from "react";
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
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import {
  getAdminUser,
  getAdminUsersPage,
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
  updateAdminUserApproval,
  updateAdminUserRole,
  updateAdminUserStatus,
  updateAdminUserVerification,
  resendAdminUserVerification,
  unlockAdminUser,
} from "../../services/adminApi";
import type { AdminApprovalStatus, AdminRole, AdminStatus, AdminUser } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";
import {
  AdminActionMenu,
  AdminFilterPanel,
  AdminPageFrame,
  AdminPageHeader,
  AdminTablePagination,
  EntityAvatar,
} from "../../components/admin/AdminTableUi";

type PendingAction = {
  user: AdminUser;
  kind: "role" | "status" | "approval" | "verification" | "resend" | "unlock" | "delete";
  nextRole?: AdminRole;
  nextStatus?: AdminStatus;
  nextApproval?: AdminApprovalStatus;
  verified?: boolean;
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

function ApprovalBadge({ status }: { status: AdminApprovalStatus }) {
  const classes = status === "APPROVED"
    ? "border-leaf/20 bg-mint text-leaf"
    : status === "REJECTED"
      ? "border-red-200 bg-red-50 text-red-600"
      : "border-amber-200 bg-amber-50 text-amber-700";
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-extrabold ${classes}`}>{status}</span>;
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
        <tr key={index}>
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <td key={cellIndex}>
              <div className="h-3 w-full max-w-28 animate-pulse rounded-full bg-ink/8" />
            </td>
          ))}
        </tr>
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
                <p className="text-xs font-bold uppercase text-ink/40">Approval</p>
                <div className="mt-2"><ApprovalBadge status={user.approvalStatus} /></div>
              </div>
              <div className="rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
                <p className="text-xs font-bold uppercase text-ink/40">Email verification</p>
                <p className="mt-1 text-sm font-extrabold text-ink">{user.emailVerifiedAt ? `Verified ${formatDate(user.emailVerifiedAt)}` : "Not verified"}</p>
              </div>
              <div className="rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
                <p className="text-xs font-bold uppercase text-ink/40">Login lock</p>
                <p className="mt-1 text-sm font-extrabold text-ink">{user.lockedUntil ? `Locked until ${formatDate(user.lockedUntil)}` : "Unlocked"}</p>
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
    <AdminActionMenu
      label={`Actions for ${user.name}`}
      items={[
        { label: "View details", icon: Eye, onClick: () => onView(user) },
        { label: "Edit user", icon: Pencil, onClick: () => onEdit(user) },
        user.approvalStatus === "APPROVED"
          ? { label: "Move to pending approval", icon: ShieldAlert, disabled: isSelf, onClick: () => onRequestAction({ user, kind: "approval", nextApproval: "PENDING", title: "Move account to pending?", body: `${user.name} will lose access until a super admin approves the account again.`, confirmLabel: "Move to pending", tone: "clay" }) }
          : { label: "Approve account", icon: ShieldCheck, tone: "success", onClick: () => onRequestAction({ user, kind: "approval", nextApproval: "APPROVED", title: "Approve account?", body: `${user.name} will be allowed to sign in after completing contact verification.`, confirmLabel: "Approve", tone: "leaf" }) },
        user.approvalStatus !== "REJECTED"
          ? { label: "Reject account", icon: ShieldAlert, tone: "warning", disabled: isSelf, onClick: () => onRequestAction({ user, kind: "approval", nextApproval: "REJECTED", title: "Reject account?", body: `${user.name} will be denied access until the account is approved again.`, confirmLabel: "Reject", tone: "clay" }) }
          : { label: "Return to pending", icon: ShieldAlert, onClick: () => onRequestAction({ user, kind: "approval", nextApproval: "PENDING", title: "Return account to pending?", body: `${user.name} can be reviewed and approved later.`, confirmLabel: "Return to pending", tone: "leaf" }) },
        user.emailVerifiedAt
          ? { label: "Mark email unverified", icon: AlertCircle, onClick: () => onRequestAction({ user, kind: "verification", verified: false, title: "Mark email unverified?", body: `${user.name} must verify the email address again before signing in.`, confirmLabel: "Mark unverified", tone: "clay" }) }
          : { label: "Mark email verified", icon: CheckCircle2, tone: "success", onClick: () => onRequestAction({ user, kind: "verification", verified: true, title: "Verify email manually?", body: `This confirms ${user.name}'s email without requiring the email link.`, confirmLabel: "Mark verified", tone: "leaf" }) },
        ...(!user.emailVerifiedAt ? [{ label: "Resend verification email", icon: CheckCircle2, onClick: () => onRequestAction({ user, kind: "resend" as const, title: "Resend verification email?", body: `A fresh activation link will be sent to ${user.email}.`, confirmLabel: "Send email", tone: "leaf" as const }) }] : []),
        ...(user.lockedUntil || (user.failedLoginAttempts ?? 0) > 0 ? [{ label: "Unlock login", icon: ShieldCheck, tone: "success" as const, onClick: () => onRequestAction({ user, kind: "unlock" as const, title: "Unlock account?", body: `Failed login attempts and the temporary lock for ${user.name} will be cleared.`, confirmLabel: "Unlock", tone: "leaf" as const }) }] : []),
        user.role === "USER"
          ? {
              label: "Make SUPER_ADMIN",
              icon: ShieldCheck,
              tone: "success",
              onClick: () => onRequestAction({ user, kind: "role", nextRole: "SUPER_ADMIN", title: "Make user SUPER_ADMIN?", body: `${user.name} will receive full platform administration access.`, confirmLabel: "Make SUPER_ADMIN", tone: "leaf" }),
            }
          : {
              label: "Make USER",
              icon: UserRound,
              disabled: cannotDemoteSelf,
              onClick: () => onRequestAction({ user, kind: "role", nextRole: "USER", title: "Make user USER?", body: `${user.name} will lose SUPER_ADMIN access and return to a standard user role.`, confirmLabel: "Make USER", tone: "clay" }),
            },
        user.status === "ACTIVE"
          ? {
              label: "Suspend user",
              icon: ShieldAlert,
              tone: "warning",
              disabled: cannotSuspendSelf,
              onClick: () => onRequestAction({ user, kind: "status", nextStatus: "SUSPENDED", title: "Suspend user?", body: `${user.name} will lose access to BizTrack until their account is activated again.`, confirmLabel: "Suspend", tone: "clay" }),
            }
          : {
              label: "Activate user",
              icon: CheckCircle2,
              tone: "success",
              onClick: () => onRequestAction({ user, kind: "status", nextStatus: "ACTIVE", title: "Activate user?", body: `${user.name} will regain access to BizTrack.`, confirmLabel: "Activate", tone: "leaf" }),
            },
        {
          label: "Delete user",
          icon: Trash2,
          tone: "danger",
          disabled: isSelf,
          onClick: () => onRequestAction({ user, kind: "delete", title: "Delete user?", body: `${user.name}, their businesses, products, sales, expenses, and subscriptions will be permanently deleted.`, confirmLabel: "Delete user", tone: "clay" }),
        },
      ]}
    />
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | AdminRole>("");
  const [status, setStatus] = useState<"" | AdminStatus>("");
  const [approvalStatus, setApprovalStatus] = useState<"" | AdminApprovalStatus>("");
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
        approvalStatus: approvalStatus || undefined,
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
  }, [approvalStatus, page, role, rowsPerPage, search, status]);

  useEffect(() => setPage(0), [approvalStatus, role, rowsPerPage, search, status]);

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

    if (isSelf && action.kind === "approval" && action.nextApproval !== "APPROVED") {
      setSuccess("");
      setError("You cannot revoke approval from your own account.");
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

      if (pendingAction.kind === "resend") {
        const result = await resendAdminUserVerification(pendingAction.user.id);
        setSuccess(result.message);
        setPendingAction(null);
        return;
      }

      const updatedUser =
        pendingAction.kind === "role" && pendingAction.nextRole
          ? await updateAdminUserRole(pendingAction.user.id, pendingAction.nextRole)
          : pendingAction.kind === "approval" && pendingAction.nextApproval
            ? await updateAdminUserApproval(pendingAction.user.id, pendingAction.nextApproval)
          : pendingAction.kind === "verification" && pendingAction.verified !== undefined
            ? await updateAdminUserVerification(pendingAction.user.id, pendingAction.verified)
          : pendingAction.kind === "unlock"
            ? await unlockAdminUser(pendingAction.user.id)
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
    <AdminPageFrame>
      <AdminPageHeader
        icon={Users}
        title="Users Management"
        description="Approve accounts, manage verification, unlock access, assign roles, suspend, edit, and remove users."
        action={<button onClick={openCreateForm} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#e60023] px-5 text-sm font-bold text-white transition-colors hover:bg-[#cc001f]"><Plus size={17} />Add User</button>}
      />

      <div className="mt-7 space-y-5">
        <AdminFilterPanel>
          <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
            <div className="relative"><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#62625b]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email..." className="h-14 w-full rounded-2xl border border-[#dadad3] bg-[#fbfbf9] pl-12 pr-4 text-sm font-semibold text-ink outline-none transition focus:border-ink focus:bg-white focus:ring-2 focus:ring-[#435ee5]" /></div>
            <select value={role} onChange={(event) => setRole(event.target.value as "" | AdminRole)} className="h-14 rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 text-sm font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-[#435ee5]"><option value="">All roles</option><option value="USER">USER</option><option value="SUPER_ADMIN">SUPER_ADMIN</option></select>
            <select value={status} onChange={(event) => setStatus(event.target.value as "" | AdminStatus)} className="h-14 rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 text-sm font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-[#435ee5]"><option value="">All statuses</option><option value="ACTIVE">ACTIVE</option><option value="SUSPENDED">SUSPENDED</option></select>
            <select value={approvalStatus} onChange={(event) => setApprovalStatus(event.target.value as "" | AdminApprovalStatus)} className="h-14 rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 text-sm font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-[#435ee5]"><option value="">All approvals</option><option value="PENDING">PENDING</option><option value="APPROVED">APPROVED</option><option value="REJECTED">REJECTED</option></select>
          </div>
        </AdminFilterPanel>

        {success && <MessageBanner type="success" message={success} onDismiss={() => setSuccess("")} />}
        {error && <MessageBanner type="error" message={error} onDismiss={() => setError("")} />}

        <section className="portal-table-card">
          <div className="hidden lg:block">
            <table className="portal-data-table" aria-label="Admin users table">
              <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Approval</th><th>Verified</th><th>Businesses</th><th>Created</th><th>Last login</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {isLoading ? <LoadingRows /> : hasUsers ? users.map((adminUser) => (
                  <tr key={adminUser.id}>
                    <td><div className="flex min-w-0 items-center gap-4"><EntityAvatar value={adminUser.name} /><div><p className="font-extrabold text-ink">{adminUser.name}</p><p className="mt-1 text-sm font-semibold text-[#62625b]">{adminUser.email}</p></div></div></td>
                    <td><RoleBadge role={adminUser.role} /></td>
                    <td><StatusBadge status={adminUser.status} /></td>
                    <td><ApprovalBadge status={adminUser.approvalStatus} /></td>
                    <td className="font-semibold text-[#33332e]">{adminUser.emailVerifiedAt ? "Email" : adminUser.phoneVerifiedAt ? "Phone" : "No"}</td>
                    <td><span className="font-extrabold text-ink">{adminUser.businessCount ?? 0}</span></td>
                    <td className="font-semibold text-[#33332e]">{formatDate(adminUser.createdAt)}</td>
                    <td className="font-semibold text-[#33332e]">{formatDate(adminUser.lastLoginAt)}</td>
                    <td className="text-right"><UserActions user={adminUser} currentUserId={currentUser?.id} onView={openDetails} onEdit={openEditForm} onRequestAction={requestAction} /></td>
                  </tr>
                )) : <tr><td colSpan={9}><EmptyState message="No users match the current filters." /></td></tr>}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#e5e5e0] lg:hidden">
            {isLoading ? <MobileLoadingCards /> : hasUsers ? users.map((adminUser) => (
              <article key={adminUser.id} className="p-5">
                <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><EntityAvatar value={adminUser.name} /><div className="min-w-0"><h2 className="truncate text-sm font-extrabold text-ink">{adminUser.name}</h2><p className="mt-1 truncate text-xs font-semibold text-[#62625b]">{adminUser.email}</p></div></div><UserActions user={adminUser} currentUserId={currentUser?.id} onView={openDetails} onEdit={openEditForm} onRequestAction={requestAction} /></div>
                <div className="mt-3 flex flex-wrap gap-2"><RoleBadge role={adminUser.role} /><StatusBadge status={adminUser.status} /><ApprovalBadge status={adminUser.approvalStatus} /></div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-2xl bg-[#f6f6f3] p-3"><dt className="font-bold text-[#62625b]">Businesses</dt><dd className="mt-1 font-extrabold text-ink">{adminUser.businessCount ?? 0}</dd></div><div className="rounded-2xl bg-[#f6f6f3] p-3"><dt className="font-bold text-[#62625b]">Created</dt><dd className="mt-1 font-extrabold text-ink">{formatDate(adminUser.createdAt)}</dd></div><div className="col-span-2 rounded-2xl bg-[#f6f6f3] p-3"><dt className="font-bold text-[#62625b]">Last login</dt><dd className="mt-1 font-extrabold text-ink">{formatDate(adminUser.lastLoginAt)}</dd></div></dl>
              </article>
            )) : <EmptyState message="No users match the current filters." />}
          </div>

          <AdminTablePagination total={total} page={page} rowsPerPage={rowsPerPage} onPageChange={setPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(0); }} />
        </section>
      </div>

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
    </AdminPageFrame>
  );
}
