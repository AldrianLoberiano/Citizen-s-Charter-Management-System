import { useEffect, useState, useRef, useCallback } from "react";
import mammoth from "mammoth";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Save,
  Undo2,
  Redo2,
  Pencil,
} from "lucide-react";

interface DocxViewerProps {
  fileUrl: string;
  fileName?: string;
  className?: string;
  editable?: boolean;
  onSave?: (blob: Blob) => Promise<void>;
}

function fixBulletsInTables(htmlStr: string): string {
  const div = document.createElement("div");
  div.innerHTML = htmlStr;
  div.querySelectorAll("td, th").forEach((cell) => {
    const text = cell.innerHTML;
    if (!/[►▸•‣]/.test(text)) return;
    const parts = text.split(/[►▸•‣]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length <= 1) return;
    const htmlParts = parts.map((p) => `<li>${p}</li>`);
    cell.innerHTML = `<ul>${htmlParts.join("")}</ul>`;
  });
  return div.innerHTML;
}

function applyCssTextToDiv(div: HTMLDivElement) {
  const styles = div.querySelectorAll("style");
  styles.forEach((styleEl) => {
    const cssText = styleEl.textContent || "";
    const ruleRegex = /([^{}]+)\{([^}]*)\}/g;
    let match;
    while ((match = ruleRegex.exec(cssText)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();
      if (!selector || !declarations) continue;
      try {
        const matched = div.querySelectorAll(selector);
        matched.forEach((el) => {
          declarations.split(";").forEach((decl) => {
            const [prop, ...valParts] = decl.split(":");
            if (prop && valParts.length > 0) {
              const value = valParts.join(":").trim();
              if (prop.trim() && value) {
                (el as HTMLElement).style.setProperty(prop.trim(), value);
              }
            }
          });
        });
      } catch { /* skip invalid selectors */ }
    }
  });
  div.querySelectorAll("style").forEach((el) => el.remove());
}

function inlineMammothStyles(htmlStr: string): string {
  const div = document.createElement("div");
  div.innerHTML = htmlStr;
  applyCssTextToDiv(div);
  return div.innerHTML;
}

export function DocxViewer({
  fileUrl,
  fileName,
  className = "",
  editable = true,
  onSave,
  onOpenExternal,
}: DocxViewerProps) {
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
  const originalBufferRef = useRef<ArrayBuffer | null>(null);

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
        if (!res.ok) {
          if (res.status === 404)
            throw new Error(
              "Document file not found on the server. Please re-upload the file."
            );
          throw new Error("Failed to fetch document");
        }
        return res.arrayBuffer();
      })
      .then((buffer) => {
        originalBufferRef.current = buffer;
        return mammoth.convertToHtml({
          arrayBuffer: buffer,
        } as any);
      })
      .then((result) => {
        if (!cancelled) {
          let content = result.value || "<p></p>";
          content = fixBulletsInTables(content);
          content = inlineMammothStyles(content);
          setHtml(content);
          setOriginalHtml(content);
          setLoading(false);
          historyRef.current = [content];
          historyIndexRef.current = 0;
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load document"
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  useEffect(() => {
    if (contentRef.current && html) {
      contentRef.current.innerHTML = html;
      setOriginalHtml(contentRef.current.innerHTML);
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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html && /<table[\s>]/i.test(html)) {
      const div = document.createElement("div");
      div.innerHTML = html;
      applyCssTextToDiv(div);
      div.querySelectorAll("script, link").forEach((el) => el.remove());
      const cleanHtml = div.innerHTML;
      document.execCommand("insertHTML", false, cleanHtml);
    } else {
      document.execCommand("insertText", false, text);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!contentRef.current) return;
    const editedHtml = contentRef.current.innerHTML;

    let blob: Blob;
    if (!isDirty && originalBufferRef.current) {
      blob = new Blob([originalBufferRef.current], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    } else {
      const { htmlToDocxBlob } = await import("./docxFallback");
      blob = await htmlToDocxBlob(editedHtml);
    }

    if (onSave) {
      setSaving(true);
      setSaveError(null);
      try {
        skipNextFetchRef.current = true;
        await onSave(blob);
        originalBufferRef.current = await blob.arrayBuffer();
        setOriginalHtml(editedHtml);
        setIsDirty(false);
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "Save failed"
        );
      } finally {
        setSaving(false);
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName
        ? fileName.replace(/\.docx$/i, "") + " (edited).docx"
        : "document.docx";
      a.click();
      URL.revokeObjectURL(url);
      originalBufferRef.current = await blob.arrayBuffer();
      setOriginalHtml(editedHtml);
      setIsDirty(false);
    }
  }, [isDirty, fileName, onSave]);

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
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
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
      <div
        className={`flex flex-col items-center justify-center gap-3 p-8 text-sm text-slate-500 dark:text-slate-400 ${className}`}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600" />
        Loading document...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 p-8 ${className}`}
      >
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
              <button
                onClick={handleUndo}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleRedo}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Redo2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleReset}
                title="Reset to original"
                className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
            </>
          )}
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            title="Zoom out"
            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400 w-10 text-center">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            title="Zoom in"
            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {saveError && (
            <span className="text-xs text-red-500 dark:text-red-400 mr-2">
              {saveError}
            </span>
          )}
          {isDirty && (
            <span className="text-xs text-amber-500 dark:text-amber-400 mr-2">
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4">
        <div
          className="mx-auto max-w-6xl bg-white shadow-lg rounded-lg"
          style={{ zoom: `${zoom}%` }}
        >
          <div
            ref={contentRef}
            className="docx-content p-8 min-h-[600px]"
            contentEditable={editable}
            suppressContentEditableWarning
            onInput={handleInput}
            onPaste={handlePaste}
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
