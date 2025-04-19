import "./App.css";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Footer from "./components/Footer";
import Courses from "./pages/Courses";
import SignUpLogin from "./pages/SignUpLogin";

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/authenticate" element={<SignUpLogin />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
