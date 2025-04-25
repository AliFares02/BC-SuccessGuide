import "./App.css";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import useAuthContext from "./hooks/useAuthContext";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Footer from "./components/Footer";
import Courses from "./pages/Courses";
import SignUpLogin from "./pages/SignUpLogin";

function App() {
  const location = useLocation();
  const hideComponent = location.pathname === "/authenticate";
  const { user } = useAuthContext();
  return (
    <div className="app-container">
      {!hideComponent && <Navbar />}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/authenticate" element={<SignUpLogin />} />
      </Routes>
      {!hideComponent && <Footer />}
    </div>
  );
}

export default App;
