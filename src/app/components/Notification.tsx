/**
 * Notification / Toast Component
 * Displays success or error messages as floating notifications
 */

import { CheckCircle, AlertCircle, X } from "lucide-react";

interface NotificationProps {
  type: "success" | "error" | "info";
  message: string;
  onClose: () => void;
}

const styles = {
  success: "bg-green-700 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-700 text-white",
};

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: AlertCircle,
};

export function Notification({ type, message, onClose }: NotificationProps) {
  const Icon = icons[type];
  return (
    <div
      className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm ${styles[type]}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onClose} className="hover:opacity-80 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
