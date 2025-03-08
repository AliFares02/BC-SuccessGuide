import "./App.css";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
