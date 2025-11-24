import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (!totalPages || totalPages < 1) return null;

  const handlePageClick = (page) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-10 py-6 border-t border-gray-200">
      {/* Trái: Thông tin trang */}
      <div className="text-sm text-gray-700 order-2 sm:order-1">
        Hiển thị trang <strong>{currentPage}</strong> trên{" "}
        <strong>{totalPages}</strong>
      </div>

      {/* Phải: Các nút phân trang */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Nút Trước */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200
            ${
              currentPage === 1
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-100 cursor-pointer hover:shadow-sm"
            }
          `}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Các số trang */}
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 text-gray-500 select-none"
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`
                w-10 h-10 flex items-center justify-center rounded-md font-medium transition-all duration-200
                ${
                  page === currentPage
                    ? "bg-black text-white cursor-default shadow-md"
                    : "hover:bg-gray-100 cursor-pointer hover:shadow-sm text-gray-700"
                }
              `}
            >
              {page}
            </button>
          );
        })}

        {/* Nút Tiếp */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200
            ${
              currentPage === totalPages
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-100 cursor-pointer hover:shadow-sm"
            }
          `}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
