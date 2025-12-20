import { useEffect, useRef, useState } from "react" // <-- Import useState
import { ChevronRightIcon, Ellipsis, EllipsisVertical, Loader, Mic, Paperclip, Phone, Search, Send, Smile, Video } from "lucide-react"
import { Link } from "react-router-dom"
import axiosInstance from "@/config/axiosInstance"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow, formatDistanceToNowStrict, set } from "date-fns"
import { toast } from "sonner"
import { useSelector } from "react-redux"

const Messages = () => {

    // redux : 
    const { userFullNameOrEmail, userIdToChatWith, userImageURL } = useSelector((state) => state.message);
    // define query client: 
    const queryClient = useQueryClient();

    // 0. state for partnerId to chat with
    const [partnerId, setPartnerId] = useState(userIdToChatWith);
    const [partnerAvatarUrl, setPartnerAvatarUrl] = useState(userImageURL);
    const [partnerFullName, setPartnerFullName] = useState(userFullNameOrEmail);

    // 1. State to manage sidebar visibility on mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Helper function to toggle the sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    // function to get all chat messages for current user useing axiosInstance and react tank query : 
    const fetchAllChatMessagesForUser = async () => {
        const response = await axiosInstance.get(`/api/admin/messages`);
        return response.data;
        // [
        //   {
        //     "partner_id": 4,
        //     "latestContent": "Awesome, see you!",
        //     "created_at": "2025-12-19T04:50:18.000Z",
        //     "full_name": "Nguyen Thi Owner4",
        //     "email": "owner4@example.com",
        //     "avatar_url": null
        //   },
        // ]
    }
    const { data: chatMessages, isLoading: isLoadingChatMessages, isError: isErrorChatMessages } = useQuery(

        {
            queryKey: ['chat-messages-for-user'],
            queryFn: fetchAllChatMessagesForUser
        }
    );

    // function to get full conversation with partnerId when selected :
    const fetchConversationWithPartner = async (partnerId) => {
        const response = await axiosInstance.get(`/api/admin/messages/conversation/${partnerId}`);
        return response.data;
        // [
        //   {
        //     "ownContent": "Hey, how are you?",
        //     "partnerContent": null,
        //     "created_at": "2025-12-19T04:33:00.000Z"
        //   },
        //   {
        //     "ownContent": null,
        //     "partnerContent": "I am good, thanks! How about you?",
        //     "created_at": "2025-12-19T04:34:00.000Z"
        //   },
        // ]
    }
    const { data: conversationWithPartner, isLoading: isLoadingConversationWithPartner, isError: isErrorConversationWithPartner } = useQuery(
        {
            queryKey: ['conversation-with-partner', partnerId],
            queryFn: () => fetchConversationWithPartner(partnerId),
            enabled: !!partnerId, // only run this query if partnerId is set
        }
    );

    // New: Handle opening a chat item (and close sidebar on mobile)
    const handleChatSelect = ({ partnerId, partnerAvatarUrl, partnerFullName }) => {
        setPartnerId(partnerId);
        setPartnerAvatarUrl(partnerAvatarUrl);
        setPartnerFullName(partnerFullName);
        // For responsiveness, close the sidebar when a chat is selected on mobile
        if (window.innerWidth < 1280) { // 1280px is Tailwind's 'xl' breakpoint
            setIsSidebarOpen(false)
        }
    }

    // state for message to send :
    const [sendMessage, setSendMessage] = useState("");
    const [isLoadingSendMessage, setIsLoadingSendMessage] = useState(false);

    // send message to partnerId using axiosInstance and mutation : 
    const mutation = useMutation({
        mutationFn: async () => {
            return axiosInstance.post(`/api/admin/messages/send`, {
                partnerId: partnerId,
                content: sendMessage
            });
        },
        onMutate: async () => {

            queryClient.setQueryData(['conversation-with-partner'])

            // Update sidebar preview
            queryClient.setQueryData(['chat-messages-for-user'])

            // setSendMessage("");
        },
        onError: (error) => {
            console.error("Error sending message:", error);
            toast.error("Failed to send message.");
            // Optionally rollback if needed
        },
        onSettled: () => {
            // Optional: refetch to sync if needed (but usually not necessary)
            queryClient.invalidateQueries(['conversation-with-partner', partnerId]);
            queryClient.invalidateQueries(['chat-messages-for-user']);
            setIsLoadingSendMessage(false);
            setSendMessage("");
        },
    });

    // wrapper function for sending
    const sendNewMessage = () => {
        console.log("Sending message to partnerId:", partnerId, "with message:", sendMessage);
        if (!partnerId) return;
        if (!sendMessage || sendMessage.trim() === "") {
            toast.error("Message content cannot be empty.");
            return;
        }
        setIsLoadingSendMessage(true);

        mutation.mutate();
    };

    // Helper function to format time ago
    const TimeAgo = (date) => formatDistanceToNowStrict(
        new Date(date),
        { addSuffix: true }
    );
    const scrollRef = useRef(null);

    // Auto scroll to bottom whenever messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
            // Or simple:
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [conversationWithPartner]);


    // 
    // Connect to your WS server
    function connectWebSocket() {
        const base = import.meta.env.VITE_API_URL || "";
        if (!base) return;

        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${protocol}://${window.location.host}/ws`;

        console.log("Connecting to WS URL:", wsUrl);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Connected to WebSocket server");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Received WS message:", data);
                // handle incoming messages...
                if (data.type === "NEW_MESSAGE") {
                    queryClient.invalidateQueries(['conversation-with-partner', partnerId]);
                    queryClient.invalidateQueries(['chat-messages-for-user']);
                }
            } catch (err) {
                console.error("Failed to parse WS message:", err);
            }
        };

        ws.onerror = (error) => console.error("WebSocket error:", error);

        ws.onclose = (event) => {
            console.log("WebSocket closed:", event.code, event.reason);
            if (event.code === 1006) {
                // abnormal closure → reconnect after 3s
                setTimeout(connectWebSocket, 3000);
            }
        };

        return ws; // return the socket if you want to store it in state/ref
    }

    // Connect to WebSocket ONCE, on component mount
    useEffect(() => {
        const ws = connectWebSocket();

        return () => {
            ws && ws.close(); // cleanup when component unmounts
        };
    }, []);


    return (
        <div className="mx-auto max-w-[1440px] p-4 md:p-6 dark:bg-[#101828]">
            {/* Removed fragile height calculation. Let content fill space. */}
            <div className="h-full">

                {/* Main Content Area */}
                <div className="relative flex h-[calc(100vh-140px)] flex-col gap-6 xl:flex-row xl:gap-5">

                    {/* 1. CHAT SIDE BAR (Messages List) START */}
                    {/* Added conditional classes for mobile/desktop view and a max-w to prevent overflow on very small screens */}
                    <div className={`
                        ${isSidebarOpen ? 'flex' : 'hidden'} 
                        absolute inset-0 
                        h-full w-full 
                        flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white 
                        xl:relative xl:flex xl:w-1/4 xl:min-w-[300px] xl:max-w-none 
                        dark:border-gray-800 dark:bg-white/[0.03]
                    `}>
                        <div className="sticky px-4 pt-4 pb-4 sm:px-5 sm:pt-5 xl:pb-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 sm:text-2xl dark:text-white/90">Nhắn tin</h3>
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
                                {chatMessages?.map((message, i) => (
                                    <div key={i} onClick={() => handleChatSelect({ partnerId: message.partner_id, partnerAvatarUrl: message.avatar_url, partnerFullName: message.full_name || message.email })}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-white/[0.03]">
                                        <div className="relative h-12 w-full max-w-[48px] rounded-full ">
                                            <img src={message.avatar_url || '/default_avt.jpg'} alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                            {/* <span className="bg-success-500 absolute right-0 bottom-0 block h-3 w-3 rounded-full border-[1.5px] border-white dark:border-gray-900"></span> */}
                                        </div>
                                        <div className="max-w-1/2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-800 dark:text-white/90 ">{message.full_name || message.email}</h5>
                                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">{message.latestContent}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {chatMessages?.length === 0 && !isLoadingChatMessages && (
                                    <p className="mt-4 text-center text-gray-500 dark:text-gray-400">Bạn chưa có tin nhắn nào.</p>
                                )}
                                {
                                    isLoadingChatMessages && <div className="flex items-center justify-center"><Loader className="h-6 w-6 animate-spin" /></div>
                                }
                                {
                                    isErrorChatMessages && <p>Lỗi khi tải tin nhắn.</p>
                                }
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
                                    {partnerId &&
                                        <img src={partnerAvatarUrl || "/default_avt.jpg"} alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                    }
                                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-[1.5px] border-white bg-success-500 dark:border-gray-900"></span>
                                </div>
                                <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">{partnerFullName || 'Chọn người để trò chuyện'}</h5>
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

                        {/* Message Content Area  */}
                        <div ref={scrollRef} className="custom-scrollbar max-h-full flex-1 space-y-6 overflow-y-auto p-5 xl:space-y-8 xl:p-6">
                            {/* loading  */}
                            {isLoadingConversationWithPartner && <div className="flex items-center justify-center"><Loader className="h-6 w-6 animate-spin" /></div>}
                            {isErrorConversationWithPartner && <p>Lỗi khi tải cuộc trò chuyện.</p>}
                            {/* Mapped conversation messages */}
                            {conversationWithPartner?.map((msg, i) => (
                                <div key={i} className="flex gap-4">
                                    {/* Partner : */
                                        msg.partnerContent && (
                                            <div className="max-w-[350px]">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-10 w-full max-w-10 rounded-full">
                                                        <img src={partnerAvatarUrl || "/default_avt.jpg"} alt="" className="h-full w-full overflow-hidden rounded-full object-cover object-center" />
                                                    </div>
                                                    <div>
                                                        <div className="rounded-lg rounded-tl-sm bg-gray-100 px-3 py-2 dark:bg-white/5">
                                                            <p className="text-sm text-gray-800 dark:text-white/90">
                                                                {msg.partnerContent}
                                                            </p>
                                                        </div>
                                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                            {TimeAgo(msg.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    {/* Me */}
                                    {msg.ownContent && (
                                        <div className="ml-auto max-w-[350px] text-right">
                                            <div className="ml-auto max-w-max rounded-lg rounded-tr-sm bg-blue-500 px-3 py-2 dark:bg-blue-500">
                                                <p className="text-sm text-white dark:text-white/90">
                                                    {msg.ownContent}
                                                </p>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                {TimeAgo(msg.created_at)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}

                        </div>
                        {/* Footer (Message Input) */}
                        <div className="sticky bottom-0 border-t border-gray-200 p-3 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                                <div className="relative w-full">
                                    <button className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 sm:left-3">
                                        <Smile />
                                    </button>
                                    <input
                                        type="text"
                                        className="h-9 w-full border-none bg-transparent pl-12 pr-5 text-sm
                                     text-gray-800 outline-hidden placeholder:text-gray-400 focus:border-0 
                                     focus:ring-0 dark:text-white/90" placeholder="Nhập tin nhắn..."
                                        value={sendMessage}
                                        onChange={(e) => {
                                            setSendMessage(e.target.value)
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendNewMessage();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-4 xl:gap-5">
                                    <button className=" text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                                        <Paperclip />
                                    </button>
                                    <button className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                                        <Mic />
                                    </button>
                                    {/* Made Send button visible and gave it a better size/style */}
                                    <button
                                        disabled={mutation.isPending || !partnerId || sendMessage.trim() === ""}
                                        onClick={() => {
                                            if (sendMessage.trim()) {
                                                mutation.mutate({
                                                    partnerId,
                                                    content: sendMessage.trim(),
                                                });
                                            }
                                        }}
                                        className={`flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 ${!sendMessage.trim() || !partnerId ? 'cursor-not-allowed opacity-50' : ''
                                            }`}
                                    >
                                        {mutation.isPending ? (
                                            <Loader className="h-5 w-5 animate-spin text-white" />
                                        ) : (
                                            <Send className="size-5 text-white" />
                                        )}
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