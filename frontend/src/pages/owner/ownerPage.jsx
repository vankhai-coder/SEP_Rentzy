import React from 'react'
import './ownerPage.css'
import SidebarOwner from '@/components/SidebarOwner/SidebarOwner';
const OwnerPage = () => {
  return (
    <div className="dashboard-container">
      <h1 className="text-2xl font-bold">Owner Dashboard</h1>
      <SidebarOwner />
    </div>
  )
}

export default OwnerPage;
