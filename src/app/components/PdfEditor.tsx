import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  Type,
  Pencil,
  Highlighter,
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type Tool = "select" | "text" | "draw" | "highlight";

interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  page: number;
}

interface DrawPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  page: number;
}

interface HighlightRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

interface PdfEditorProps {
  fileUrl: string;
}

export function PdfEditor({ fileUrl }: PdfEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const renderVersionRef = useRef(0);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [highlights, setHighlights] = useState<HighlightRect[]>([]);

  const [textColor, setTextColor] = useState("#ff0000");
  const [drawColor, setDrawColor] = useState("#ff0000");
  const [drawWidth, setDrawWidth] = useState(3);
  const [fontSize, setFontSize] = useState(16);

  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const drawOverlay = useCallback(
    (viewport: { width: number; height: number }, page: number) => {
      const overlayEl = overlayRef.current;
      if (!overlayEl) return;
      const ctx = overlayEl.getContext("2d");
      if (!ctx) return;

      overlayEl.width = viewport.width;
      overlayEl.height = viewport.height;
      ctx.clearRect(0, 0, viewport.width, viewport.height);

      const pageAnnotations = {
        texts: textAnnotations.filter((t) => t.page === page),
        draws: drawPaths.filter((d) => d.page === page),
        highlights: highlights.filter((h) => h.page === page),
      };

      pageAnnotations.highlights.forEach((h) => {
        ctx.fillStyle = "rgba(255, 255, 0, 0.35)";
        ctx.fillRect(h.x, h.y, h.width, h.height);
      });

      pageAnnotations.draws.forEach((path) => {
        if (path.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(path.points[0].x, path.points[0].y);
        path.points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      });

      pageAnnotations.texts.forEach((t) => {
        ctx.font = `${t.fontSize}px Arial`;
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
      });

      if (isDrawing && activeTool === "draw" && currentPath.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        currentPath.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      }
    },
    [textAnnotations, drawPaths, highlights, isDrawing, activeTool, currentPath, drawColor, drawWidth]
  );

  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const version = ++renderVersionRef.current;
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch {
        return;
      }

      if (version !== renderVersionRef.current) return;

      drawOverlay(viewport, pageNum);
    },
    [pdfDoc, scale, drawOverlay]
  );

  useEffect(() => {
    const loadPdf = async () => {
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
    };
    loadPdf();
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [fileUrl]);

  useEffect(() => {
    renderPage(currentPage);
  }, [currentPage, renderPage]);

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [textAnnotations, drawPaths, highlights, pdfDoc, currentPage, renderPage]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    if (activeTool === "text") {
      const id = `text-${Date.now()}`;
      setTextAnnotations((prev) => [
        ...prev,
        { id, x: coords.x, y: coords.y, text: "Click to edit", fontSize, color: textColor, page: currentPage },
      ]);
      setEditingTextId(id);
      setEditingText("Click to edit");
      return;
    }

    if (activeTool === "draw") {
      setIsDrawing(true);
      setCurrentPath([coords]);
      return;
    }

    if (activeTool === "highlight") {
      setDragStart(coords);
      return;
    }

    const target = e.target as HTMLCanvasElement;
    const rect = target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const pageAnnotations = {
      texts: textAnnotations.filter((t) => t.page === currentPage),
    };
    const clickedText = pageAnnotations.texts.find((t) => {
      const textWidth = t.text.length * t.fontSize * 0.6;
      return clickX >= t.x && clickX <= t.x + textWidth && clickY >= t.y - t.fontSize && clickY <= t.y;
    });
    if (clickedText) {
      setEditingTextId(clickedText.id);
      setEditingText(clickedText.text);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "draw" && isDrawing) {
      const coords = getCanvasCoords(e);
      setCurrentPath((prev) => [...prev, coords]);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "draw" && isDrawing && currentPath.length > 1) {
      setDrawPaths((prev) => [
        ...prev,
        { id: `draw-${Date.now()}`, points: currentPath, color: drawColor, width: drawWidth, page: currentPage },
      ]);
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    if (activeTool === "highlight" && dragStart) {
      const coords = getCanvasCoords(e);
      const x = Math.min(dragStart.x, coords.x);
      const y = Math.min(dragStart.y, coords.y);
      const width = Math.abs(coords.x - dragStart.x);
      const height = Math.abs(coords.y - dragStart.y);
      if (width > 5 && height > 5) {
        setHighlights((prev) => [
          ...prev,
          { id: `hl-${Date.now()}`, x, y, width, height, page: currentPage },
        ]);
      }
      setDragStart(null);
    }
  };

  const handleTextSave = () => {
    if (editingTextId) {
      setTextAnnotations((prev) =>
        prev.map((t) => (t.id === editingTextId ? { ...t, text: editingText } : t))
      );
      setEditingTextId(null);
      setEditingText("");
    }
  };

  const handleExport = async () => {
    if (!pdfDoc) return;
    const pdfBytes = await fetch(fileUrl).then((res) => res.arrayBuffer());
    const pdfDocLib = await PDFDocument.load(pdfBytes);
    const font = await pdfDocLib.embedFont(StandardFonts.Helvetica);
    const pages = pdfDocLib.getPages();

    for (const annot of textAnnotations) {
      const page = pages[annot.page - 1];
      if (!page) continue;
      const { height } = page.getSize();
      page.drawText(annot.text, {
        x: annot.x,
        y: height - annot.y,
        size: annot.fontSize,
        font,
        color: rgb(
          parseInt(annot.color.slice(1, 3), 16) / 255,
          parseInt(annot.color.slice(3, 5), 16) / 255,
          parseInt(annot.color.slice(5, 7), 16) / 255
        ),
      });
    }

    for (const hl of highlights) {
      const page = pages[hl.page - 1];
      if (!page) continue;
      const { height } = page.getSize();
      page.drawRectangle({
        x: hl.x,
        y: height - hl.y - hl.height,
        width: hl.width,
        height: hl.height,
        color: rgb(1, 1, 0),
        opacity: 0.35,
      });
    }

    for (const path of drawPaths) {
      const page = pages[path.page - 1];
      if (!page) continue;
      const { height } = page.getSize();
      if (path.points.length > 1) {
        for (let i = 0; i < path.points.length - 1; i++) {
          page.drawLine({
            start: { x: path.points[i].x, y: height - path.points[i].y },
            end: { x: path.points[i + 1].x, y: height - path.points[i + 1].y },
            thickness: path.width,
            color: rgb(
              parseInt(path.color.slice(1, 3), 16) / 255,
              parseInt(path.color.slice(3, 5), 16) / 255,
              parseInt(path.color.slice(5, 7), 16) / 255
            ),
          });
        }
      }
    }

    const modifiedPdfBytes = await pdfDocLib.save();
    const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "edited-charter.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearPage = () => {
    setTextAnnotations((prev) => prev.filter((t) => t.page !== currentPage));
    setDrawPaths((prev) => prev.filter((d) => d.page !== currentPage));
    setHighlights((prev) => prev.filter((h) => h.page !== currentPage));
  };

  const toolButtons: { tool: Tool; icon: typeof Type; label: string }[] = [
    { tool: "select", icon: Type, label: "Select" },
    { tool: "text", icon: Type, label: "Add Text" },
    { tool: "draw", icon: Pencil, label: "Draw" },
    { tool: "highlight", icon: Highlighter, label: "Highlight" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex-wrap">
        <div className="flex items-center gap-1">
          {toolButtons.map(({ tool, icon: Icon, label }) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              title={label}
              className={`p-2 rounded-lg text-sm transition-colors ${
                activeTool === tool
                  ? "bg-violet-900 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
          <label className="text-xs text-slate-500 dark:text-slate-400">Color:</label>
          <input
            type="color"
            value={activeTool === "draw" ? drawColor : textColor}
            onChange={(e) => {
              if (activeTool === "draw") setDrawColor(e.target.value);
              else setTextColor(e.target.value);
            }}
            className="w-7 h-7 rounded cursor-pointer border-0"
          />
          {(activeTool === "draw" || activeTool === "highlight") && (
            <>
              <label className="text-xs text-slate-500 dark:text-slate-400 ml-2">Size:</label>
              <input
                type="range"
                min="1"
                max="10"
                value={drawWidth}
                onChange={(e) => setDrawWidth(Number(e.target.value))}
                className="w-16"
              />
            </>
          )}
          {activeTool === "text" && (
            <>
              <label className="text-xs text-slate-500 dark:text-slate-400 ml-2">Font:</label>
              <input
                type="number"
                min="8"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-14 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleClearPage} title="Clear page" className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={() => setScale((s) => Math.min(s + 0.25, 4))} title="Zoom in" className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))} title="Zoom out" className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400 mx-2">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 flex items-start justify-center p-4">
        <div className="relative inline-block shadow-lg">
          <canvas ref={canvasRef} className="block" />
          <canvas
            ref={overlayRef}
            className="absolute top-0 left-0 cursor-crosshair"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={() => {
              if (isDrawing) {
                setIsDrawing(false);
                setCurrentPath([]);
              }
            }}
          />
          {editingTextId && (
            <div
              className="absolute z-10"
              style={{
                left: textAnnotations.find((t) => t.id === editingTextId)?.x ?? 0,
                top: (textAnnotations.find((t) => t.id === editingTextId)?.y ?? 0) - fontSize,
              }}
            >
              <input
                autoFocus
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={handleTextSave}
                onKeyDown={(e) => e.key === "Enter" && handleTextSave()}
                className="bg-white dark:bg-slate-800 border border-violet-500 rounded px-1 text-sm text-slate-900 dark:text-white outline-none"
                style={{ fontSize: `${fontSize}px`, color: textColor }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-900 px-4 py-2 text-sm text-white transition-colors hover:bg-violet-950"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>
    </div>
  );
}
