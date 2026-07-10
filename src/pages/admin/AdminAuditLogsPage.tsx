import { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { AlertCircle, ClipboardList, Search } from "lucide-react";
import { getAuditLogs } from "../../services/adminApi";
import type { AuditLog } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";

const ACTION_OPTIONS = [
  { value: "USER_ROLE_CHANGED", label: "User role changed" },
  { value: "USER_SUSPENDED", label: "User suspended" },
  { value: "USER_ACTIVATED", label: "User activated" },
  { value: "USER_DETAILS_VIEWED", label: "User details viewed" },
];

function actionLabel(action: string) {
  return ACTION_OPTIONS.find((option) => option.value === action)?.label ?? action.replace(/_/g, " ");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function metadataFor(log: AuditLog) {
  return log.metadata ?? log.details ?? null;
}

function safeJson(value: unknown) {
  if (value == null) return "-";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
      <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <ClipboardList size={24} className="text-ink/25" aria-hidden="true" />
      <p className="text-sm font-semibold text-ink/45">{message}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <div className="h-3 w-full max-w-32 animate-pulse rounded-full bg-ink/8" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function ActionBadge({ action }: { action: string }) {
  const isSensitiveView = action === "USER_DETAILS_VIEWED";
  const isRole = action === "USER_ROLE_CHANGED";
  const tone = isRole
    ? "border-sky-200 bg-sky-50 text-sky-700"
    : isSensitiveView
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : action === "USER_SUSPENDED"
        ? "border-clay/20 bg-orange-50 text-clay"
        : "border-leaf/20 bg-mint text-leaf";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-extrabold ${tone}`}>
      {actionLabel(action)}
    </span>
  );
}

function MetadataBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-32 max-w-md overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#f7faf9] px-3 py-2 text-xs font-semibold leading-5 text-ink/60">
      {safeJson(value)}
    </pre>
  );
}

function AuditLogMobileCard({ log }: { log: AuditLog }) {
  const targetId = log.targetId ?? log.targetUserId ?? "-";

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink/45">{formatDateTime(log.createdAt)}</p>
          <p className="mt-1 truncate text-sm font-extrabold text-ink">
            {log.actor ? log.actor.name : "System"}
          </p>
          {log.actor && <p className="truncate text-xs font-semibold text-ink/45">{log.actor.email}</p>}
        </div>
        <ActionBadge action={log.action} />
      </div>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg bg-[#f7faf9] p-2">
          <dt className="font-bold text-ink/35">Target Type</dt>
          <dd className="mt-0.5 font-extrabold text-ink">{log.targetType}</dd>
        </div>
        <div className="rounded-lg bg-[#f7faf9] p-2">
          <dt className="font-bold text-ink/35">Target ID</dt>
          <dd className="mt-0.5 break-all font-mono text-[11px] font-extrabold text-ink">{targetId}</dd>
        </div>
      </dl>

      <div className="mt-3">
        <p className="mb-1 text-xs font-bold uppercase text-ink/35">Details</p>
        <MetadataBlock value={metadataFor(log)} />
      </div>
    </article>
  );
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    let alive = true;

    setIsLoading(true);
    const timeout = window.setTimeout(() => {
      getAuditLogs({
        action: action || undefined,
        actor,
        date: date || undefined,
        search,
        page: page + 1,
        limit: rowsPerPage,
      })
        .then((result) => {
          if (!alive) return;
          setLogs(result.items);
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
  }, [action, actor, date, page, rowsPerPage, search]);

  useEffect(() => setPage(0), [action, actor, date, rowsPerPage, search]);

  const hasLogs = logs.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">SUPER_ADMIN</p>
        <h1 className="mt-1 font-display text-xl font-bold text-ink">Audit logs</h1>
        <p className="mt-1 text-sm font-semibold text-ink/45">
          Review administrative actions, sensitive views, and user access changes.
        </p>
      </div>

      <div className="mt-4 grid gap-2 rounded-lg border border-ink/10 bg-white p-3 shadow-sm lg:grid-cols-[180px_minmax(0,1fr)_170px_minmax(0,1fr)]">
        <select
          value={action}
          onChange={(event) => setAction(event.target.value)}
          className="rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
        >
          <option value="">All actions</option>
          {ACTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={actor}
            onChange={(event) => setActor(event.target.value)}
            placeholder="Filter by admin name or email..."
            className="w-full rounded-lg border border-ink/15 bg-[#f7faf9] py-2.5 pl-10 pr-4 text-sm font-medium text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
          />
        </div>

        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
        />

        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search target ID or metadata..."
            className="w-full rounded-lg border border-ink/15 bg-[#f7faf9] py-2.5 pl-10 pr-4 text-sm font-medium text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
          />
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <section className="mt-4 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="hidden lg:block">
          <TableContainer>
            <Table aria-label="Admin audit logs table">
              <TableHead>
                <TableRow className="bg-[#f7faf9]">
                  <TableCell>Date</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Target Type</TableCell>
                  <TableCell>Target ID</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <LoadingRows />
                ) : hasLogs ? (
                  logs.map((log) => {
                    const targetId = log.targetId ?? log.targetUserId ?? "-";

                    return (
                      <TableRow key={log.id} hover>
                        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                        <TableCell>
                          {log.actor ? (
                            <div>
                              <p className="font-bold text-ink">{log.actor.name}</p>
                              <p className="text-xs font-semibold text-ink/45">{log.actor.email}</p>
                            </div>
                          ) : (
                            "System"
                          )}
                        </TableCell>
                        <TableCell><ActionBadge action={log.action} /></TableCell>
                        <TableCell>{log.targetType}</TableCell>
                        <TableCell className="max-w-48 break-all font-mono text-xs">{targetId}</TableCell>
                        <TableCell><MetadataBlock value={metadataFor(log)} /></TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState message="No audit logs match the current filters." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <div className="lg:hidden">
          {isLoading ? (
            <div className="space-y-3 p-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-lg border border-ink/10 bg-white p-3">
                  <div className="h-3 w-32 rounded-full bg-ink/8" />
                  <div className="mt-2 h-2.5 w-48 rounded-full bg-ink/8" />
                  <div className="mt-4 h-20 rounded-lg bg-ink/8" />
                </div>
              ))}
            </div>
          ) : hasLogs ? (
            <div className="space-y-3 p-3">
              {logs.map((log) => (
                <AuditLogMobileCard key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <EmptyState message="No audit logs match the current filters." />
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
    </div>
  );
}
