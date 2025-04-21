import { useState } from "react";
import { Link } from "react-router-dom";
import useLogout from "../hooks/useLogout";

function Navbar() {
  const [burgerClicked, setBurgerClicked] = useState(false);
  const { logout } = useLogout();
  // for displaying user info in the navbar
  // const {user} = useUserContext();

  function handleLogout() {
    setBurgerClicked(!burgerClicked);
    logout();
  }
  return (
    <nav className="navbar">
      <h1 className="logo">
        <Link className="logo" to="/">
          BC SuccessGuide
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

      <ul className={`nav-links ${burgerClicked ? "open" : ""}`}>
        <li>
          <Link to="/" onClick={() => setBurgerClicked(!burgerClicked)}>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/courses" onClick={() => setBurgerClicked(!burgerClicked)}>
            Courses
          </Link>
        </li>
        <li>
          <Link to="/pathways" onClick={() => setBurgerClicked(!burgerClicked)}>
            Pathways
          </Link>
        </li>
        <li>
          <Link
            to="/degree-calendar"
            onClick={() => setBurgerClicked(!burgerClicked)}
          >
            DegreeCalendar
          </Link>
        </li>
        <li>
          <Link className="logout-btn" onClick={handleLogout}>
            Log out
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
