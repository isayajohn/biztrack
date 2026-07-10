import { apiClient } from "./apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  movementType: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  referenceType: string | null;
  reason: string | null;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: { id: string; name: string } | null;
  status: string;
  totalAmount: number;
  paidAmount: number;
  expectedDate: string | null;
  receivedDate: string | null;
  items: PurchaseOrderItem[];
  notes: string | null;
  createdAt: string;
}

export interface DamagedStock {
  id: string;
  product: { id: string; name: string };
  quantity: number;
  reason: string;
  comment: string | null;
  status: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  product: { id: string; name: string };
  systemStock: number;
  physicalCount: number;
  difference: number;
  adjustmentType: string;
  reason: string | null;
  status: string;
  createdAt: string;
}

export interface InventoryNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface InventoryDashboard {
  totalProducts: number;
  activeProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiredItems: number;
  nearExpiryItems: number;
  totalStockValue: number;
  totalRetailValue: number;
  todayMovements: number;
  unreadNotifications: number;
  topProducts: Record<string, unknown>[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Laravel always returns { success, data: { <key>: [...] } } for lists
// or { success, data: { ...item } } for single items.
// This extracts response.data.data (the inner payload).
function inner(response: { data: unknown }): Record<string, unknown> {
  const body = response.data as { data?: unknown };
  const payload = body?.data ?? body;
  return (payload ?? {}) as Record<string, unknown>;
}

function arr<T>(response: { data: unknown }, key: string): T[] {
  const payload = inner(response);
  const val = payload[key];
  return Array.isArray(val) ? (val as T[]) : [];
}

function single<T>(response: { data: unknown }): T {
  return inner(response) as T;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get("/categories");
  return arr<Category>(response, "categories");
}

export async function createCategory(data: {
  name: string;
  description?: string;
}): Promise<Category> {
  const response = await apiClient.post("/categories", data);
  return single<Category>(response);
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; description: string; isActive: boolean }>,
): Promise<Category> {
  const response = await apiClient.put(`/categories/${id}`, data);
  return single<Category>(response);
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  const response = await apiClient.get("/suppliers");
  return arr<Supplier>(response, "suppliers");
}

export async function createSupplier(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<Supplier> {
  const response = await apiClient.post("/suppliers", data);
  return single<Supplier>(response);
}

export async function updateSupplier(
  id: string,
  data: Partial<{
    name: string;
    phone: string;
    email: string;
    address: string;
    isActive: boolean;
  }>,
): Promise<Supplier> {
  const response = await apiClient.put(`/suppliers/${id}`, data);
  return single<Supplier>(response);
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiClient.delete(`/suppliers/${id}`);
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export async function stockIn(data: {
  productId: string;
  quantity: number;
  reason?: string;
}): Promise<Record<string, unknown>> {
  const response = await apiClient.post("/stock/in", data);
  return inner(response);
}

export async function stockOut(data: {
  productId: string;
  quantity: number;
  reason?: string;
}): Promise<Record<string, unknown>> {
  const response = await apiClient.post("/stock/out", data);
  return inner(response);
}

export async function getStockMovements(params?: {
  productId?: string;
  movementType?: string;
  page?: number;
}): Promise<{ movements: StockMovement[]; total: number }> {
  const response = await apiClient.get("/stock/movements", { params });
  const payload = inner(response);
  const movements = Array.isArray(payload.movements) ? (payload.movements as StockMovement[]) : [];
  return { movements, total: (payload.total as number) ?? movements.length };
}

export async function getLowStock(): Promise<Record<string, unknown>[]> {
  const response = await apiClient.get("/stock/low-stock");
  return arr<Record<string, unknown>>(response, "products");
}

export async function getExpired(): Promise<Record<string, unknown>[]> {
  const response = await apiClient.get("/stock/expired");
  return arr<Record<string, unknown>>(response, "products");
}

export async function createAdjustment(data: {
  productId: string;
  physicalCount: number;
  reason?: string;
}): Promise<StockAdjustment> {
  const response = await apiClient.post("/stock/adjustment", data);
  return single<StockAdjustment>(response);
}

export async function approveAdjustment(id: string): Promise<StockAdjustment> {
  const response = await apiClient.put(`/stock/adjustment/${id}/approve`);
  return single<StockAdjustment>(response);
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export async function getPurchases(): Promise<PurchaseOrder[]> {
  const response = await apiClient.get("/purchases");
  return arr<PurchaseOrder>(response, "purchases");
}

export async function createPurchase(data: {
  supplierId?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  notes?: string;
  expectedDate?: string;
}): Promise<PurchaseOrder> {
  const response = await apiClient.post("/purchases", data);
  return single<PurchaseOrder>(response);
}

export async function getPurchase(id: string): Promise<PurchaseOrder> {
  const response = await apiClient.get(`/purchases/${id}`);
  return single<PurchaseOrder>(response);
}

export async function receivePurchase(
  id: string,
  data: { items: { id: string; receivedQuantity: number }[]; paidAmount?: number },
): Promise<PurchaseOrder> {
  const response = await apiClient.put(`/purchases/${id}/receive`, data);
  return single<PurchaseOrder>(response);
}

// ─── Damaged Stock ────────────────────────────────────────────────────────────

export async function getDamagedStock(): Promise<DamagedStock[]> {
  const response = await apiClient.get("/damaged-stock");
  return arr<DamagedStock>(response, "records");
}

export async function reportDamagedStock(data: {
  productId: string;
  quantity: number;
  reason: string;
  comment?: string;
}): Promise<DamagedStock> {
  const response = await apiClient.post("/damaged-stock", data);
  return single<DamagedStock>(response);
}

export async function approveDamagedStock(id: string): Promise<DamagedStock> {
  const response = await apiClient.put(`/damaged-stock/${id}/approve`);
  return single<DamagedStock>(response);
}

export async function rejectDamagedStock(id: string): Promise<DamagedStock> {
  const response = await apiClient.put(`/damaged-stock/${id}/reject`);
  return single<DamagedStock>(response);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(
  unreadOnly = false,
): Promise<InventoryNotification[]> {
  const response = await apiClient.get(
    "/notifications",
    { params: unreadOnly ? { is_read: false } : undefined },
  );
  return arr<InventoryNotification>(response, "notifications");
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get("/notifications/unread-count");
  const payload = inner(response);
  return (payload.count as number) ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.put("/notifications/mark-all-read");
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getInventoryDashboard(): Promise<InventoryDashboard> {
  const response = await apiClient.get("/reports/inventory-dashboard");
  return inner(response) as unknown as InventoryDashboard;
}
