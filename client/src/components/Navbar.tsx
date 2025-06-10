import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useLogout from "../hooks/useLogout";
import NotificationComponent from "./NotificationComponent";
import getRegistrationDateIfWithin3Months from "../utils/getRegistrationDateThreeMthsInAdvanced";

function Navbar({
  setBannerVisible,
}: {
  setBannerVisible: (visible: boolean) => void;
}) {
  const [burgerClicked, setBurgerClicked] = useState(false);
  const location = useLocation();
  const [clickedPage, setClickedPage] = useState(() => {
    const path = location.pathname;
    if (path.startsWith("/courses")) return "courses";
    if (path.startsWith("/degree-roadmap")) return "degree-roadmap";
    if (path.startsWith("/account")) return "account";
    return "dashboard";
  });
  const { logout } = useLogout();

  const [showNotification, setShowNotification] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const regDate = getRegistrationDateIfWithin3Months();

    if (regDate) {
      const lastShownDate = localStorage.getItem(
        "lastRegistrationNotification"
      );

      if (lastShownDate !== regDate) {
        setShowNotification(true);
        setBannerVisible(true);
        localStorage.setItem("lastRegistrationNotification", regDate);
      }
    }
  }, [setBannerVisible]);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/courses")) setClickedPage("courses");
    else if (path.startsWith("/degree-roadmap"))
      setClickedPage("degree-roadmap");
    else if (path.startsWith("/account")) setClickedPage("account");
    else setClickedPage("dashboard");
  }, [location.pathname]);

  function handleLogout() {
    setBurgerClicked(!burgerClicked);
    logout();
  }
  return (
    <div className={`navbar-noti-wrapper ${isClosing ? "close" : ""}`}>
      {showNotification && (
        <NotificationComponent
          onClose={() => {
            setIsClosing(true);
            setTimeout(() => {
              setShowNotification(false);
              setIsClosing(false);
              setBannerVisible(false);
            }, 300);
          }}
        />
      )}

      <nav className="navbar">
        <h1 className="logo">
          <Link
            className="logo"
            to="/"
            onClick={() => setClickedPage("dashboard")}
          >
            <span className="logo-full">BC SuccessGuide</span>
            <span className="logo-short">BCSG</span>
          </Link>
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
              className={`${clickedPage === "dashboard" ? "is-clicked" : ""}`}
              to="/"
              onClick={() => {
                setBurgerClicked(false);
                setClickedPage("dashboard");
              }}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              className={`${clickedPage === "courses" ? "is-clicked" : ""}`}
              to="/courses"
              onClick={() => {
                setBurgerClicked(false);
                setClickedPage("courses");
              }}
            >
              Courses
            </Link>
          </li>
          <li>
            <Link
              className={`${
                clickedPage === "degree-roadmap" ? "is-clicked" : ""
              }`}
              to="/degree-roadmap"
              onClick={() => {
                setBurgerClicked(false);
                setClickedPage("degree-roadmap");
              }}
            >
              Degree Roadmap
            </Link>
          </li>
          <li>
            <Link
              className={`${clickedPage === "account" ? "is-clicked" : ""}`}
              to="/account"
              onClick={() => {
                setBurgerClicked(false);
                setClickedPage("account");
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

export default Navbar;
