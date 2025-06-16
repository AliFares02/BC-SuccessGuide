import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import AdminNavbar from "./components/AdminNavbar";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import useAuthContext from "./hooks/useAuthContext";
import AccountSettings from "./pages/AccountSettings";
import AdminAccountSettings from "./pages/AdminAccountSettings";
import AdminActivities from "./pages/AdminActivities";
import AdminCourses from "./pages/AdminCourses";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSignUpLogin from "./pages/AdminSignUpLogin";
import Courses from "./pages/Courses";
import Dashboard from "./pages/Dashboard";
import DegreeRoadMap from "./pages/DegreeRoadMap";
import ErrorPage from "./pages/ErrorPage";
import RequestResetPassword from "./pages/RequestResetPassword";
import ResetPassword from "./pages/ResetPassword";
import SignUpLogin from "./pages/SignUpLogin";
import UnAuthorizedErrorPage from "./pages/UnAuthorizedErrorPage";
import { useState } from "react";

function App() {
  const location = useLocation();
  const hideComponent =
    location.pathname === "/authenticate" ||
    location.pathname === "/admin-authenticate" ||
    location.pathname === "/request-reset-password" ||
    location.pathname === "/reset-password";
  const { user } = useAuthContext();

  const [bannerVisible, setBannerVisible] = useState(false);

  return (
    <div className={`app-container ${bannerVisible ? "banner-visible" : ""}`}>
      {!hideComponent &&
        (user?.role === "student" ? (
          <Navbar setBannerVisible={setBannerVisible} />
        ) : (
          user?.role === "admin" && <AdminNavbar />
        ))}
      <ScrollToTop />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="custom-toast"
        transition={Slide}
        theme="colored"
      />
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              user.role === "student" ? (
                <Dashboard />
              ) : user.role === "admin" ? (
                <Navigate to="/admin" />
              ) : (
                <UnAuthorizedErrorPage />
              )
            ) : (
              <Navigate to="/authenticate" />
            )
          }
        />
        <Route
          path="/courses"
          element={
            user ? (
              user.role === "student" ? (
                <Courses />
              ) : (
                <UnAuthorizedErrorPage />
              )
            ) : (
              <Navigate to="/authenticate" />
            )
          }
        />
        <Route
          path="/degree-roadmap"
          element={
            user ? (
              user.role === "student" ? (
                <DegreeRoadMap />
              ) : (
                <UnAuthorizedErrorPage />
              )
            ) : (
              <Navigate to="/authenticate" />
            )
          }
        />
        <Route
          path="/account"
          element={
            user ? (
              user.role === "student" ? (
                <AccountSettings />
              ) : (
                <UnAuthorizedErrorPage />
              )
            ) : (
              <Navigate to="/authenticate" />
            )
          }
        />
        <Route
          path="/authenticate"
          element={
            !user ? (
              <SignUpLogin />
            ) : user.role === "student" ? (
              <Navigate to="/" />
            ) : (
              <UnAuthorizedErrorPage />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user ? (
              user.role === "admin" ? (
                <AdminDashboard />
              ) : (
                <UnAuthorizedErrorPage />
              )
            ) : (
              <Navigate to="/authenticate" />
            )
          }
        />
        <Route
          path="/admin-courses"
          element={
            user ? (
              user.role === "admin" ? (
                <AdminCourses />
              ) : (
                <UnAuthorizedErrorPage />
              )
            ) : (
              <Navigate to="/authenticate" />
            )
          }
        />
        <Route
          path="/admin-activities"
          element={
            user ? (
              user.role === "admin" ? (
                <AdminActivities />
              ) : (
                <UnAuthorizedErrorPage />
              )
            ) : (
              <Navigate to="/authenticate" />
            )
          }
        />
        <Route
          path="/admin-account"
          element={
            user ? (
              user.role === "admin" ? (
                <AdminAccountSettings />
              ) : (
                <UnAuthorizedErrorPage />
              )
            ) : (
              <Navigate to="/authenticate" />
            )
          }
        />
        <Route path="/admin-authenticate" element={<AdminSignUpLogin />} />
        <Route
          path="/request-reset-password"
          element={
            !user ? (
              <RequestResetPassword />
            ) : user.role === "admin" ? (
              <Navigate to="/admin-activities" />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
      {!hideComponent && user?.role !== "admin" ? <Footer /> : null}
    </div>
  );
}

export default App;
