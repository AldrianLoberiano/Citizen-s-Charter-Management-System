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
      .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
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

  const handlePrint = () => {
    const content = contentRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${fileName || "Document"}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #1a1a1a; }
          h1, h2, h3, h4 { margin: 16px 0 8px; }
          p { margin: 8px 0; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0; }
          th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          ul, ol { margin: 8px 0; padding-left: 24px; }
          li { margin: 4px 0; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName || "document.docx";
    a.click();
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 p-8 text-sm text-slate-500 dark:text-slate-400 ${className}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600" />
        Loading document...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 p-8 ${className}`}>
        <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 px-4 py-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
          {fileName || "Document"}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(50, z - 10))} title="Zoom out" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400 w-10 text-center">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(200, z + 10))} title="Zoom in" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom(100)} title="Reset zoom" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <RotateCcw className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          <button onClick={handlePrint} title="Print" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Printer className="h-4 w-4" />
          </button>
          <button onClick={handleDownload} title="Download" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-white">
        <div
          ref={contentRef}
          className="docx-content p-8 mx-auto max-w-4xl"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
