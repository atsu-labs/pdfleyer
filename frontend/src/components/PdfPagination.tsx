import React, { useState } from 'react';

export interface PdfPaginationProps {
  numPages: number;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

export const PdfPagination: React.FC<PdfPaginationProps> = ({ numPages, initialPage = 1, onPageChange }) => {
  const [page, setPage] = useState<number>(initialPage);

  const goNext = () => {
    setPage((p) => {
      const np = Math.min(numPages, p + 1);
      onPageChange?.(np);
      return np;
    });
  };

  const goPrev = () => {
    setPage((p) => {
      const np = Math.max(1, p - 1);
      onPageChange?.(np);
      return np;
    });
  };

  return (
    <div>
      <button aria-label="prev" onClick={goPrev} disabled={page <= 1}>
        Prev
      </button>
      <span data-testid="page-indicator">{page} / {numPages}</span>
      <button aria-label="next" onClick={goNext} disabled={page >= numPages}>
        Next
      </button>
    </div>
  );
};

export default PdfPagination;
