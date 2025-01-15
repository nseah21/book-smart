"use client";

import Signup from "./Signup";
import Login from "./Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Calendar from "./calendar/page";
import ProtectedRoute from "./components/ProtectedRoute";

export default function Home() {
  return (
    <>
      <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
    </>
  );
}
