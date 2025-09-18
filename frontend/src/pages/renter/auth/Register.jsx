import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    // Handle Register logic here
    console.log('Phone Number:', phoneNumber);
    console.log('Password:', password);
  };

  return (
    <div className="flex items-center justify-center bg-gay-100">
      <div className="w-full max-w-sm p-8 bg-white">
        <h2 className="mb-6 text-2xl font-bold text-center">Đăng Ký</h2>

        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder=""
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder=""
                required
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-gray-400 cursor-pointer"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Nhập lại mật khẩu
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder=""
                required
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-gray-400 cursor-pointer"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 mb-4 font-bold text-white transition duration-200 bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Đăng ký
          </button>
        </form>

        <p className="mb-4 text-center text-gray-600">
          Đã có tài khoàn?{' '}
          <span className="font-medium text-green-500 hover:text-green-600">
            Đăng nhập ngay
          </span>
        </p>

        <div className="flex space-x-4">

          <button
            className="flex items-center justify-center w-full px-4 py-2 text-gray-700 transition duration-200 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={() => {
              window.open(
                `${import.meta.env.VITE_API_URL}/api/auth/google`,
                "_blank"
              );
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.72 0 5.17-.98 7.08-2.58l-1.9-1.9a7.9 7.9 0 01-5.18 1.98c-4.42 0-8-3.58-8-8s3.58-8 8-8c3.27 0 6.1 1.95 7.42 4.77l-2.92 2.92-1.5-1.5c-.83-.83-2.18-.83-3.01 0l-5.61 5.61c-.83.83-.83 2.18 0 3.01l1.5 1.5c.83.83 2.18.83 3.01 0l5.61-5.61c.83-.83.83-2.18 0-3.01l-1.5-1.5-2.92-2.92c1.94-1.32 4.1-2.07 6.48-2.07 3.31 0 6.2 1.63 7.98 4.19l2.25-2.25C22.63 4.31 17.68 2 12 2z" />
            </svg>
            Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;