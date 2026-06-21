import { toast } from "sonner";
import { formatError } from "./error-utils";

/**
 * Standardized Notification Utilities
 * Ensures consistent messaging and styling across the application.
 */

export const notify = {
  success: (message: string) => {
    toast.success(message, {
      duration: 4000,
      className: "border-l-4 border-green-500",
    });
  },

  warning: (message: string) => {
    toast.warning(message, {
      duration: 6000,
      className: "border-l-4 border-yellow-500",
    });
  },

  error: (errorOrMessage: any, title?: string) => {
    const message = formatError(errorOrMessage);
    toast.error(title || "Error", {
      description: message,
      duration: 8000,
      className: "border-l-4 border-red-500",
    });
  },

  info: (message: string, title?: string) => {
    toast.info(title || "Notice", {
      description: message,
      duration: 5000,
      className: "border-l-4 border-blue-500",
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      className: "border-l-4 border-primary",
    });
  },

  dismiss: (id: string | number) => {
    toast.dismiss(id);
  }
};
