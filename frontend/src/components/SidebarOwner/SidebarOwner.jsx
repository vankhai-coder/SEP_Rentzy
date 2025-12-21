// fe/src/components/SidebarOwner/SidebarOwner.jsx
import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  MdOutlineDashboard,
  MdDirectionsCar,
  MdCalendarMonth,
  MdNotifications,
  MdShowChart,
  MdLogout,
  MdTransform,
  MdArrowBack,
} from "react-icons/md";
import {
  FaClipboardList,
} from "react-icons/fa";
import axiosInstance from "@/config/axiosInstance";


const SidebarOwner = ({ isOpen, onClose }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timerId;

    const fetchUnread = async () => {
      try {
        const res = await axiosInstance.get("/api/owner/dashboard/notifications", { params: { limit: 1 } });
        if (res.data && res.data.success && isMounted) {
          setUnreadCount(res.data.data.unreadCount || 0);
        }
      } catch {
        // silent
      }
    };

    fetchUnread();
    timerId = setInterval(fetchUnread, 30000);

    return () => {
      isMounted = false;
      if (timerId) clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || "";
    if (!base) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws`;

    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg && msg.type === "NOTIFICATIONS_UNREAD_COUNT") {
            const next = msg.data && typeof msg.data.unreadCount === "number" ? msg.data.unreadCount : 0;
            setUnreadCount(next);
          }
        } catch (err) {
          console.error(err);
        }
      };
    } catch (err) {
      console.error(err);
    }
    return () => { try { ws && ws.close(); } catch (err) { console.error(err); } };
  }, []);
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[999] md:hidden" onClick={onClose} />
      )}
      <div
        className={`bg-[#2c3e50] text-[#ecf0f1] py-5 flex flex-col h-screen overflow-y-auto shadow-[2px_0_5px_rgba(0,0,0,0.3)] z-[1000] w-[80vw] md:w-[250px] fixed top-0 left-0 transform transition-transform duration-200 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Back icon and title */}
        <div className="flex items-center gap-3 px-5 pt-3 mb-[30px]">
          <NavLink
            to="/account"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#34495e] text-[#ecf0f1] hover:bg-[#3b4b61] flex-shrink-0"
            title="Quay về hồ sơ"
            aria-label="Quay về hồ sơ"
          >
            <MdArrowBack className="text-xl" />
          </NavLink>
          <div className="text-2xl font-bold text-[#3498db]">
            Bảng điều khiển chủ xe
          </div>
        </div>
        <nav>
          <ul className="list-none p-0 m-0">
            <li className="mb-[10px]">
              <NavLink
                to="/owner/overview"
                className={({ isActive }) =>
                  `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive
                    ? "bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]"
                    : ""
                  }`
                }
              >
                <MdOutlineDashboard className="mr-[10px] text-xl" />
                Tổng quan
              </NavLink>
            </li>
            <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
            <li className="mb-[10px]">
              <NavLink
                to="/owner/vehicle-management"
                className={({ isActive }) =>
                  `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive
                    ? "bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]"
                    : ""
                  }`
                }
              >
                <MdDirectionsCar className="mr-[10px] text-xl" />
                Quản lý xe
              </NavLink>
            </li>
            <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
            <li className="mb-[10px]">
              <NavLink
                to="/owner/booking-management"
                className={({ isActive }) =>
                  `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive
                    ? "bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]"
                    : ""
                  }`
                }
              >
                <MdCalendarMonth className="mr-[10px] text-xl" />
                Quản lý đơn thuê
              </NavLink>
            </li>
            <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
            <li>
              <NavLink
                to="/owner/transaction-management"
                className={({ isActive }) =>
                  `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive
                    ? "bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]"
                    : ""
                  }`
                }
              >
                <MdTransform className="mr-[10px] text-xl" />
                Quản lí giao dịch
              </NavLink>
            </li>
            <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>

            <li className="mb-[10px]">
              <NavLink
                to="/owner/revenue"
                className={({ isActive }) =>
                  `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive
                    ? "bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]"
                    : ""
                  }`
                }
              >
                <MdShowChart className="mr-[10px] text-xl" />
                Doanh thu
              </NavLink>
            </li>
            <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
            <li className="mb-[10px]">
              <NavLink
                to="/owner/vehicle-reviews"
                className={({ isActive }) =>
                  `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive
                    ? "bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]"
                    : ""
                  }`
                }
              >
                <FaClipboardList className="mr-[8px] text-lg" />
                Đánh giá về xe của tôi
              </NavLink>
            </li>
            <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
            <li className="mb-[10px]">
              <NavLink
                to="/owner/notifications"
                className={({ isActive }) =>
                  `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive
                    ? "bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]"
                    : ""
                  }`
                }
              >
                <MdNotifications className="mr-[10px] text-xl" />
                Thông báo
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            </li>

            <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
            <li className="mb-[10px]">
              <NavLink
                to="/owner/vouchers"
                className={({ isActive }) =>
                  `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive
                    ? "bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]"
                    : ""
                  }`
                }
              >
                <MdCalendarMonth className="mr-[10px] text-xl" />
                Quản lí mã giảm giá
              </NavLink>
            </li>


            <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>

            <li className="mb-[10px]">
              <Link
                to="/logout"
                className="flex items-center px-5 py-[10px] text-[#ffffff] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#e02b2b]"
              >
                <MdLogout className="mr-[10px] text-xl" />
                Đăng xuất
              </Link>
            </li>
            <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default SidebarOwner;