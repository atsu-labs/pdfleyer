import React, { useEffect, useRef, useState } from 'react';

export interface PdfViewerProps {
  url: string;
  page?: number;
  onLoadSuccess?: (numPages: number) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, page = 1, onLoadSuccess }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      setPdfDoc(null);
      try {
        // Dynamic import of pdfjs-dist
        const pdfjs = await import('pdfjs-dist');
        
        // Set worker source to the file in public directory
        (pdfjs as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = (pdfjs as any).getDocument(url);
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        
        setPdfDoc(pdf);
        onLoadSuccess?.(pdf.numPages);
        setLoading(false);
      } catch (err: any) {
        if (cancelled) return;
        const errorMessage = err?.message || String(err);
        setError(errorMessage);
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [url, onLoadSuccess]);

  // Render specific page
  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      if (!pdfDoc) return;
      
      try {
        const pdfPage = await pdfDoc.getPage(page);
        if (cancelled) return;
        
        const viewport = pdfPage.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        
        await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      } catch (err: any) {
        if (cancelled) return;
        const errorMessage = err?.message || String(err);
        setError(errorMessage);
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, page]);

  return (
    <div>
      {loading && <div>Loading PDF...</div>}
      {error && <div style={{ color: 'red' }}>Error loading PDF: {error}</div>}
      <canvas data-testid="pdf-canvas" ref={canvasRef} style={{ display: loading || error ? 'none' : 'block' }} />
    </div>
  );
};

export default PdfViewer;
