"use client";

import React from "react";

interface LoginButtonProps {
  className?: string;
}

export function LoginButton({ className = "" }: LoginButtonProps) {
  const handleLogin = () => {
    window.location.href = "/api/spotify/login";
  };

  return (
    <button
      onClick={handleLogin}
      className={`inline-flex h-12 items-center justify-center rounded-full bg-[#1DB954] hover:bg-[#1ed760] px-6 text-sm font-semibold text-white shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:ring-offset-2 ${className}`}
      data-testid="spotify-login-button"
      type="button"
    >
      <svg
        className="mr-2 h-5 w-5 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 0C5.373 0 0 5.372 0 12c0 6.627 5.373 12 12 12 6.628 0 12-5.373 12-12 0-6.628-5.372-12-12-12zm5.49 17.31c-.22.36-.685.474-1.045.255-2.887-1.764-6.523-2.164-10.803-1.185-.41.093-.82-.164-.913-.574-.093-.41.164-.82.574-.913 4.685-1.07 8.7-1.6 11.93.376.36.22.474.685.257 1.04zm1.464-3.26c-.276.448-.86.593-1.308.317-3.3-2.03-8.334-2.616-12.237-1.43-.502.152-1.03-.135-1.18-.637-.15-.503.136-1.03.638-1.18 4.463-1.354 10.012-.703 13.77 1.613.447.276.592.86.317 1.307zm.126-3.414C15.24 8.243 8.874 8.03 5.188 9.148c-.564.17-1.16-.147-1.332-.71-.172-.564.148-1.16.71-1.333 4.237-1.287 11.272-1.04 15.684 1.578.508.3.674.96.372 1.468-.3.507-.96.673-1.467.37z" />
      </svg>
      Spotify로 연결하기
    </button>
  );
}
