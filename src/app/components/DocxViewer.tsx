import { useEffect, useState, useRef, useCallback } from "react";
import mammoth from "mammoth";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  convertInchesToTwip,
} from "docx";
import {
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Save,
  Undo2,
  Redo2,
} from "lucide-react";

interface DocxViewerProps {
  fileUrl: string;
  fileName?: string;
  className?: string;
  editable?: boolean;
  onSave?: (blob: Blob) => Promise<void>;
}

function parseInline(element: HTMLElement): TextRun[] {
  const runs: TextRun[] = [];
  element.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || "";
      if (text) {
        const isBold = element.tagName === "B" || element.tagName === "STRONG";
        const isItalic = element.tagName === "I" || element.tagName === "EM";
        const isUnderline = element.tagName === "U";
        runs.push(new TextRun({ text, bold: isBold, italics: isItalic, underline: isUnderline ? {} : undefined }));
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const cel = child as HTMLElement;
      const tag = cel.tagName;
      const isBold = tag === "B" || tag === "STRONG";
      const isItalic = tag === "I" || tag === "EM";
      const isUnderline = tag === "U";
      cel.childNodes.forEach((gc) => {
        if (gc.nodeType === Node.TEXT_NODE) {
          const t = gc.textContent || "";
          if (t) runs.push(new TextRun({ text: t, bold: isBold, italics: isItalic, underline: isUnderline ? {} : undefined }));
        } else if (gc.nodeType === Node.ELEMENT_NODE) {
          const gcel = gc as HTMLElement;
          const gt = gcel.tagName;
          runs.push(new TextRun({
            text: gcel.textContent || "",
            bold: isBold || gt === "B" || gt === "STRONG",
            italics: isItalic || gt === "I" || gt === "EM",
            underline: isUnderline || gt === "U" ? {} : undefined,
          }));
        }
      });
    }
  });
  return runs.length > 0 ? runs : [new TextRun("")];
}

function htmlToDocxElements(htmlStr: string): (Paragraph | Table)[] {
  const div = document.createElement("div");
  div.innerHTML = htmlStr;
  const elements: (Paragraph | Table)[] = [];

  function processNode(node: ChildNode) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text.trim()) elements.push(new Paragraph({ children: [new TextRun(text)] }));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "table") {
      const rows: TableRow[] = [];
      el.querySelectorAll("tr").forEach((tr) => {
        const cells: TableCell[] = [];
        tr.querySelectorAll("td, th").forEach((td) => {
          const cellParagraphs: Paragraph[] = [];
          td.childNodes.forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
              const t = child.textContent || "";
              if (t) cellParagraphs.push(new Paragraph({ children: [new TextRun({ text: t, bold: td.tagName === "TH" })] }));
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              cellParagraphs.push(...htmlToDocxElements((child as HTMLElement).outerHTML));
            }
          });
          if (cellParagraphs.length === 0) cellParagraphs.push(new Paragraph({ children: [new TextRun("")] }));
          cells.push(new TableCell({
            children: cellParagraphs,
            width: { size: Math.floor(100 / Math.max(tr.querySelectorAll("td, th").length, 1)), type: WidthType.PERCENTAGE },
          }));
        });
        if (cells.length > 0) rows.push(new TableRow({ children: cells }));
      });
      if (rows.length > 0) elements.push(new Table({ rows }));
      return;
    }

    if (/^h([1-6])$/.test(tag)) {
      const level = Number(tag[1]);
      const headingMap: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      elements.push(new Paragraph({
        children: [new TextRun({ text: el.textContent || "", bold: true })],
        heading: headingMap[level] || HeadingLevel.HEADING_1,
      }));
      return;
    }

    if (tag === "p") {
      elements.push(new Paragraph({ children: parseInline(el) }));
      return;
    }

    if (tag === "ul" || tag === "ol") {
      el.querySelectorAll("li").forEach((li) => {
        elements.push(new Paragraph({
          children: parseInline(li),
          bullet: tag === "ul" ? { level: 0 } : undefined,
          numbering: tag === "ol" ? { reference: 0, level: 0 } : undefined,
        }));
      });
      return;
    }

    if (tag === "br") {
      elements.push(new Paragraph({ children: [new TextRun("")] }));
      return;
    }

    el.childNodes.forEach(processNode);
  }

  div.childNodes.forEach(processNode);
  return elements.length > 0 ? elements : [new Paragraph({ children: [new TextRun("")] })];
}

async function htmlToDocxBlob(htmlStr: string, title?: string): Promise<Blob> {
  const children = htmlToDocxElements(htmlStr);
  const doc = new Document({
    numbering: {
      config: [{
        reference: "ordered-list",
        levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } } }],
      }],
    },
    sections: [{
      properties: {},
      children: title
        ? [new Paragraph({ children: [new TextRun({ text: title, bold: true })], heading: HeadingLevel.TITLE }), ...children]
        : children,
    }],
  });
  return Packer.toBlob(doc);
}

export function DocxViewer({ fileUrl, fileName, className = "", editable = true, onSave }: DocxViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState("");
  const [originalHtml, setOriginalHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      setLoading(false);
      return;
    }

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
          const content = result.value || "<p></p>";
          setHtml(content);
          setOriginalHtml(content);
          setLoading(false);
          historyRef.current = [content];
          historyIndexRef.current = 0;
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

  useEffect(() => {
    if (contentRef.current && html) {
      contentRef.current.innerHTML = html;
    }
  }, [html]);

  const pushHistory = useCallback((newHtml: string) => {
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(newHtml);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const prev = historyRef.current[historyIndexRef.current];
      if (contentRef.current) contentRef.current.innerHTML = prev;
      setIsDirty(prev !== originalHtml);
    }
  }, [originalHtml]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const next = historyRef.current[historyIndexRef.current];
      if (contentRef.current) contentRef.current.innerHTML = next;
      setIsDirty(next !== originalHtml);
    }
  }, [originalHtml]);

  const handleInput = useCallback(() => {
    if (!contentRef.current) return;
    const newHtml = contentRef.current.innerHTML;
    setIsDirty(newHtml !== originalHtml);
    pushHistory(newHtml);
  }, [originalHtml, pushHistory]);

  const handleSave = useCallback(async () => {
    if (!contentRef.current) return;
    const editedHtml = contentRef.current.innerHTML;
    const blob = await htmlToDocxBlob(editedHtml, fileName || undefined);

    if (onSave) {
      setSaving(true);
      setSaveError(null);
      try {
        skipNextFetchRef.current = true;
        await onSave(blob);
        setIsDirty(false);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Save failed");
      } finally {
        setSaving(false);
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName ? fileName.replace(/\.docx$/i, "") + " (edited).docx" : "document.docx";
      a.click();
      URL.revokeObjectURL(url);
      setIsDirty(false);
    }
  }, [fileName, onSave]);

  const handleDownloadOriginal = useCallback(() => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName || "document.docx";
    a.click();
  }, [fileUrl, fileName]);

  const handlePrint = useCallback(() => {
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
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.7; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 22px; font-weight: 700; margin: 20px 0 10px; }
          h2 { font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
          h3 { font-size: 16px; font-weight: 600; margin: 14px 0 6px; }
          p { margin: 8px 0; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0; }
          th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
          th { background: #f8fafc; font-weight: 600; }
          ul, ol { margin: 8px 0; padding-left: 28px; }
          li { margin: 4px 0; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [fileName]);

  const handleReset = useCallback(() => {
    if (contentRef.current) contentRef.current.innerHTML = originalHtml;
    setIsDirty(false);
    historyRef.current = [originalHtml];
    historyIndexRef.current = 0;
  }, [originalHtml]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo, handleSave]);

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
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex-wrap">
        <div className="flex items-center gap-1">
          {editable && (
            <>
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                title="Save (Ctrl+S)"
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-900 px-3 py-1.5 text-xs text-white transition-colors hover:bg-violet-950 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save"}
              </button>
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
              <button onClick={handleUndo} title="Undo (Ctrl+Z)" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Undo2 className="h-4 w-4" />
              </button>
              <button onClick={handleRedo} title="Redo (Ctrl+Y)" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Redo2 className="h-4 w-4" />
              </button>
              <button onClick={handleReset} title="Reset to original" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <RotateCcw className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
            </>
          )}
          <button onClick={() => setZoom((z) => Math.max(50, z - 10))} title="Zoom out" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400 w-10 text-center">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(200, z + 10))} title="Zoom in" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {saveError && (
            <span className="text-xs text-red-500 dark:text-red-400 mr-2">{saveError}</span>
          )}
          {isDirty && (
            <span className="text-xs text-amber-500 dark:text-amber-400 mr-2">Unsaved changes</span>
          )}
          <button onClick={handlePrint} title="Print" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Printer className="h-4 w-4" />
          </button>
          <button onClick={handleDownloadOriginal} title="Download original" className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4">
        <div className="mx-auto max-w-4xl bg-white shadow-lg rounded-lg">
          <div
            ref={contentRef}
            className="docx-content p-8 min-h-[600px]"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            contentEditable={editable}
            suppressContentEditableWarning
            onInput={handleInput}
          />
        </div>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
          {fileName || "Document"}
        </span>
        {editable && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Click anywhere in the document to edit
          </span>
        )}
      </div>
    </div>
  );
}
