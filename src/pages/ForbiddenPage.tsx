import { ArrowRight, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f4] px-4 py-10 text-ink">
      <section className="w-full max-w-md rounded-xl border border-ink/10 bg-white p-5 text-center shadow-soft sm:p-7">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-orange-50 text-clay">
          <ShieldAlert size={24} aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight">
          Access denied
        </h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/55">
          You do not have permission to view this page.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 sm:w-auto"
        >
          Go to Dashboard
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
