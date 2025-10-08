const TypingDots = () => {
  return (
    <div className="flex space-x-1 items-center">
      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
    </div>
  );
};

export default TypingDots;