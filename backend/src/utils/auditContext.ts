import { AsyncLocalStorage } from "async_hooks";

export type AuditRequestContext = {
  adminIpAddress?: string;
  userAgent?: string;
};

const auditContextStorage = new AsyncLocalStorage<AuditRequestContext>();

export function runWithAuditContext<T>(context: AuditRequestContext, callback: () => T) {
  return auditContextStorage.run(context, callback);
}

export function getAuditContext() {
  return auditContextStorage.getStore() ?? {};
}
