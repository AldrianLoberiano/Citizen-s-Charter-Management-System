import { useEffect, useState, useRef, useCallback } from "react";
import mammoth from "mammoth";
import JSZip from "jszip";
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
  Pencil,
} from "lucide-react";

interface DocxViewerProps {
  fileUrl: string;
  fileName?: string;
  className?: string;
  editable?: boolean;
  onSave?: (blob: Blob) => Promise<void>;
  onOpenExternal?: () => void;
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

function collectText(node: Node): string {
  const parts: string[] = [];
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      parts.push(child.textContent || "");
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (tag === "br") {
        parts.push("\n");
      } else if (tag === "li") {
        parts.push("\n► " + collectText(child).trim());
      } else if (tag === "ul" || tag === "ol") {
        parts.push(collectText(child));
      } else {
        parts.push(collectText(child));
      }
    }
  });
  return parts.join("");
}

function collectListItems(listEl: HTMLElement, blocks: { type: string; text: string }[]) {
  listEl.querySelectorAll(":scope > li").forEach((li) => {
    const directText: string[] = [];
    li.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        directText.push(child.textContent || "");
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childTag = (child as HTMLElement).tagName.toLowerCase();
        if (childTag !== "ul" && childTag !== "ol") {
          directText.push(collectText(child));
        }
      }
    });
    blocks.push({ type: "li", text: directText.join("").trim() });
    li.querySelectorAll(":scope > ul, :scope > ol").forEach((sub) => {
      collectListItems(sub as HTMLElement, blocks);
    });
  });
}

function extractHtmlBlocks(htmlStr: string): { type: string; text: string; cells?: string[][] }[] {
  const div = document.createElement("div");
  div.innerHTML = htmlStr;
  const blocks: { type: string; text: string; cells?: string[][] }[] = [];

  function walk(node: ChildNode) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "table") {
      const rows: string[][] = [];
      el.querySelectorAll("tr").forEach((tr) => {
        const cells: string[] = [];
        tr.querySelectorAll("td, th").forEach((td) => {
          cells.push(collectText(td).trim());
        });
        if (cells.length > 0) rows.push(cells);
      });
      blocks.push({ type: "table", text: "", cells: rows });
      return;
    }

    if (/^h[1-6]$/.test(tag) || tag === "p") {
      blocks.push({ type: tag, text: collectText(el).trim() });
      return;
    }

    if (tag === "ul" || tag === "ol") {
      collectListItems(el, blocks);
      return;
    }

    el.childNodes.forEach(walk);
  }

  div.childNodes.forEach(walk);
  return blocks;
}

function updateXmlTextNode(textNode: Element, newText: string) {
  textNode.textContent = newText;
}

function clearExtraRuns(paragraph: Element) {
  const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const runs = paragraph.querySelectorAll("r");
  for (let i = 1; i < runs.length; i++) {
    const t = runs[i].querySelector("t");
    if (t) t.textContent = "";
  }
}

function setParagraphText(paragraph: Element, newText: string) {
  const runs = paragraph.querySelectorAll("r");
  if (runs.length === 0) return;

  const firstT = runs[0].querySelector("t");
  if (firstT) {
    firstT.textContent = newText;
    firstT.setAttribute("xml:space", "preserve");
  }

  for (let i = 1; i < runs.length; i++) {
    const t = runs[i].querySelector("t");
    if (t) t.textContent = "";
  }
}

async function editDocxInPlace(
  originalBuffer: ArrayBuffer,
  editedHtml: string
): Promise<Blob> {
  const zip = await JSZip.loadAsync(originalBuffer);
  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) throw new Error("Invalid DOCX: word/document.xml not found");

  const docXml = await docXmlFile.async("text");
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXml, "application/xml");
  const body = xmlDoc.getElementsByTagName("w:body")[0];
  if (!body) throw new Error("Invalid DOCX: no w:body found");

  const htmlBlocks = extractHtmlBlocks(editedHtml);

  const xmlChildren: Element[] = [];
  for (const child of Array.from(body.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      xmlChildren.push(child as Element);
    }
  }

  let htmlIdx = 0;

  function findBulletPPr(): Element | null {
    for (const child of Array.from(body.childNodes)) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as Element;
      if ((el.localName || el.nodeName) === "p") {
        const pPr = el.querySelector("pPr");
        if (pPr && pPr.querySelector("numPr")) {
          return pPr;
        }
      }
    }
    return null;
  }

  function createParagraphWithText(xmlDoc: Document, text: string, clonePPr?: Element | null): Element {
    const p = xmlDoc.createElement("w:p");
    if (clonePPr) {
      p.appendChild(clonePPr.cloneNode(true));
    }
    const r = xmlDoc.createElement("w:r");
    const t = xmlDoc.createElement("w:t");
    t.textContent = text;
    t.setAttribute("xml:space", "preserve");
    r.appendChild(t);
    p.appendChild(r);
    return p;
  }

  function createTableCell(xmlDoc: Document, text: string): Element {
    const tc = xmlDoc.createElement("w:tc");
    const p = xmlDoc.createElement("w:p");
    const r = xmlDoc.createElement("w:r");
    const t = xmlDoc.createElement("w:t");
    t.textContent = text;
    t.setAttribute("xml:space", "preserve");
    r.appendChild(t);
    p.appendChild(r);
    tc.appendChild(p);
    return tc;
  }

  const bulletPPr = findBulletPPr();

  for (const xmlChild of xmlChildren) {
    const localName = xmlChild.localName || xmlChild.nodeName;

    if (localName === "tbl") {
      const htmlBlock = htmlBlocks[htmlIdx];
      if (htmlBlock && htmlBlock.type === "table" && htmlBlock.cells) {
        const xmlRows = xmlChild.querySelectorAll("tr");
        for (let r = 0; r < xmlRows.length && r < htmlBlock.cells.length; r++) {
          const xmlCells = xmlRows[r].querySelectorAll("tc");
          const htmlCells = htmlBlock.cells[r];
          for (let c = 0; c < xmlCells.length && c < htmlCells.length; c++) {
            const cellParagraphs = Array.from(xmlCells[c].querySelectorAll("p"));
            const lines = htmlCells[c].split("\n").filter((l) => l.trim());
            for (let p = 0; p < cellParagraphs.length; p++) {
              if (p < lines.length) {
                setParagraphText(cellParagraphs[p], lines[p].replace(/^►\s*/, "").trim());
              } else {
                setParagraphText(cellParagraphs[p], "");
              }
            }
            for (let p = cellParagraphs.length; p < lines.length; p++) {
              const newP = createParagraphWithText(xmlDoc, lines[p].replace(/^►\s*/, "").trim(), bulletPPr);
              xmlCells[c].appendChild(newP);
            }
          }
        }
        htmlIdx++;
      }
    } else if (localName === "p") {
      const htmlBlock = htmlBlocks[htmlIdx];
      if (htmlBlock && htmlBlock.type !== "table") {
        setParagraphText(xmlChild, htmlBlock.text);
        htmlIdx++;
      } else {
        setParagraphText(xmlChild, "");
      }
    }
  }

  while (htmlIdx < htmlBlocks.length) {
    const htmlBlock = htmlBlocks[htmlIdx];
    if (htmlBlock.type === "table") {
      const tbl = xmlDoc.createElement("w:tbl");
      const tblPr = xmlDoc.createElement("w:tblPr");
      tbl.appendChild(tblPr);
      if (htmlBlock.cells) {
        for (const row of htmlBlock.cells) {
          const tr = xmlDoc.createElement("w:tr");
          for (const cellText of row) {
            tr.appendChild(createTableCell(xmlDoc, cellText));
          }
          tbl.appendChild(tr);
        }
      }
      body.insertBefore(tbl, body.lastElementChild);
    } else if (htmlBlock.type === "li") {
      body.insertBefore(createParagraphWithText(xmlDoc, htmlBlock.text, bulletPPr), body.lastElementChild);
    } else {
      body.insertBefore(createParagraphWithText(xmlDoc, htmlBlock.text), body.lastElementChild);
    }
    htmlIdx++;
  }

  const serializer = new XMLSerializer();
  const newDocXml = serializer.serializeToString(xmlDoc);
  zip.file("word/document.xml", newDocXml);

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
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
    if (originalBufferRef.current) {
      try {
        blob = await editDocxInPlace(originalBufferRef.current, editedHtml);
      } catch {
        const { htmlToDocxBlob } = await import("./docxFallback");
        blob = await htmlToDocxBlob(editedHtml, fileName || undefined);
      }
    } else {
      const { htmlToDocxBlob } = await import("./docxFallback");
      blob = await htmlToDocxBlob(editedHtml, fileName || undefined);
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
          ul, ol { margin: 8px 0; padding-left: 24px; }
          ul { list-style-type: disc; }
          ol { list-style-type: decimal; }
          li { margin: 2px 0; line-height: 1.7; padding-left: 4px; }
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
          <button
            onClick={handlePrint}
            title="Print"
            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownloadOriginal}
            title="Download original"
            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
          </button>
          {editable && onOpenExternal && (
            <button
              onClick={onOpenExternal}
              title="Open in new tab for full editing"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-emerald-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Full
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4">
        <div
          className="mx-auto max-w-4xl bg-white shadow-lg rounded-lg"
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
