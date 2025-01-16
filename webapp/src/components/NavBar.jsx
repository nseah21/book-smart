import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const NavBar = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-blue-700 flex justify-between items-center h-20 w-full mx-auto px-6 text-white">
      <div>
        <Link to="/" className="font-bold text-2xl">
          BookSmart
        </Link>
      </div>
      <div className="text-[18px]">
        <span className="mx-4 hover:text-gray-300">
          <Link to="/">Calendar</Link>
        </span>
        <span className="mx-4 hover:text-gray-300">
          <Link to="/summary">Summarise Email</Link>
        </span>
        <span className="ml-12 mx-4 hover:text-gray-300">
          <Link
            to="/"
            onClick={() => {
              localStorage.removeItem("session_token");
              localStorage.removeItem("email");
              navigate("/");
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
