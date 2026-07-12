import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { ArrowLeft, Printer } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { getProductById } from "../services/productService";
import type { Product } from "../types/product";
import { formatCurrency } from "../utils/format";

export default function ProductLabelPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => { getProductById(id).then((value) => setProduct(value ?? null)).catch((err) => setError(getApiErrorMessage(err))); }, [id]);
  useEffect(() => {
    if (!product) return;
    const value = product.barcode || product.sku || product.id;
    if (barcodeRef.current) JsBarcode(barcodeRef.current, value, { format: "CODE128", width: 2, height: 70, displayValue: true, margin: 8, fontSize: 14 });
    if (qrRef.current) void QRCode.toCanvas(qrRef.current, JSON.stringify({ type: "biztrack-product", id: product.id, name: product.name, barcode: product.barcode ?? null, sku: product.sku ?? null }), { width: 150, margin: 1 });
  }, [product]);

  if (error) return <div className="p-6 text-sm font-semibold text-red-600">{error}</div>;
  if (!product) return <div className="p-6 text-sm font-semibold text-ink/45">Loading product label...</div>;

  return <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6"><div className="mb-4 flex items-center justify-between print:hidden"><Link to="/products" className="inline-flex items-center gap-2 text-sm font-bold text-ink/55"><ArrowLeft size={16} /> Back to products</Link><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white"><Printer size={16} /> Print labels</button></div><div className="grid gap-5 sm:grid-cols-2"><Label product={product} businessName={user?.businessName ?? "BizTrack"} barcodeRef={barcodeRef} qrRef={qrRef} currency={user?.currency} /><div className="rounded-2xl border border-ink/10 bg-white p-6 print:hidden"><h2 className="font-bold text-ink">Label information</h2><dl className="mt-4 space-y-3 text-sm"><Row label="Product" value={product.name} /><Row label="Brand" value={product.brand || "—"} /><Row label="SKU" value={product.sku || "—"} /><Row label="Barcode" value={product.barcode || "Uses SKU/product ID"} /><Row label="Price" value={formatCurrency(product.sellingPrice, user?.currency)} /></dl><p className="mt-5 text-xs font-semibold leading-5 text-ink/45">The QR code contains the BizTrack product ID, name, SKU, and barcode for scanner integrations.</p></div></div></div>;
}

function Label({ product, businessName, barcodeRef, qrRef, currency }: { product: Product; businessName: string; barcodeRef: React.RefObject<SVGSVGElement | null>; qrRef: React.RefObject<HTMLCanvasElement | null>; currency?: string }) {
  return <article className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/20 bg-white p-5 text-center print:border-solid"><p className="text-xs font-bold uppercase tracking-widest text-ink/40">{businessName}</p><h1 className="mt-2 text-xl font-black text-ink">{product.name}</h1>{product.brand && <p className="mt-1 text-sm font-semibold text-ink/50">{product.brand}</p>}<p className="mt-2 text-2xl font-black text-leaf">{formatCurrency(product.sellingPrice, currency)}</p><svg ref={barcodeRef} className="mt-3 max-w-full" /><canvas ref={qrRef} className="mt-3 h-[120px] w-[120px]" /><p className="mt-2 text-[10px] font-semibold text-ink/40">Scan QR for product details</p></article>;
}
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><dt className="font-semibold text-ink/45">{label}</dt><dd className="text-right font-bold text-ink">{value}</dd></div>; }
