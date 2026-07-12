import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportColumn<T> = { header: string; value: (row: T) => string | number };

export function exportTablePdf<T>(options: {
  title: string;
  subtitle?: string;
  fileName: string;
  columns: ExportColumn<T>[];
  rows: T[];
  summary?: Array<[string, string]>;
}) {
  const document = new jsPDF({ orientation: options.columns.length > 6 ? "landscape" : "portrait" });
  document.setFontSize(17);
  document.text(options.title, 14, 16);
  if (options.subtitle) { document.setFontSize(9); document.setTextColor(90); document.text(options.subtitle, 14, 23); }
  let startY = options.subtitle ? 29 : 23;
  if (options.summary?.length) {
    document.setFontSize(10); document.setTextColor(30);
    options.summary.forEach(([label, value], index) => document.text(`${label}: ${value}`, 14 + (index % 3) * 62, startY + Math.floor(index / 3) * 6));
    startY += Math.ceil(options.summary.length / 3) * 6 + 4;
  }
  autoTable(document, { startY, head: [options.columns.map((column) => column.header)], body: options.rows.map((row) => options.columns.map((column) => column.value(row))), styles: { fontSize: 8 }, headStyles: { fillColor: [18, 184, 144] } });
  document.save(options.fileName);
}

export async function exportTableExcel<T>(options: {
  sheetName: string;
  fileName: string;
  columns: ExportColumn<T>[];
  rows: T[];
}) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(options.sheetName.slice(0, 31));
  sheet.columns = options.columns.map((column) => ({ header: column.header, key: column.header, width: Math.max(14, column.header.length + 4) }));
  for (const row of options.rows) sheet.addRow(Object.fromEntries(options.columns.map((column) => [column.header, column.value(row)])));
  const header = sheet.getRow(1); header.font = { bold: true, color: { argb: "FFFFFFFF" } }; header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF12B890" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a"); link.href = url; link.download = options.fileName; link.click(); URL.revokeObjectURL(url);
}
