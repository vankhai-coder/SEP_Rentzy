import { ChevronRightIcon, Ellipsis, EllipsisVertical, Mic, Paperclip, Phone, Search, Send, Smile, Video } from "lucide-react"
import { Link } from "react-router-dom"

const Messages = () => {
    return (
        <div className="mx-auto max-w-(--breakpoint-2xl) p-4 pb-20 md:p-6 md:pb-6 dark:bg-[#101828]">
            {/* Breastcrumb start */}
            <div>
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
            </div>
            {/* Breastcrumb end */}
            <div className="h-[calc(100vh-186px)] overflow-hidden sm:h-[calc(100vh-174px)]">
                <div className="flex h-full flex-col gap-6 xl:flex-row xl:gap-5">
                    {/* chat side bar start */}
                    <div className="flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white xl:flex xl:w-1/4 dark:border-gray-800 dark:bg-white/[0.03]">
                        {/* chat list start  */}
                        <div className="sticky px-4 pt-4 pb-4 sm:px-5 sm:pt-5 xl:pb-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-theme-xl font-semibold text-gray-800 sm:text-2xl dark:text-white/90">Messages</h3>
                                </div>
                                <div className="relative">
                                    <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                                        <EllipsisVertical />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-3 pb-14 xl:pb-0">
                                <button className="flex h-11 w-full max-w-11 items-center justify-center rounded-lg border border-gray-300 text-gray-700 xl:hidden dark:border-gray-700 dark:text-gray-400">
                                    <Ellipsis />
                                </button>
                                <div className="relative my-2 w-full">
                                    <form action="">
                                        <button className="absolute top-1/2 left-4 -translate-y-1/2">
                                            <Search className="size-4" />
                                        </button>
                                        <input type="text" className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-3.5 pl-[42px] text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" placeholder="Search..." />
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className="no-scrollbar flex-col overflow-auto flex fixed xl:static top-0 left-0 z-999999 h-screen bg-white dark:bg-gray-900">

                            <div className="flex items-center justify-between border-b border-gray-200 p-5 xl:hidden dark:border-gray-800">
                                <div>
                                    <h3 className="text-theme-xl font-semibold text-gray-800 sm:text-2xl dark:text-white/90">Messages</h3>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="relative -mb-1.5">
                                        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex max-h-full flex-col overflow-auto px-4 sm:px-5">
                                <div className="custom-scrollbar max-h-full space-y-1 overflow-auto">
                                    {/* chat list item */}

                                    {/* first person */}
                                    <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-white/[0.03]">
                                        {/* avatar a */}
                                        <div className="relative h-12 w-full max-w-[48px] rounded-full">
                                            <img src="https://demo.tailadmin.com/src/images/user/user-18.jpg" alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                            {/* green dot for active account */}
                                            <span className="bg-success-500 absolute right-0 bottom-0 block h-3 w-3 rounded-full border-[1.5px] border-white dark:border-gray-900">
                                            </span>
                                        </div>
                                        {/* name and one last message */}
                                        <div className="w-full">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">Van Khai</h5>
                                                    <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">Project Manager</p>
                                                </div>
                                                <span className="text-xs text-gray-400">15 mins</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* first person */}
                                    <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-white/[0.03]">
                                        {/* avatar a */}
                                        <div className="relative h-12 w-full max-w-[48px] rounded-full">
                                            <img src="https://demo.tailadmin.com/src/images/user/user-18.jpg" alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                            {/* green dot for active account */}
                                            <span className="bg-success-500 absolute right-0 bottom-0 block h-3 w-3 rounded-full border-[1.5px] border-white dark:border-gray-900">
                                            </span>
                                        </div>
                                        {/* name and one last message */}
                                        <div className="w-full">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">Van Khai</h5>
                                                    <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">Project Manager</p>
                                                </div>
                                                <span className="text-xs text-gray-400">15 mins</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* first person */}
                                    <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-white/[0.03]">
                                        {/* avatar a */}
                                        <div className="relative h-12 w-full max-w-[48px] rounded-full">
                                            <img src="https://demo.tailadmin.com/src/images/user/user-18.jpg" alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                            {/* green dot for active account */}
                                            <span className="bg-success-500 absolute right-0 bottom-0 block h-3 w-3 rounded-full border-[1.5px] border-white dark:border-gray-900">
                                            </span>
                                        </div>
                                        {/* name and one last message */}
                                        <div className="w-full">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">Van Khai</h5>
                                                    <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">Project Manager</p>
                                                </div>
                                                <span className="text-xs text-gray-400">15 mins</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* chat box start */}

                    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:w-3/4">
                        {/* call video */}
                        <div className="sticky flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800 xl:px-6">
                            <div className="flex items-center gap-3">
                                <div className="relative h-12 w-full max-w-[48px] rounded-full">
                                    <img src="https://demo.tailadmin.com/src/images/user/user-18.jpg" alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-[1.5px] border-white bg-success-500 dark:border-gray-900"></span>
                                </div>
                                <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Van Khai</h5>
                            </div>
                            <div className="flex items-center gap-5">
                                <button className="text-gray-700 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                                    <Phone className="size-5" />
                                </button>
                                <button className="text-gray-700 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                                    <Video />
                                </button>
                                <button className="text-gray-700 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                                    <Ellipsis />
                                </button>
                            </div>
                        </div>
                        {/* message from 2 people */}
                        <div className="custom-scrollbar max-h-full flex-1 space-y-6 overflow-auto p-5 xl:space-y-8 xl:p-6">
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
                        </div>
                        {/* footer : that have text : "type message..." */}
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
                                    <button className="flex items-center justify-center rounded-lg bg-brand-500 text-green-500 hover:bg-brand-600">
                                        <Send />
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