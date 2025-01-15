import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NavBar = () => {
  return (
    <div className="bg-blue-700 flex justify-between items-center h-20 w-full mx-auto px-6 text-white">
      <div>
        <Link href="/" className="font-bold text-2xl">
          BookSmart
        </Link>
      </div>
      <div className="text-[18px]">
        <span className="mx-4 hover:text-gray-300">
          <Link href="/">Calendar</Link>
        </span>
        <span className="mx-4 hover:text-gray-300">
          <Link href="/summary">Summarise Email</Link>
        </span>
        <span className="ml-12 mx-4 hover:text-gray-300">
          <Link
            href="/"
            onClick={() => {
              localStorage.removeItem("session_token");
              localStorage.removeItem("email");
              useNavigate()("/");
            }}
          >
            Log out
          </Link>
        </span>
      </div>
    </div>
  );
};

export default NavBar;
