import { useState } from "react";
import { Link } from "react-router-dom";
import useLogout from "../hooks/useLogout";

function AdminNavbar() {
  const [burgerClicked, setBurgerClicked] = useState(false);
  const [clickedPage, setClickedPage] = useState("admin-dashboard");
  const { logout } = useLogout();

  function handleLogout() {
    setBurgerClicked(!burgerClicked);
    logout();
  }
  return (
    <nav className="navbar">
      <h1 className="logo">
        <Link
          className="logo"
          to="/admin"
          onClick={() => setClickedPage("dashboard")}
        >
          BC SuccessGuide{" "}
        </Link>
        <span
          style={{ fontWeight: "300", cursor: "default", userSelect: "none" }}
        >
          &nbsp;Admin
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
            className={`${clickedPage === "admin-courses" ? "is-clicked" : ""}`}
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
            className={`${clickedPage === "admin-account" ? "is-clicked" : ""}`}
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
  );
}

export default AdminNavbar;
