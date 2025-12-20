import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  sendMessage,
  addUserMessage,
} from "@/redux/features/chat/chatOpenAiSlice";
import { X, Send, ExternalLink, MessageCircle, Minimize2 } from "lucide-react";
import logo from "/logoChat.png";
import TypingDots from "./TypingDots";

const formatTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

const ChatBox = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { messages } = useSelector((state) => state.chat);

  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      dispatch(addUserMessage(input));
      dispatch(sendMessage(input));
      setInput("");
    }
  };

  const handleViewVehicle = (vehicleId) => {
    navigate(`/detail/${vehicleId}`);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Nút mở chat - Animated */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative bg-purple-600 text-white rounded-full p-4 shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300 animate-bounce"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
              Tư vấn thuê xe
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </button>
      )}

      {/* Chatbox - Modern Design */}
      {isOpen && (
        <div
          className={`bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden border border-gray-200 backdrop-blur-xl transition-all duration-300 ${
            isMinimized ? "w-80 h-16" : "w-[380px] h-[520px]"
          }`}
        >
          {/* Header - Đơn sắc */}
          <div className="relative bg-purple-600 text-white p-4 shadow-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={logo}
                    alt="Rentzy Bot"
                    className="w-10 h-10 rounded-full border-2 border-white/30 shadow-lg"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-purple-600"></span>
                </div>
                <div>
                  <h3 className="font-bold text-base">Trợ lý Rentzy</h3>
                  <p className="text-xs text-purple-100">
                    Luôn sẵn sàng hỗ trợ bạn
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <Minimize2 size={18} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area - Modern Scroll */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center mt-8 space-y-4">
                    <div className="inline-block p-4 bg-purple-100 rounded-2xl">
                      <MessageCircle className="w-12 h-12 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-gray-800 font-semibold text-lg mb-2">
                        Chào mừng đến với Rentzy!
                      </h4>
                      <p className="text-gray-500 text-sm max-w-xs mx-auto">
                        Hãy nhập tin nhắn để bắt đầu tư vấn thuê xe. Chúng tôi
                        sẵn sàng giúp bạn!
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-end space-x-2 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } animate-fade-in`}
                  >
                    {msg.role === "bot" && (
                      <img
                        src={logo}
                        alt="Bot"
                        className="w-8 h-8 rounded-full border-2 border-purple-200 shadow-sm flex-shrink-0"
                      />
                    )}

                    <div
                      className={`max-w-[75%] rounded-2xl shadow-md transition-all hover:shadow-lg ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                      }`}
                    >
                      <div className="px-4 py-3">
                        {msg.text === "..." ? (
                          <TypingDots />
                        ) : (
                          <>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.text}
                            </p>

                            {/* Vehicle Cards - Premium Design */}
                            {msg.vehicles && msg.vehicles.length > 0 && (
                              <div className="mt-4 space-y-2">
                                <p className="text-xs text-gray-500 font-medium mb-2">
                                  Xe phù hợp với bạn:
                                </p>
                                {msg.vehicles.map((vehicle) => (
                                  <button
                                    key={vehicle.vehicle_id}
                                    onClick={() =>
                                      handleViewVehicle(vehicle.vehicle_id)
                                    }
                                    className="group w-full bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl p-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="text-left flex-1">
                                        <p className="font-semibold text-gray-800 text-sm group-hover:text-purple-700 transition-colors">
                                          {vehicle.brand} {vehicle.model}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {vehicle.year} •{" "}
                                          {vehicle.price_per_day.toLocaleString(
                                            "vi-VN"
                                          )}
                                          đ/ngày
                                        </p>
                                      </div>
                                      <div className="ml-3 bg-white rounded-full p-2 group-hover:bg-purple-600 transition-colors">
                                        <ExternalLink
                                          size={14}
                                          className="text-purple-600 group-hover:text-white"
                                        />
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div
                        className={`px-4 pb-2 text-[10px] ${
                          msg.role === "user"
                            ? "text-blue-100"
                            : "text-gray-400"
                        }`}
                      >
                        {formatTime()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area - Modern Style */}
              <div className="border-t border-gray-100 bg-white p-4">
                <form
                  onSubmit={handleSend}
                  className="flex items-end space-x-3"
                >
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                      placeholder="Nhập tin nhắn của bạn..."
                      className="w-full resize-none border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                      rows="1"
                      style={{ maxHeight: "100px" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-purple-600 text-white rounded-2xl p-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatBox;
