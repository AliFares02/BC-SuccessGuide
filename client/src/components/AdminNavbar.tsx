import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useLogout from "../hooks/useLogout";

function AdminNavbar() {
  const [burgerClicked, setBurgerClicked] = useState(false);
  const { logout } = useLogout();

  const location = useLocation();
  const [clickedPage, setClickedPage] = useState(() => {
    const path = location.pathname;
    if (path.startsWith("/admin-courses")) return "admin-courses";
    if (path.startsWith("/admin-activities")) return "admin-activities";
    if (path.startsWith("/admin-account")) return "admin-account";
    return "admin";
  });

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/admin-courses")) setClickedPage("admin-courses");
    else if (path.startsWith("/admin-activities"))
      setClickedPage("admin-activities");
    else if (path.startsWith("/admin-account")) setClickedPage("admin-account");
    else setClickedPage("admin");
  }, [location.pathname]);

  function handleLogout() {
    setBurgerClicked(!burgerClicked);
    logout();
  }
  return (
    <div className="navbar-noti-wrapper">
      <nav className="navbar">
        <h1 className="logo">
          <Link
            className="logo"
            to="/admin"
            onClick={() => setClickedPage("dashboard")}
          >
            <span className="logo-full">BC SuccessGuide</span>
            <span className="logo-short">BCSG</span>
          </Link>
          <span
            style={{ fontWeight: "300", cursor: "default", userSelect: "none" }}
          >
            Admin
          </span>
        </h1>

        <div
          className={`burger-menu ${burgerClicked ? "is-active" : ""}`}
          onClick={() => setBurgerClicked(!burgerClicked)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`nav-links ${burgerClicked ? "open" : ""} `}>
          <li>
            <Link
              className={`${
                clickedPage === "admin-dashboard" ? "is-clicked" : ""
              }`}
              to="/admin"
              onClick={() => {
                setBurgerClicked(false);
                setClickedPage("admin-dashboard");
              }}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              className={`${
                clickedPage === "admin-courses" ? "is-clicked" : ""
              }`}
              to="/admin-courses"
              onClick={() => {
                setBurgerClicked(false);
                setClickedPage("admin-courses");
              }}
            >
              Courses
            </Link>
          </li>
          <li>
            <Link
              className={`${
                clickedPage === "admin-activities" ? "is-clicked" : ""
              }`}
              to="/admin-activities"
              onClick={() => {
                setBurgerClicked(false);
                setClickedPage("admin-activities");
              }}
            >
              Activities
            </Link>
          </li>
          <li>
            <Link
              className={`${
                clickedPage === "admin-account" ? "is-clicked" : ""
              }`}
              to="/admin-account"
              onClick={() => {
                setBurgerClicked(false);
                setClickedPage("admin-account");
              }}
            >
              Account
            </Link>
          </li>
          <li>
            <button className="logout-btn" onClick={handleLogout}>
              Log out
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default AdminNavbar;
