import Swal, { SweetAlertIcon, SweetAlertResult } from "sweetalert2";

/**
 * Centralized Alert Utility using SweetAlert2
 * Replaces shadcn-ui toast for consistent notifications across the app
 */

// Custom theme configuration matching the app design
const baseConfig = {
  customClass: {
    popup: "rounded-lg shadow-lg",
    title: "text-lg font-semibold",
    htmlContainer: "text-sm text-muted-foreground",
    confirmButton:
      "bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium",
    cancelButton:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium",
    denyButton:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md font-medium",
  },
  buttonsStyling: false,
  showClass: {
    popup: "animate-in fade-in-0 zoom-in-95",
  },
  hideClass: {
    popup: "animate-out fade-out-0 zoom-out-95",
  },
};

// Timer configuration for auto-close alerts
const TOAST_TIMER = 3000;
const TOAST_TIMER_SHORT = 2000;

/**
 * Show success alert
 */
export function showSuccess(title: string, description?: string): void {
  Swal.fire({
    ...baseConfig,
    icon: "success",
    title,
    text: description,
    timer: TOAST_TIMER,
    timerProgressBar: true,
    showConfirmButton: false,
    // toast: true,
    // position: "top-end",
  });
}

/**
 * Show error alert
 */
export function showError(title: string, description?: string): void {
  Swal.fire({
    ...baseConfig,
    icon: "error",
    title,
    text: description,
    timer: TOAST_TIMER,
    timerProgressBar: true,
    showConfirmButton: false,
    // toast: true,
    // position: "top-end",
  });
}

/**
 * Show warning alert
 */
export function showWarning(title: string, description?: string): void {
  Swal.fire({
    ...baseConfig,
    icon: "warning",
    title,
    text: description,
    timer: TOAST_TIMER,
    timerProgressBar: true,
    showConfirmButton: false,
    // toast: true,
    // position: "top-end",
  });
}

/**
 * Show info alert
 */
export function showInfo(title: string, description?: string): void {
  Swal.fire({
    ...baseConfig,
    icon: "info",
    title,
    text: description,
    timer: TOAST_TIMER,
    timerProgressBar: true,
    showConfirmButton: false,
    // toast: true,
    // position: "top-end",
  });
}

/**
 * Show alert object for more flexible usage
 */
export const showAlert = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
};

// Confirmation dialog options
interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: SweetAlertIcon;
  isDanger?: boolean;
}

/**
 * Show confirmation dialog
 * Returns true if confirmed, false if cancelled
 */
export async function confirmAlert(options: ConfirmOptions): Promise<boolean> {
  const {
    title,
    description,
    confirmText = "Ya",
    cancelText = "Batal",
    icon = "question",
    isDanger = false,
  } = options;

  const result: SweetAlertResult = await Swal.fire({
    ...baseConfig,
    icon,
    title,
    text: description,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    customClass: {
      ...baseConfig.customClass,
      confirmButton: isDanger
        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md font-medium ml-2"
        : "bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium ml-2",
    },
  });

  return result.isConfirmed;
}

/**
 * Show delete confirmation dialog (preset for delete actions)
 */
export async function confirmDelete(
  itemName?: string,
  customMessage?: string
): Promise<boolean> {
  return confirmAlert({
    title: "Hapus Data?",
    description:
      customMessage ||
      (itemName
        ? `Apakah Anda yakin ingin menghapus "${itemName}"? Tindakan ini tidak dapat dibatalkan.`
        : "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."),
    confirmText: "Hapus",
    cancelText: "Batal",
    icon: "warning",
    isDanger: true,
  });
}

/**
 * Show save confirmation dialog
 */
export async function confirmSave(customMessage?: string): Promise<boolean> {
  return confirmAlert({
    title: "Simpan Data?",
    description:
      customMessage || "Apakah Anda yakin ingin menyimpan perubahan?",
    confirmText: "Simpan",
    cancelText: "Batal",
    icon: "question",
    isDanger: false,
  });
}

/**
 * Show reset confirmation dialog
 */
export async function confirmReset(customMessage?: string): Promise<boolean> {
  return confirmAlert({
    title: "Reset Data?",
    description: customMessage || "Apakah Anda yakin ingin mereset data ini?",
    confirmText: "Reset",
    cancelText: "Batal",
    icon: "warning",
    isDanger: true,
  });
}

// Loading state management
let loadingInstance: typeof Swal | null = null;

/**
 * Loading alert utilities
 */
export const loadingAlert = {
  /**
   * Show loading indicator
   */
  show(title: string = "Memproses...") {
    Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },

  /**
   * Close loading indicator
   */
  close() {
    Swal.close();
  },

  /**
   * Update loading text
   */
  update(title: string) {
    Swal.update({ title });
  },
};

/**
 * Show input dialog
 */
export async function inputAlert(options: {
  title: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  inputType?: "text" | "email" | "password" | "number" | "tel" | "url";
  confirmText?: string;
  cancelText?: string;
}): Promise<string | null> {
  const {
    title,
    inputLabel,
    inputPlaceholder,
    inputValue = "",
    inputType = "text",
    confirmText = "Simpan",
    cancelText = "Batal",
  } = options;

  const result = await Swal.fire({
    ...baseConfig,
    title,
    input: inputType,
    inputLabel,
    inputPlaceholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    inputValidator: (value) => {
      if (!value) {
        return "Field ini tidak boleh kosong";
      }
      return null;
    },
  });

  return result.isConfirmed ? (result.value as string) : null;
}

// Default export for convenience
export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  confirm: confirmAlert,
  confirmDelete,
  confirmSave,
  confirmReset,
  loading: loadingAlert,
  input: inputAlert,
};
