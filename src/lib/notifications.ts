import Swal from "sweetalert2";

export type AppNotificationVariant = "default" | "success" | "error" | "warning" | "info";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  showCloseButton: true,
  timer: 4200,
  timerProgressBar: true,
  didOpen: (element) => {
    element.addEventListener("mouseenter", Swal.stopTimer);
    element.addEventListener("mouseleave", Swal.resumeTimer);
  },
  customClass: {
    popup: "biztrack-sweet-alert",
  },
});

const iconByVariant: Record<AppNotificationVariant, "success" | "error" | "warning" | "info"> = {
  default: "info",
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
};

export function notify(message: string, variant: AppNotificationVariant = "default") {
  if (!message.trim()) return;
  void toast.fire({ icon: iconByVariant[variant], title: message });
}

export function showLoadingAlert(message: string) {
  void Swal.fire({
    title: message,
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
    customClass: { popup: "biztrack-sweet-alert" },
  });
}

export function closeLoadingAlert() {
  if (Swal.isLoading()) Swal.close();
}

export async function confirmDialog({
  title,
  text,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}) {
  const result = await Swal.fire({
    icon: danger ? "warning" : "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: danger ? "#dc2626" : "#0b9279",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    focusCancel: danger,
    customClass: { popup: "biztrack-sweet-alert" },
  });

  return result.isConfirmed;
}

export const notifySuccess = (message: string) => notify(message, "success");
export const notifyError = (message: string) => notify(message, "error");
export const notifyWarning = (message: string) => notify(message, "warning");
export const notifyInfo = (message: string) => notify(message, "info");
