import { ToastProvider } from "@/lib/toast";

/**
 * Layout del /editor — envuelve cualquier ruta del editor con ToastProvider
 * para que useToast() funcione tanto en GeneratedEditor + MobileEditorV3
 * como en PublishedTemplateLoader y EditorRouter. Sin esto los toast.error()
 * serían no-op (defensive default del hook).
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
