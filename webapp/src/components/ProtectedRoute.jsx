import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const sessionToken = localStorage.getItem("session_token");

  if (!sessionToken) {
    // If no session token, redirect to the login page
    return <Navigate to="/login" />;
  }

  // If authenticated, render the protected content
  return children;
};

export default ProtectedRoute;
