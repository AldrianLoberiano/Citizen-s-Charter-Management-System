import { useEffect, useState } from "react";
import mammoth from "mammoth";

interface DocxViewerProps {
  fileUrl: string;
  className?: string;
}

export function DocxViewer({ fileUrl, className = "" }: DocxViewerProps) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch document");
        return res.arrayBuffer();
      })
      .then((buffer) =>
        mammoth.convertToHtml({ arrayBuffer: buffer })
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
