// src/pages/renter/vehicles/HomeCar.jsx (hoặc tương tự)
import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicles } from "../../../redux/features/renter/vehicles/vehicleSlice";
import { fetchBrands } from "../../../redux/features/renter/brand/brandSlice";
import { fetchFavorites } from "../../../redux/features/renter/favorite/favoriteSlice";
import CarList from "../../../components/renter/vehicles/car/CarList";
import BrandList from "../../../components/renter/brand/BrandList";
import SearchForm from "../../../components/renter/search/SearchForm";
import Pagination from "../../../components/common/Pagination";
import CompareModal from "../../../components/renter/vehicles/compare/CompareModal";
import { compareVehicles } from "../../../redux/features/renter/compare/compareSlice";
import { Scale } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LoginWithPhoneNumber from "../../../pages/renter/auth/LoginWithPhoneNumber.jsx";
import RegisterWithPhoneNumber from "../../../pages/renter/auth/RegisterWithPhoneNumber.jsx";
import Register from "../../../pages/renter/auth/Register.jsx";
import Login from "../../../pages/renter/auth/Login.jsx";

const HomeCar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  // state for login and register with phone Dialog :
  const [isLoginWithPhoneOpen, setIsLoginWithPhoneOpen] = React.useState(false);
  const [isRegisterWithPhoneOpen, setIsRegisterWithPhoneOpen] =
    React.useState(false);
  // state for login and register with email Dialog :
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [registerOpen, setRegisterOpen] = React.useState(false);

  // get "isToggleLoginDialog" from query params to open login dialog when redirected from other pages
  React.useEffect(() => {
    const isToggleLoginDialog = searchParams.get("isToggleLoginDialog");
    if (isToggleLoginDialog) {
      setLoginOpen(true);
    }
  }, [searchParams]);

  const {
    vehicles,
    loading: vehicleLoading,
    currentPage,
    totalPages,
  } = useSelector((state) => state.vehicleStore);

  const {
    brands,
    loading: brandLoading,
    error: brandError,
  } = useSelector((state) => state.brandStore);

  const { userId } = useSelector((state) => state.userStore);
  const { compareList } = useSelector((state) => state.compareStore);
  const [showModal, setShowModal] = useState(false);

  // Load dữ liệu - cố định 8 xe/trang
  useEffect(() => {
    dispatch(fetchVehicles({ type: "car", page: 1, limit: 8 }));
    dispatch(fetchBrands("car"));
    if (userId) dispatch(fetchFavorites());
  }, [dispatch, userId]);

  const handleSearch = useCallback(
    (formData) => {
      if (!formData.location?.trim()) {
        toast.error("Vui lòng chọn địa điểm!");
        return;
      }
      const newParams = { ...params, ...formData };
      setSearchParams(newParams);
      navigate(`/cars/search?${new URLSearchParams(newParams)}`);
    },
    [params, navigate, setSearchParams]
  );

  const handlePageChange = (page) => {
    dispatch(fetchVehicles({ type: "car", page, limit: 8 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenCompare = () => {
    if (compareList.length < 2) {
      toast.warn("Chọn ít nhất 2 xe để so sánh!");
      return;
    }
    dispatch(compareVehicles());
    setShowModal(true);
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
      <section className="mb-3 sm:mb-4">
        <SearchForm
          type="car"
          brands={brands}
          initialValues={params}
          onSubmit={handleSearch}
          className="bg-green-100 p-4 sm:p-6 md:p-8 lg:p-10 rounded-lg"
        />
      </section>

      <div className="flex justify-end mb-3 sm:mb-4">
        {compareList.length > 0 && (
          <button
            onClick={handleOpenCompare}
            className="flex items-center gap-1 sm:gap-2 bg-blue-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm sm:text-base"
            disabled={compareList.length < 2}
          >
            <Scale size={16} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">
              So Sánh ({compareList.length} xe)
            </span>
            <span className="sm:hidden">So Sánh</span>
          </button>
        )}
      </div>

      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
          Hãng Xe Nổi Bật
        </h2>
        {brandLoading ? (
          <p>Đang tải hãng xe...</p>
        ) : brandError ? (
          <p>{brandError}</p>
        ) : (
          <BrandList brands={brands.slice(0, 8)} vehicleType="car" />
        )}
      </section>

      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
        Danh Sách Xe Ô Tô
      </h2>

      {vehicleLoading ? (
        <p className="text-center py-10">Đang tải xe...</p>
      ) : (
        <CarList cars={vehicles} />
      )}

      {/* PHÂN TRANG ĐẸP - LUÔN HIỂN THỊ */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {showModal && (
        <CompareModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          compareList={compareList}
        />
      )}

      {/* Login with Phone */}
      <Dialog
        open={isLoginWithPhoneOpen}
        onOpenChange={setIsLoginWithPhoneOpen}
      >
        {/* <DialogTrigger asChild>
          <Button
            className={"p-6 border border-black"}
            variant={"outline"}

          >
            Đăng nhập với số điện thoại
          </Button>
        </DialogTrigger> */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription>
              <LoginWithPhoneNumber
                setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen}
                setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen}
                setLoginOpen={setLoginOpen}
              />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Register with Phone */}
      <Dialog
        open={isRegisterWithPhoneOpen}
        onOpenChange={setIsRegisterWithPhoneOpen}
      >
        {/* <DialogTrigger asChild>
          <Button
            className={"p-6 border border-black"}
            variant={"outline"}

          >
            Đăng ký với số điện thoại
          </Button>
        </DialogTrigger> */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription>
              <RegisterWithPhoneNumber
                setRegisterOpen={setRegisterOpen}
                setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen}
                setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen}
              />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Register with email button: */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        {/* <DialogTrigger>
          
            className={"p-6"}
          >
            Đăng Ký
          </a>
        </DialogTrigger> */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription>
              <Register
                setRegisterOpen={setRegisterOpen}
                setLoginOpen={setLoginOpen}
                setIsRegisterWithPhoneOpen={setIsRegisterWithPhoneOpen}
              />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Login with email Button */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        {/* <DialogTrigger asChild>
          <Button
            className={"p-6 border border-black"}
            variant={"outline"}

          >
            Đăng Nhập
          </Button>
        </DialogTrigger> */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription>
              <Login
                setRegisterOpen={setRegisterOpen}
                setLoginOpen={setLoginOpen}
                setIsLoginWithPhoneOpen={setIsLoginWithPhoneOpen}
              />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeCar;
