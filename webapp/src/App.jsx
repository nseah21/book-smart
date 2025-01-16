import "./App.css";

import Signup from "./Signup";
import Login from "./Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Calendar from "./Calendar";
import ProtectedRoute from "./components/ProtectedRoute";
import Summary from "./Summary";

function App() {
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
          <Route
            path="/summary"
            element={
              <ProtectedRoute>
                <Summary />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
