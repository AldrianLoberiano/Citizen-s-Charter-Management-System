import { useEffect, useState, useRef } from "react";
import mammoth from "mammoth";
import {
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
} from "lucide-react";

interface DocxViewerProps {
  fileUrl: string;
  fileName?: string;
  className?: string;
}

export function DocxViewer({ fileUrl, fileName, className = "" }: DocxViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch document");
        return res.arrayBuffer();
      })
      )
      .then((result) => {
        if (!cancelled) {
          setHtml(result.value);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load document");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [fileUrl]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 text-sm text-slate-500 dark:text-slate-400 ${className}`}>
        Loading document...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 text-sm text-red-500 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert p-6 overflow-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
