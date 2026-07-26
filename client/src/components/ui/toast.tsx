"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info";
}

let toastListeners: ((toast: Toast) => void)[] = [];

export function toast(options: Omit<Toast, "id">) {
  const t: Toast = { ...options, id: crypto.randomUUID() };
  toastListeners.forEach((l) => l(t));
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-400" />,
    info: <Info className="h-5 w-5 text-blue-400" />,
  };

  const borderColors = {
    success: "border-emerald-800",
    error: "border-red-800",
    info: "border-blue-800",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-zinc-900 p-4 shadow-2xl animate-in slide-in-from-right-full",
        borderColors[toast.variant || "info"]
      )}
    >
      {icons[toast.variant || "info"]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs text-zinc-400">{toast.description}</p>
        )}
      </div>
      <button onClick={onDismiss} className="text-zinc-500 hover:text-zinc-300">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => setToasts((prev) => [...prev, t]);
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        />
      ))}
    </div>
  );
}
