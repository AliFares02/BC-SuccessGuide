import React from "react";
import { FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa";

function Footer() {
  return (
    <div className="footer-container">
      <div className="main-footer-content">
        <div>
          <h3>General</h3>
          <ul>
            <li>
              <a href="#">About Us</a>
            </li>
            <li>
              <a href="#">Careers</a>
            </li>
            <li>
              <a href="#">Blog</a>
            </li>
          </ul>
        </div>
        <div>
          <h3>Contact Us</h3>
          <ul>
            <li>communications@brooklyn.cuny.edu</li>
            <li>(718) 951-5225</li>
            <li>2110 Boylan Hall, 2900 Bedford Avenue, Brooklyn, NY 11210</li>
          </ul>
        </div>
      </div>
      <div className="user-feedback-container">
        <h3>We'd love to hear your feedback!</h3>
        <button>Give Feedback</button>
      </div>
      <div className="handles-container">
        <h4>Follow Us</h4>
        <div className="handles">
          <FaFacebook />
          <FaInstagram />
          <FaTwitter />
        </div>
      </div>
      <p style={{ fontSize: ".8rem" }}>&#169; Brooklyn College</p>
    </div>
  );
}

export default Footer;
