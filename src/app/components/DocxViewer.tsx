import { useEffect, useState } from "react";
import mammoth from "mammoth";

interface DocxViewerProps {
  fileUrl: string;
  className?: string;
}

export function DocxViewer({ fileUrl, className = "" }: DocxViewerProps) {
