import React from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const clampedCurrent = Math.min(Math.max(1, currentPage), totalPages);

  const createPageWindow = () => {
    // Chỉ hiển thị 3 nút trang số tại một thời điểm
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = clampedCurrent - 1;
    let end = clampedCurrent + 1;

    if (start < 1) {
      start = 1;
      end = 3;
    }

    if (end > totalPages) {
      end = totalPages;
      start = totalPages - 2;
    }

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const pages = createPageWindow();

  const baseBtn =
    'px-3 py-1.5 text-sm border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const pageBtn = (active) =>
    `px-3 py-1.5 text-sm border rounded-md ${
      active ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'
    }`;

  return (
    <div className="flex items-center gap-2">
      <button
        className={baseBtn}
        onClick={() => onPageChange(clampedCurrent - 1)}
        disabled={clampedCurrent === 1}
        aria-label="Trang trước"
      >
        <MdChevronLeft className="inline-block" />
      </button>

      {pages.map((p, idx) => (
        <button
          key={`page-${p}-${idx}`}
          className={pageBtn(p === clampedCurrent)}
          onClick={() => onPageChange(p)}
          aria-current={p === clampedCurrent ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      <button
        className={baseBtn}
        onClick={() => onPageChange(clampedCurrent + 1)}
        disabled={clampedCurrent === totalPages}
        aria-label="Trang sau"
      >
        <MdChevronRight className="inline-block" />
      </button>
    </div>
  );
};

export default Pagination;