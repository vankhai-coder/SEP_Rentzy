import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const DeleteConfirmDialog = ({ open, onOpenChange, brand, onConfirm }) => {
  if (!brand) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl">Xác nhận xóa</DialogTitle>
          </div>
          <DialogDescription className="text-base space-y-3 pt-2">
            <p>
              Bạn có chắc chắn muốn xóa thương hiệu{" "}
              <strong className="text-gray-900 dark:text-gray-100">
                "{brand.name}"
              </strong>
              ?
            </p>
            {brand.vehicle_count > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Thương hiệu này có{" "}
                  <strong>{brand.vehicle_count} xe</strong>. Việc xóa có thể ảnh
                  hưởng đến dữ liệu liên quan.
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hành động này không thể hoàn tác.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-6"
          >
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            className="px-6 bg-red-500 hover:bg-red-600 text-white font-medium"
          >
            Xóa thương hiệu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
