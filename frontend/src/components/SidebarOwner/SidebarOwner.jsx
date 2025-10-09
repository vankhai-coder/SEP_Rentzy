// fe/src/components/SidebarOwner/SidebarOwner.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdOutlineDashboard, MdDirectionsCar, MdCalendarMonth, MdNotifications, MdShowChart, MdLogout, MdAccountCircle } from 'react-icons/md';
import { FaCar, FaClipboardList, FaBell, FaMoneyCheckAlt, FaTimesCircle } from 'react-icons/fa';

// SidebarOwner nhận prop handleLogout
const SidebarOwner = ({ handleLogout }) => {
    return (
        <div className="w-[250px] bg-[#2c3e50] text-[#ecf0f1] py-5 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto shadow-[2px_0_5px_rgba(0,0,0,0.3)] z-[1000]">
            <div className="text-2xl font-bold text-center mb-[30px] text-[#3498db]">Bảng điều khiển chủ xe</div>
            <nav>
                <ul className="list-none p-0 m-0">
                    <li className="mb-[10px]">
                        <NavLink
                            to="/owner/overview"
                            className={({ isActive }) => `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive ? 'bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]' : ''}`}
                        >
                            <MdOutlineDashboard className="mr-[10px] text-xl" />
                            Tổng quan
                        </NavLink>
                    </li>
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                    <li className="mb-[10px]">
                        <NavLink
                            to="/owner/vehicle-management"
                            className={({ isActive }) => `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive ? 'bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]' : ''}`}
                        >
                            <MdDirectionsCar className="mr-[10px] text-xl" />
                            Quản lý xe
                        </NavLink>
                    </li>
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                    <li className="mb-[10px]">
                        <NavLink
                            to="/owner/booking-management"
                            className={({ isActive }) => `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive ? 'bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]' : ''}`}
                        >
                            <MdCalendarMonth className="mr-[10px] text-xl" />
                            Quản lý đơn thuê
                        </NavLink>
                    </li>
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                    <li className="mb-[10px]">
                        <NavLink
                            to="/owner/cancel-requests"
                            className={({ isActive }) => `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive ? 'bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]' : ''}`}
                        >
                            <FaTimesCircle className="mr-[8px] text-lg" />
                            Duyệt đơn huỷ
                        </NavLink>
                    </li>
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                  
            
                    <li className="mb-[10px]">
                        <NavLink
                            to="/owner/revenue"
                            className={({ isActive }) => `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive ? 'bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]' : ''}`}
                        >
                            <MdShowChart className="mr-[10px] text-xl" />
                            Doanh thu
                        </NavLink>
                    </li>
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                    <li className="mb-[10px]">
                        <NavLink
                            to="/owner/vehicle-reviews"
                            className={({ isActive }) => `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive ? 'bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]' : ''}`}
                        >
                            <FaClipboardList className="mr-[8px] text-lg" />
                            Đánh giá về xe của tôi
                        </NavLink>
                    </li>
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                    <li className="mb-[10px]">
                        <NavLink
                            to="/owner/notifications"
                            className={({ isActive }) => `flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1] ${isActive ? 'bg-[#3498db] text-white font-bold border-l-[5px] border-white pl-[15px]' : ''}`}
                        >
                            <MdNotifications className="mr-[10px] text-xl" />
                            Thông báo
                        </NavLink>
                    </li>
              
                 
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                 
                    <li className="mb-[10px]">
                        <a href="#" className="flex items-center px-5 py-[10px] text-[#ecf0f1] no-underline text-base transition-colors duration-300 hover:bg-[#34495e] hover:text-[#ecf0f1]" onClick={(e) => { e.preventDefault(); handleLogout(e); }}>
                            <MdLogout className="mr-[10px] text-xl" />
                            Đăng xuất
                        </a>
                    </li>
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                </ul>
            </nav>
        </div>
    );
};

export default SidebarOwner;