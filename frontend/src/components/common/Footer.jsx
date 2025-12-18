import React from "react";
import { Car, Bike, Users, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src="/rentzy_logo.png" alt="RENTZY" className="h-8 w-auto" />
              <h3 className="text-xl font-bold text-blue-300">RENTZY</h3>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">
              Hệ thống thuê xe trực tuyến hàng đầu, mang đến trải nghiệm tiện
              lợi và an toàn cho mọi hành trình của bạn.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">
              Liên Kết Nhanh
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/cars"
                  className="text-gray-200 hover:text-white transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <Car className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  Xe Ô Tô
                </a>
              </li>
              <li>
                <a
                  href="/motorbikes"
                  className="text-gray-200 hover:text-white transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <Bike className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  Xe Máy
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-gray-200 hover:text-white transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <Users className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  Về Chúng Tôi
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Liên Hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-300" />
                <a
                  href="mailto:rentzy.vehicle@gmail.com"
                  className="text-gray-200 hover:text-white transition-colors duration-200"
                >
                  rentzy.vehicle@gmail.com
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-300" />
                <a
                  href="tel:+84815909549"
                  className="text-gray-200 hover:text-white transition-colors duration-200"
                >
                  0815 909 549
                </a>
              </li>
              <li className="flex items-start space-x-3 pt-1">
                <MapPin className="w-4 h-4 text-blue-300 mt-0.5" />
                <p className="text-gray-200 text-sm">Đà Nẵng, Việt Nam</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Divider */}
        <div className="border-t border-gray-600 my-8"></div>

        {/* Copyright & Social */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-300">
          <div>© 2025 RENTZY. Tất cả quyền được bảo lưu.</div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {/* Add social links if available; placeholders here */}
            <a
              href="#"
              className="hover:text-blue-300 transition-colors duration-200"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="#"
              className="hover:text-blue-300 transition-colors duration-200"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
