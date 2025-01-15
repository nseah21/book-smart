import React from "react";
import NavBar from "./NavBar";

const Wrapper = ({ children }) => {
  return (
    <>
      <NavBar />
      <div className="p-8 bg-gray-200 min-h-screen">{children}</div>
    </>
  );
};

export default Wrapper;
