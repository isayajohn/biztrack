import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import BrandLogo, { clearBrandLogoCache } from "../../components/BrandLogo";
import {
  getAdminBranding,
  removeAdminBrandingLogo,
  updateAdminBranding,
} from "../../services/adminApi";
import type { AppBranding } from "../../services/landingApi";
import { getApiErrorMessage } from "../../services/apiClient";

const MAX_LOGO_BYTES = 3 * 1024 * 1024;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [branding, setBranding] = useState<AppBranding | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoadingBranding, setIsLoadingBranding] = useState(true);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [isRemovingLogo, setIsRemovingLogo] = useState(false);

  useEffect(() => {
    let alive = true;

    getAdminBranding()
      .then((result) => {
        if (alive) setBranding(result);
      })
      .catch((error) => {
        if (alive) setNotice({ type: "error", text: getApiErrorMessage(error) });
      })
      .finally(() => {
        if (alive) setIsLoadingBranding(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNotice(null);

    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", text: "Choose a valid image file." });
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      setNotice({ type: "error", text: "Logo must be under 3 MB." });
      return;
    }

    setIsSavingLogo(true);
    try {
      const logoDataUrl = await readFileAsDataUrl(file);
      const updated = await updateAdminBranding({
        logoDataUrl,
        logoFileName: file.name,
        logoMimeType: file.type,
      });
      setBranding(updated);
      clearBrandLogoCache();
      setNotice({ type: "success", text: "Logo updated across the app." });
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsSavingLogo(false);
      event.target.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    setIsRemovingLogo(true);
    setNotice(null);
    try {
      const updated = await removeAdminBrandingLogo();
      setBranding(updated);
      clearBrandLogoCache();
      setNotice({ type: "success", text: "Logo removed. The default BizTrack logo is now active." });
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsRemovingLogo(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <h1 className="font-display text-xl font-bold text-ink">Admin Settings</h1>
      {notice && (
        <div
          className={[
            "mt-4 rounded-lg border px-4 py-3 text-sm font-semibold",
            notice.type === "success"
              ? "border-leaf/20 bg-mint text-leaf"
              : "border-red-200 bg-red-50 text-red-600",
          ].join(" ")}
        >
          {notice.text}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-leaf">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-ink">{user?.name ?? "Super Admin"}</p>
              <p className="text-xs font-semibold text-ink/50">{user?.email}</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-[#f7faf9] px-3 py-2">
              <dt className="font-semibold text-ink/50">Role</dt>
              <dd className="font-extrabold text-ink">{user?.role}</dd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#f7faf9] px-3 py-2">
              <dt className="font-semibold text-ink/50">Status</dt>
              <dd className="font-extrabold text-ink">{user?.status}</dd>
            </div>
          </dl>
        </div>

        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">Branding</p>
              <h2 className="mt-1 font-display text-lg font-bold text-ink">Logo management</h2>
              <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-ink/50">
                Upload one transparent PNG, SVG, JPG, or WebP logo. The preview checks both light and dark surfaces so the logo does not disappear in the header, footer, app shell, or email templates.
              </p>
            </div>

            <div className="grid gap-2">
              <div className="rounded-lg border border-ink/10 bg-white px-4 py-3">
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-ink/35">Light surface</p>
                <BrandLogo className="h-auto w-44 max-w-full" />
              </div>
              <div className="rounded-lg border border-ink/10 bg-[#111815] px-4 py-3">
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-white/35">Dark surface</p>
                <BrandLogo className="h-auto w-44 max-w-full" variant="dark" />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-ink/10 bg-[#f7faf9] p-4">
            {isLoadingBranding ? (
              <div className="flex items-center gap-2 text-sm font-bold text-ink/45">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Loading branding...
              </div>
            ) : (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-white px-3 py-2">
                  <dt className="font-semibold text-ink/50">Current file</dt>
                  <dd className="mt-1 truncate font-extrabold text-ink">
                    {branding?.logoFileName ?? "Default BizTrack logo"}
                  </dd>
                </div>
                <div className="rounded-lg bg-white px-3 py-2">
                  <dt className="font-semibold text-ink/50">Source</dt>
                  <dd className="mt-1 font-extrabold text-ink">
                    {branding?.logoUrl ? "Managed by super admin" : "Default asset"}
                  </dd>
                </div>
              </dl>
            )}
          </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={handleFileChange}
          className="hidden"
        />

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isSavingLogo || isRemovingLogo}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingLogo ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
              {branding?.logoUrl ? "Change logo" : "Add logo"}
            </button>
            <button
              type="button"
              onClick={handleRemoveLogo}
              disabled={isSavingLogo || isRemovingLogo || !branding?.logoUrl}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-clay/20 px-4 py-2.5 text-sm font-bold text-clay transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isRemovingLogo ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
              Remove logo
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
