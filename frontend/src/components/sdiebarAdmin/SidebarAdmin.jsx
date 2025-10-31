import { NavLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/redux/features/auth/authSlice";


const SidebarAdmin = () => {
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logoutUser());
        window.location.href = "/";
    };

    return(
        <div className="w-[250px] bg-[#2c3e50] text-[#ecf0f1] py-5 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto shadow-[2px_0_5px_rgba(0,0,0,0.3)] z-[1000]">
            <div className="text-2xl font-bold text-center mb-[30px] text-[#3498db]">Bảng điều khiển admin</div>
            <nav>
                <ul className="list-none p-0 m-0">
                    <li className="mb-[10px]">
                        <NavLink
                            to="/admin/dashboard"
                            className={({ isActive }) =>
                                isActive
                                    ? "block px-4 py-2 bg-[#3498db] text-[#fff] rounded-md"
                                    : "block px-4 py-2 text-[#ecf0f1] rounded-md hover:bg-[#3498db] hover:text-[#fff]"
                            }
                        >
                            Tổng quan
                        </NavLink>
                    </li>
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                    <li className="mb-[10px]">
                        <NavLink
                            to="/admin/approvalvehicle"
                            className={({ isActive }) =>
                                isActive
                                    ? "block px-4 py-2 bg-[#3498db] text-[#fff] rounded-md"
                                    : "block px-4 py-2 text-[#ecf0f1] rounded-md hover:bg-[#3498db] hover:text-[#fff]"
                            }
                        >
                            Duyệt xe
                        </NavLink>
                    </li>
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                    <li className="mb-[10px]">
                        <NavLink
                            to="/admin/managementuser"
                            className={({ isActive }) =>
                                isActive
                                    ? "block px-4 py-2 bg-[#3498db] text-[#fff] rounded-md"
                                    : "block px-4 py-2 text-[#ecf0f1] rounded-md hover:bg-[#3498db] hover:text-[#fff]"
                            }
                        >
                            Quản lí người dùng
                        </NavLink>
                    </li>
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                    <li className="mb-[10px]">
                        <NavLink
                            to="/admin/managementvehicle"
                            className={({ isActive }) =>
                                isActive
                                    ? "block px-4 py-2 bg-[#3498db] text-[#fff] rounded-md"
                                    : "block px-4 py-2 text-[#ecf0f1] rounded-md hover:bg-[#3498db] hover:text-[#fff]"
                            }
                        >
                            Quản lí xe
                        </NavLink>
                    </li>
                    <li className="h-px bg-[#34495e] my-[15px] mx-5"></li>
                    <li className="mb-[10px]">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left block px-4 py-2 text-[#ecf0f1] rounded-md hover:bg-[#3498db] hover:text-[#fff] transition-colors"
                        >
                            Đăng xuất
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    )
};

export default SidebarAdmin;