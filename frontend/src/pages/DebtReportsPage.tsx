import { useEffect, useState } from "react";
import { FileDown, Landmark, Sheet, Users } from "lucide-react";
import { getApiErrorMessage } from "../services/apiClient";
import { getDebtAgingReport } from "../services/debtApi";
import type { AgingBucket, DebtType } from "../services/debtApi";
import { exportTableCsv, exportTableExcel, exportTablePdf } from "../utils/exportUtils";
import { formatCurrency } from "../utils/format";
import { Card, ErrorBox, Loading, ReportShell } from "./CashFlowReportPage";
import { useAuth } from "../auth/AuthContext";

export default function DebtReportsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "TZS";
  const [type, setType] = useState<DebtType | "">("");
  const [buckets, setBuckets] = useState<AgingBucket[] | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getDebtAgingReport(type || undefined);
      setBuckets(data.buckets);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const columns = [
    { header: "Aging bucket", value: (row: AgingBucket) => row.label },
    { header: "Debts", value: (row: AgingBucket) => row.count },
    { header: "Amount", value: (row: AgingBucket) => row.amount },
  ];
  const pdf = () => buckets && exportTablePdf({ title: "Debt Aging Report", subtitle: type ? `${type} debts` : "All debts", fileName: "debt-aging-report.pdf", columns, rows: buckets });
  const excel = () => buckets ? exportTableExcel({ sheetName: "Aging Report", fileName: "debt-aging-report.xlsx", columns, rows: buckets }) : undefined;
  const csv = () => buckets && exportTableCsv({ fileName: "debt-aging-report.csv", columns, rows: buckets });

  const totalAmount = buckets?.reduce((sum, b) => sum + b.amount, 0) ?? 0;
  const overdueAmount = buckets?.filter((b) => b.label !== "Not yet due").reduce((sum, b) => sum + b.amount, 0) ?? 0;

  return (
    <ReportShell title="Debt Aging Report" subtitle="Outstanding balances grouped by how overdue they are." backTo="/debts" backLabel="Debts Overview">
      <section className="mt-4 flex flex-col gap-3 rounded-xl border border-ink/10 bg-white p-4 shadow-sm lg:flex-row lg:items-end">
        <label className="text-xs font-bold text-ink/50">
          Debt type
          <select value={type} onChange={(e) => setType(e.target.value as DebtType | "")} className="mt-1 block rounded-xl border border-ink/15 px-3 py-2 text-sm">
            <option value="">All debts</option>
            <option value="CUSTOMER">Customer debts</option>
            <option value="SUPPLIER">Supplier debts</option>
          </select>
        </label>
        <div className="flex gap-2 lg:ml-auto">
          <button disabled={!buckets?.length} onClick={pdf} className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2 text-xs font-bold disabled:opacity-40"><FileDown size={14} /> PDF</button>
          <button disabled={!buckets?.length} onClick={() => csv()} className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2 text-xs font-bold disabled:opacity-40"><FileDown size={14} /> CSV</button>
          <button disabled={!buckets?.length} onClick={() => void excel()} className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2 text-xs font-bold disabled:opacity-40"><Sheet size={14} /> Excel</button>
        </div>
      </section>

      {error && <ErrorBox text={error} />}
      {isLoading ? (
        <Loading />
      ) : buckets && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Card label="Total outstanding" value={formatCurrency(totalAmount, currency)} icon={type === "SUPPLIER" ? Landmark : Users} tone="text-ink" />
            <Card label="Overdue amount" value={formatCurrency(overdueAmount, currency)} icon={Landmark} tone="text-red-600" />
          </div>

          <section className="portal-table-card mt-4">
            <table className="portal-data-table w-full text-left text-sm">
              <thead className="bg-[#f7faf9] text-xs uppercase text-ink/45">
                <tr>
                  <th className="px-4 py-3">Aging bucket</th>
                  <th className="px-4 py-3 text-right">Debts</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {buckets.map((bucket) => (
                  <tr key={bucket.label}>
                    <td className="px-4 py-3 font-bold">{bucket.label}</td>
                    <td className="px-4 py-3 text-right">{bucket.count}</td>
                    <td className={`px-4 py-3 text-right font-bold ${bucket.label === "Not yet due" ? "text-ink" : "text-red-600"}`}>{formatCurrency(bucket.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </ReportShell>
  );
}
