import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/config/axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, X } from "lucide-react";
import { toast } from "react-toastify";

const CreateBrandDialog = ({ open, onOpenChange, brands }) => {
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    category: "both",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  // === Validation Rules ===
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = "Tên thương hiệu là bắt buộc";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Tên phải có ít nhất 2 ký tự";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Tên không được vượt quá 100 ký tự";
    } else if (!/^[a-zA-Z0-9\s\-&().]+$/.test(formData.name.trim())) {
      newErrors.name =
        "Tên chỉ chứa chữ, số, khoảng trắng, dấu gạch ngang, &, (), .";
    }

    // Check duplicate (case-insensitive)
    const brandNameLower = formData.name.trim().toLowerCase();
    if (brands.some((b) => b.name.toLowerCase() === brandNameLower)) {
      newErrors.name = `Thương hiệu "${formData.name.trim()}" đã tồn tại`;
    }

    // Country validation
    if (formData.country?.trim() && formData.country.trim().length > 100) {
      newErrors.country = "Quốc gia không được vượt quá 100 ký tự";
    }

    // Category validation
    if (!["car", "motorbike", "both"].includes(formData.category)) {
      newErrors.category = "Loại xe không hợp lệ";
    }

    // File validation
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        newErrors.logo = "File phải là ảnh";
      } else if (selectedFile.size > 5 * 1024 * 1024) {
        newErrors.logo = "Ảnh không được vượt quá 5MB";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // === File Handlers ===
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result);
      };
      reader.readAsDataURL(file);
      setSelectedFile(file);
      setErrors((prev) => ({ ...prev, logo: "" }));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    setErrors((prev) => ({ ...prev, logo: "" }));
  };

  // === Create Brand ===
  const handleCreateBrand = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const toastId = toast.loading("Đang thêm thương hiệu...");

    try {
      const fd = new FormData();
      fd.append("name", formData.name.trim());
      fd.append("country", formData.country.trim() || "");
      fd.append("category", formData.category);

      if (selectedFile) {
        fd.append("logo", selectedFile);
      }

      await axiosInstance.post("/api/admin/brands", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Chờ dữ liệu cập nhật xong
      await queryClient.invalidateQueries({ queryKey: ["admin-brands"] });

      // Reset form
      setFormData({ name: "", country: "", category: "both" });
      setSelectedFile(null);
      setPreviewImage(null);
      setErrors({});

      toast.update(toastId, {
        render: "Thêm thương hiệu thành công",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      onOpenChange(false);
    } catch (error) {
      const errorMsg = error?.response?.data?.message;

      if (error?.response?.status === 409) {
        setErrors({ name: errorMsg || "Thương hiệu này đã tồn tại" });
        toast.update(toastId, {
          render: errorMsg || "Thương hiệu này đã tồn tại",
          type: "warning",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: errorMsg || "Không thể thêm thương hiệu",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", country: "", category: "both" });
    setSelectedFile(null);
    setPreviewImage(null);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm Thương Hiệu Mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 block mb-1">
                Tên thương hiệu *
              </label>
              <Input
                placeholder="VD: Toyota, Honda"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={errors.name ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {errors.name}
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 block mb-1">
                Quốc gia
              </label>
              <Input
                placeholder="VD: Nhật Bản, Đức"
                value={formData.country}
                onChange={(e) => {
                  setFormData({ ...formData, country: e.target.value });
                  setErrors((prev) => ({ ...prev, country: "" }));
                }}
                className={errors.country ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.country && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {errors.country}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 block mb-1">
                Loại xe *
              </label>
              <Select
                value={formData.category}
                onValueChange={(v) => {
                  setFormData({ ...formData, category: v });
                  setErrors((prev) => ({ ...prev, category: "" }));
                }}
                disabled={loading}
              >
                <SelectTrigger
                  className={errors.category ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Chọn loại xe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Ô tô</SelectItem>
                  <SelectItem value="motorbike">Xe máy</SelectItem>
                  <SelectItem value="both">Cả hai</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 block mb-2">
              Logo Thương Hiệu
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="create-brand-logo-input"
              disabled={loading}
            />
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                errors.logo
                  ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                  : "border-gray-300 hover:border-blue-500 bg-gray-50 dark:bg-gray-900/20"
              } ${loading ? "opacity-60 pointer-events-none" : ""}`}
            >
              {previewImage ? (
                <div className="relative inline-block">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-32 h-32 object-contain mx-auto mb-3 rounded border border-gray-300 bg-white"
                  />
                  <button
                    onClick={removeFile}
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors"
                    title="Xóa ảnh"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="mt-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(selectedFile?.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        document
                          .getElementById("create-brand-logo-input")
                          ?.click();
                      }}
                      className="mt-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      disabled={loading}
                    >
                      Thay đổi ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() =>
                    !loading &&
                    document.getElementById("create-brand-logo-input")?.click()
                  }
                  className="cursor-pointer"
                >
                  <ImagePlus className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1 font-medium">
                    Tải lên logo thương hiệu
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    PNG, JPG, GIF (Max 5MB)
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      document
                        .getElementById("create-brand-logo-input")
                        ?.click();
                    }}
                    disabled={loading}
                  >
                    Chọn Ảnh
                  </Button>
                </div>
              )}
            </div>
            {errors.logo && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <span>⚠️</span> {errors.logo}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
              className="px-6"
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateBrand}
              disabled={loading}
              className="px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Đang thêm...
                </span>
              ) : (
                "Thêm Thương Hiệu"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBrandDialog;
