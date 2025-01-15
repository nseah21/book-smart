import React from "react";
import Link from "next/link";

const NavBar = () => {
  return (
    <div className="bg-blue-700 flex justify-between items-center h-20 w-full mx-auto px-6 text-white">
      <div>
        <Link href="/calendar" className="font-bold text-2xl">BookSmart</Link>
      </div>
      <div className="text-[18px]">
        <span className="mx-4 hover:text-gray-300">
          <Link href="/calendar">Calendar</Link>
        </span>
        <span className="mx-4 hover:text-gray-300">
          <Link href="/summary">Summarise Email</Link>
        </span>
      </div>
    </div>
  );
};

export default NavBar;
