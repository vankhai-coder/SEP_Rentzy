import { useState } from "react" // <-- Import useState
import { ChevronRightIcon, Ellipsis, EllipsisVertical, Mic, Paperclip, Phone, Search, Send, Smile, Video } from "lucide-react"
import { Link } from "react-router-dom"

const Messages = () => {
    // 1. State to manage sidebar visibility on mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Helper function to toggle the sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    // New: Handle opening a chat item (and close sidebar on mobile)
    const handleChatSelect = () => {
        // You would typically set the active chat ID here
        // For responsiveness, close the sidebar when a chat is selected on mobile
        if (window.innerWidth < 1280) { // 1280px is Tailwind's 'xl' breakpoint
            setIsSidebarOpen(false)
        }
    }

    return (
        <div className="mx-auto max-w-[1440px] p-4 md:p-6 dark:bg-[#101828]">
            {/* Removed fragile height calculation. Let content fill space. */}
            <div className="h-full">
                
                {/* Header/Breadcrumb is fine */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Chat</h2>
                    <nav>
                        <ol className="flex items-center gap-1.5">
                            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                Home
                                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                            </Link>
                            <li className="text-sm text-gray-800 dark:text-white/90">Chat</li>
                        </ol>
                    </nav>
                </div>
                
                {/* Main Content Area */}
                <div className="relative flex h-[calc(100vh-140px)] flex-col gap-6 xl:flex-row xl:gap-5">
                    
                    {/* 2. CHAT SIDE BAR (Messages List) START */}
                    {/* Added conditional classes for mobile/desktop view and a max-w to prevent overflow on very small screens */}
                    <div className={`
                        ${isSidebarOpen ? 'flex' : 'hidden'} 
                        absolute inset-0 z-50 
                        h-full w-full 
                        flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white 
                        xl:relative xl:flex xl:w-1/4 xl:min-w-[300px] xl:max-w-none 
                        dark:border-gray-800 dark:bg-white/[0.03]
                    `}>
                        <div className="sticky px-4 pt-4 pb-4 sm:px-5 sm:pt-5 xl:pb-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 sm:text-2xl dark:text-white/90">Messages</h3>
                                </div>
                                {/* Close button for mobile sidebar (optional, can use existing ellipsis) */}
                                <button 
                                    onClick={toggleSidebar} 
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white xl:hidden"
                                >
                                    <EllipsisVertical className="size-6" /> 
                                </button>
                            </div>
                            
                            <div className="mt-4 flex items-center gap-3 pb-4 xl:pb-0"> 
                                {/* 3. MOBILE SIDEBAR OPENER - ONLY SHOW ON MOBILE */}
                                {/* Replaced Ellipsis button with Search input on mobile to simplify */}
                                <div className="relative w-full">
                                    <form action="">
                                        <button className="absolute top-1/2 left-4 -translate-y-1/2">
                                            <Search className="size-4" />
                                        </button>
                                        <input type="text" className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-3.5 pl-[42px] text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" placeholder="Search..." />
                                    </form>
                                </div>
                            </div>
                        </div>
                        
                        {/* 4. CHAT LIST CONTAINER */}
                        {/* Removed redundant fixed positioning and background from the inner div. Let parent control the layout. */}
                        <div className="flex max-h-full flex-1 flex-col overflow-y-auto px-4 sm:px-5">
                            <div className="custom-scrollbar space-y-1 pb-4"> 
                                {/* MAPPED CHAT LIST ITEMS (added onClick to close sidebar on mobile) */}
                                {[18, 19, 12, 13, 14, 15, 16].map((i) => (
                                    <div key={i} onClick={handleChatSelect} className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-white/[0.03]">
                                        <div className="relative h-12 w-full max-w-[48px] rounded-full">
                                            <img src={`https://demo.tailadmin.com/src/images/user/user-${i}.jpg`} alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                            <span className="bg-success-500 absolute right-0 bottom-0 block h-3 w-3 rounded-full border-[1.5px] border-white dark:border-gray-900"></span>
                                        </div>
                                        <div className="w-full">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">User {i}</h5>
                                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Project Manager</p>
                                                </div>
                                                <span className="text-xs text-gray-400">15 mins</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* End of Mapped Chat List Items */}
                            </div>
                        </div>
                    </div>
                    
                    {/* CHAT BOX START */}
                    {/* Added conditional hidden class to hide chat box when sidebar is open on mobile */}
                    <div className={`
                        ${isSidebarOpen ? 'hidden' : 'flex'} 
                        h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white 
                        dark:border-gray-800 dark:bg-white/[0.03] 
                        xl:flex xl:w-3/4
                    `}>
                        {/* Call/Video Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800 xl:px-6">
                            <div className="flex items-center gap-3">
                                {/* Back button for mobile when chat box is shown */}
                                <button 
                                    onClick={toggleSidebar} 
                                    className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 xl:hidden"
                                >
                                    <ChevronRightIcon className="size-6 rotate-180" />
                                </button>
                                <div className="relative h-12 w-full max-w-[48px] rounded-full">
                                    <img src="https://demo.tailadmin.com/src/images/user/user-18.jpg" alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-[1.5px] border-white bg-success-500 dark:border-gray-900"></span>
                                </div>
                                <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">Van Khai</h5>
                            </div>
                            <div className="flex items-center gap-5">
                                <button className="text-gray-700 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                                    <Phone className="size-5" />
                                </button>
                                <button className="text-gray-700 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                                    <Video className="size-5" />
                                </button>
                                <button className="text-gray-700 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                                    <Ellipsis className="size-5" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Message Content Area */}
                        <div className="custom-scrollbar max-h-full flex-1 space-y-6 overflow-y-auto p-5 xl:space-y-8 xl:p-6">
                            {/* Message items here... (no changes needed) */}
                            {/* SENDEr */}
                            <div className="max-w-[350px]">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-full max-w-10 rounded-full">
                                        <img src="https://demo.tailadmin.com/src/images/user/user-18.jpg" alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                    </div>
                                    <div>
                                        <div className="rounded-lg rounded-tl-sm bg-gray-100 px-3 py-2 dark:bg-white/5">
                                            <p className="text-sm text-gray-800 dark:text-white/90">
                                                I want to make an appointment tomorrow from 2:00 to 5:00pm?
                                            </p>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            Lindsey, 2 hours ago
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* RECEIVER */}
                            <div className="ml-auto max-w-[350px] text-right">
                                <div className="ml-auto max-w-max rounded-lg rounded-tr-sm bg-blue-500 px-3 py-2 dark:bg-blue-500">
                                    <p className="text-sm text-white dark:text-white/90">
                                        If dont like something, I will stay away from it.
                                    </p>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    2 hours ago
                                </p>
                            </div>
                            {/* ... other messages ... */}
                             <div className="max-w-[350px]">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-full max-w-10 rounded-full">
                                        <img src="https://demo.tailadmin.com/src/images/user/user-19.jpg" alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                    </div>
                                    <div>
                                        <div className="rounded-lg rounded-tl-sm bg-gray-100 px-3 py-2 dark:bg-white/5">
                                            <p className="text-sm text-gray-800 dark:text-white/90">
                                                I am available tomorrow from 2:00 to 5:00pm?
                                            </p>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            3 hours ago
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="max-w-[350px]">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-full max-w-10 rounded-full">
                                        <img src="https://demo.tailadmin.com/src/images/user/user-20.jpg" alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                    </div>
                                    <div>
                                        <div className="rounded-lg rounded-tl-sm bg-gray-100 px-3 py-2 dark:bg-white/5">
                                            <p className="text-sm text-gray-800 dark:text-white/90">
                                                Let's schedule a quick call to discuss the project details.
                                            </p>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            1 hour ago
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="ml-auto max-w-[350px] text-right">
                                <div className="ml-auto max-w-max rounded-lg rounded-tr-sm bg-blue-500 px-3 py-2 dark:bg-blue-500">
                                    <p className="text-sm text-white dark:text-white/90">
                                        Sure, how about 3 PM today?
                                    </p>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    1 hour ago
                                </p>
                            </div>
                             <div className="max-w-[350px]">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-full max-w-10 rounded-full">
                                        <img src="https://demo.tailadmin.com/src/images/user/user-21.jpg" alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                    </div>
                                    <div>
                                        <div className="rounded-lg rounded-tl-sm bg-gray-100 px-3 py-2 dark:bg-white/5">
                                            <p className="text-sm text-gray-800 dark:text-white/90">
                                                Perfect! I'll send the invite shortly.
                                            </p>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            45 mins ago
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer (Message Input) */}
                        <div className="sticky bottom-0 border-t border-gray-200 p-3 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                                <div className="relative w-full">
                                    <button className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 sm:left-3">
                                        <Smile />
                                    </button>
                                    <input type="text" className="h-9 w-full border-none bg-transparent pl-12 pr-5 text-sm text-gray-800 outline-hidden placeholder:text-gray-400 focus:border-0 focus:ring-0 dark:text-white/90" placeholder="Type message..." />
                                </div>
                                <div className="flex items-center gap-4 xl:gap-5">
                                    <button className=" text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                                        <Paperclip />
                                    </button>
                                    <button className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                                        <Mic />
                                    </button>
                                    {/* Made Send button visible and gave it a better size/style */}
                                    <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600">
                                        <Send className="size-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Messages