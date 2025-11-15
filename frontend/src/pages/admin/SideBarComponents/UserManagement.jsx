import { Ban, ChevronDown, Columns2, DollarSign, Download, Ellipsis, Eye, ShieldCheck, UserPlus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PopoverClose } from "@radix-ui/react-popover"

const UserManagement = () => {

  const users = [
    {
      id: 1,
      avatar: 'JD',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-06-01',
      point: 120,
      action: 'Edit',
    },
    {
      id: 2,
      avatar: 'AS',
      name: 'Alice Smith',
      email: 'alice.smith@example.com',
      role: 'owner',
      status: 'inactive',
      lastLogin: '2024-05-28',
      point: 85,
      action: 'Edit',
    },
    {
      id: 3,
      avatar: 'BW',
      name: 'Bob Williams',
      email: 'bob.williams@example.com',
      role: 'renter',
      status: 'active',
      lastLogin: '2024-06-02',
      point: 95,
      action: 'Edit',
    }
  ]
  return (
    <div className="p-4 lg:p-6 dark:bg-[#020617] ">
      <div className="space-y-6">
        <div className="flex items-center justify-between" >
          {/* User Management Title */}
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">User Management</h1>
            <p className="text-secondary-600 dark:text-secondary-400">Manage your team members and their account permissions</p>
          </div>
          {/* User Management Actions */}
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500 px-4 py-2 text-base">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 px-4 py-2 text-base">
              <UserPlus />
              Add User
            </button>
          </div>
        </div>
        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Users</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">10</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          {/* Active Users */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Users</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">10</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          {/* Pending Invitations */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Users</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">10</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          {/* Pending Invitations */}
          <div className="card transition-all duration-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Users</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">10</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <ShieldCheck className="lucide lucide-shield h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
        </div>
        {/* List of users  */}
        <div className="card p-6 transition-all duration-200">
          <div className="p-6">
            <div className="w-full space-y-4">
              {/* Search and filter */}
              <div className="flex items-center justify-between gap-2">
                <div className="w-full">
                  <input type="text" className="input max-w-sm" placeholder="Search by name..." />
                </div>
                <div className="relative inline-block text-left">
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors duration-150">
                    <button className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-700 dark:text-secondary-300 focus:ring-secondary-500 px-3 py-1.5 text-sm">
                      <Columns2 className="lucide lucide-columns2 lucide-columns-2 h-4 w-4 mr-2" />
                      Columns
                      <ChevronDown className="lucide lucide-chevron-down h-4 w-4 ml-2" />
                    </button>
                  </button>
                </div>

              </div>
              {/* table */}
              <div>

                <Table>
                  <TableCaption>A list of your recent users.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Avatar</TableHead>
                      <TableHead>NAME</TableHead>
                      <TableHead>EMAIL</TableHead>
                      <TableHead>ROLE</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>LAST LOGIN</TableHead>
                      <TableHead>POINT</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.avatar}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell className={'text-secondary-600 dark:text-secondary-400'}>{user.email}</TableCell>
                        <TableCell>
                          {/* check if role is admin , owner or renter */}
                          { }                          {user.role === 'admin' && (
                            <span className="px-2 py-1 rounded-full text-sm bg-red-100 text-red-800">Admin</span>
                          )}
                          {user.role === 'owner' && (
                            <span className="px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">Owner</span>
                          )}
                          {user.role === 'renter' && (
                            <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">Renter</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* check if status is active or inactive */}
                          {user.status === 'active' ? (
                            <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">Active</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800">Inactive</span>
                          )}
                        </TableCell>
                        <TableCell className={'text-secondary-600 dark:text-secondary-400'}>{user.lastLogin}</TableCell>
                        <TableCell className={'text-secondary-600 dark:text-secondary-400'}>{user.point}</TableCell>
                        <TableCell>

                          {/* trigger "view more" in each user */}
                          <Popover className="hover:cursor-pointer">
                            <PopoverTrigger>
                              <Button variant={'outline'} className={'hover:cursor-pointer p-6 px-19'}>
                                <Ellipsis />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className={'p-0'}>
                              <div className="py-1 flex flex-col">
                                {/* view details */}
                                <PopoverClose>
                                  <button className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white">
                                    <span className="flex-shrink-0">
                                      <Eye className="lucide lucide-eye h-4 w-4" />
                                    </span>
                                    <span>View Details</span>
                                  </button>
                                </PopoverClose>
                                {/* ban account */}
                                <PopoverClose>
                                  <button className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white">
                                    <span className="flex-shrink-0">
                                      <Ban className="lucide lucide-ban h-4 w-4" />
                                    </span>
                                    <span>Ban Account</span>
                                  </button>
                                </PopoverClose>
                                {/* view booking history */}
                                <PopoverClose>
                                  <button className="group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 cursor-pointer text-secondary-900 dark:text-white">
                                    <span className="flex-shrink-0">
                                      <DollarSign className="lucide lucide-dollar-sign h-4 w-4" />
                                    </span>
                                    <span>View Booking History</span>
                                  </button>
                                </PopoverClose>
                              </div>
                            </PopoverContent>
                          </Popover>

                        </TableCell>
                        <TableCell className="text-right">{user.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={8}>Total</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>


              </div>
              {/*  */}
              <div className="flex items-center justify-between">

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagement