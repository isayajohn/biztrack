import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../../services/adminApi";
import type { AdminRole, AdminStatus, AdminUser } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");

  const loadUser = () => {
    if (!id) return;
    getAdminUser(id).then(setUser).catch((err) => setError(getApiErrorMessage(err)));
  };

  useEffect(loadUser, [id]);

  const updateStatus = async (status: AdminStatus) => {
    if (!id) return;
    setError("");
    try {
      setUser(await updateAdminUserStatus(id, status));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const updateRole = async (role: AdminRole) => {
    if (!id) return;
    setError("");
    try {
      setUser(await updateAdminUserRole(id, role));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  if (!user) {
    return <div className="mx-auto max-w-7xl px-4 py-5 text-sm font-semibold text-ink/45 sm:px-6">Loading user...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      <h1 className="font-display text-xl font-bold text-ink">{user.name}</h1>
      <p className="mt-1 text-sm font-semibold text-ink/45">{user.email}</p>
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

      <section className="mt-5 rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase text-ink/45">
            Status
            <select value={user.status} onChange={(event) => updateStatus(event.target.value as AdminStatus)} className="mt-1 block w-full rounded-xl border border-ink/15 px-3 py-2 text-sm font-bold text-ink">
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </label>
          <label className="text-xs font-bold uppercase text-ink/45">
            Role
            <select value={user.role} onChange={(event) => updateRole(event.target.value as AdminRole)} className="mt-1 block w-full rounded-xl border border-ink/15 px-3 py-2 text-sm font-bold text-ink">
              <option value="USER">USER</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-ink">Businesses</h2>
        <div className="mt-3 divide-y divide-ink/8">
          {(user.businesses ?? []).map((business) => (
            <div key={business.id} className="py-3">
              <p className="font-bold text-ink">{business.name}</p>
              <p className="text-xs font-semibold text-ink/45">
                {business.country} · {business.currency}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
