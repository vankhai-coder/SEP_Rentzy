import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  sendMessage,
  addUserMessage,
} from "@/redux/features/chat/chatOpenAiSlice";
import { X, Send } from "lucide-react";
import logo from "@/assets/images/logoChat.png";
import TypingDots from "./TypingDots";

// chỉ hiển thị giờ:phút
const formatTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

const ChatBox = () => {
  const dispatch = useDispatch();
  const { messages } = useSelector((state) => state.chat);

  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      dispatch(addUserMessage(input)); // hiển thị ngay user + bot "..."
      dispatch(sendMessage(input));
      setInput("");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Nút mở chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full p-3 shadow-xl hover:scale-110 transition"
        >
          <img src={logo} alt="Chat Logo" className="w-8 h-8 rounded-full" />
        </button>
      )}

      {/* Chatbox */}
      {isOpen && (
        <div className="w-80 h-96 bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3">
            <div className="flex items-center">
              <img
                src={logo}
                alt="Bot Logo"
                className="w-6 h-6 rounded-full mr-2"
              />
              <span className="font-semibold">Trợ lý ảo</span>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Nội dung chat */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm bg-gray-50">
            {messages.length === 0 && (
              <p className="text-gray-400 text-center">
                Hãy nhập tin nhắn để bắt đầu
              </p>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "bot" && (
                  <img
                    src={logo}
                    alt="Bot Avatar"
                    className="w-7 h-7 rounded-full mr-2 self-end"
                  />
                )}
                <div
                  className={`p-2.5 rounded-2xl max-w-[70%] shadow ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                      : "bg-purple-100 text-gray-800"
                  }`}
                >
                  {msg.text === "..." ? <TypingDots /> : <p>{msg.text}</p>}
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {formatTime()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center border-t p-2 bg-white"
          >
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="ml-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full p-2 shadow hover:scale-105 transition"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
