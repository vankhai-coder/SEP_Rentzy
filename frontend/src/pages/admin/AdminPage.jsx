import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SidebarAdmin from '../../components/sdiebarAdmin/SidebarAdmin';
import ApprovalVehicle from './adminManagement/ApprovalVehicle';
import ManagementVehicles from './adminManagement/ManagementVehicles';

const AdminPage = () => {
    return(
        <div className="flex min-h-screen">
            <SidebarAdmin />
            <div className='flex-grow ml-[250px] p-5 bg-gray-50 min-h-screen'>
                <Routes>
                    <Route path="/" element={<div><h1>Welcome to admin</h1></div>} />
                    <Route path="/approvalvehicle" element={<ApprovalVehicle />} />
                    <Route path="/managementvehicle" element={<ManagementVehicles />} />
                </Routes>
            </div>
        </div>
    )
};

export default AdminPage;

