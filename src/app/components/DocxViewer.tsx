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
