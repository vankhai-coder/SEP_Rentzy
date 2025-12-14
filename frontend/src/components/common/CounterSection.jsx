import Counter from "./Counter";

export default function CounterSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header: Chỉ tiêu đề, gọn gàng */}
      <div className="max-w-6xl mx-auto px-4 text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
          Thành Tựu Của Chúng Tôi
        </h2>
      </div>

      {/* Grid Counters: Nhỏ gọn hơn */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {/* Card 1: Xe hiện có */}
          <div className="group bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-102 border border-blue-50">
            <div className="text-center">
              <div className="mb-3">
                <svg
                  className="w-8 h-8 mx-auto text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <Counter
                to={30}
                className="block text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-1"
                duration={2500}
                loopDelay={5000} // [SỬA: 5s loop]
              />
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Xe Hiện Có
              </p>
            </div>
          </div>

          {/* Card 2: Khách hàng */}
          <div className="group bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-102 border border-blue-50">
            <div className="text-center">
              <div className="mb-3">
                <svg
                  className="w-8 h-8 mx-auto text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <Counter
                to={20}
                className="block text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent mb-1"
                duration={2500}
                loopDelay={5000} // [SỬA: 5s loop]
              />
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Khách Hàng
              </p>
            </div>
          </div>

          {/* Card 3: Lượt thuê / tháng */}
          <div className="group bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-102 border border-blue-50">
            <div className="text-center">
              <div className="mb-3">
                <svg
                  className="w-8 h-8 mx-auto text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <Counter
                to={8}
                className="block text-2xl md:text-4xl font-bold bg-gradient-to-r from-green-500 to-teal-600 bg-clip-text text-transparent mb-1"
                duration={2500}
                loopDelay={5000} // [SỬA: 5s loop]
              />
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Lượt Thuê / Tháng
              </p>
            </div>
          </div>

          {/* Card 4: Khách hài lòng (%) */}
          <div className="group bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-102 border border-blue-50">
            <div className="text-center">
              <div className="mb-3">
                <svg
                  className="w-8 h-8 mx-auto text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <Counter
                to={25}
                className="block text-2xl md:text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent mb-1"
                duration={2500}
                loopDelay={5000} // [SỬA: 5s loop]
              />
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Khách Hài Lòng (%)
              </p>
            </div>
          </div>

          {/* Card 5: Đối tác */}
          <div className="group bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-102 border border-blue-50">
            <div className="text-center">
              <div className="mb-3">
                <svg
                  className="w-8 h-8 mx-auto text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <Counter
                to={20}
                className="block text-2xl md:text-4xl font-bold bg-gradient-to-r from-indigo-500 to-blue-600 bg-clip-text text-transparent mb-1"
                duration={2500}
                loopDelay={5000} // [SỬA: 5s loop]
              />
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Đối Tác
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
