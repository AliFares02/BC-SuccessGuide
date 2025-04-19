import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthContextProvider>
      <Router>
        <App />
      </Router>
    </AuthContextProvider>
  </StrictMode>
);
