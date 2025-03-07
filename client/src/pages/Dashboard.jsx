import React, { useState } from "react";
import FlowChart from "../components/FlowChart";
import { BsGraphUp, BsTools, BsCashCoin } from "react-icons/bs";

function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const categories = [
    "General",
    "Media",
    "Emergency, Crisis & RiskCommunication",
    "Sports",
    "Journalism",
    "Public Relations",
    "Social Media",
  ];
  const subCategories = {
    0: [
      "Center for Communication",
      "International Association of Business Communicators",
      "National Association of Government Communicators",
      "National Communication Association",
      "New York Women in Communications",
      "Toastmasters International",
    ],
    1: [
      "Emma Bowen Foundation (EBF)",
      "International Radio & Television Society Foundation (IRTS)",
      "National Association for Multi-ethnicity in Communications(NAMIC)",
      "National Association of Broadcasters",
    ],
    2: [
      "American Society for Health Care Risk Management",
      "Association of Healthcare Emergency Preparedness Professionals",
      "Association of Public-Safety Communications Officials (APCO International)",
      "International Association of Emergency Managers",
      "International Association of Risk and Crisis Communication (IARCC)",
    ],
    3: [
      "Association for Women in Sports Media",
      "College Sports Communicators",
      "National Sports Media Association",
      "North American Society for Sport Management",
      "Sport Marketing Association",
    ],
    4: [
      "Asian American Journalists Association",
      "Association of LGBTQ+ Journalists",
      "Indigenous Journalists Association",
      "National Association of Hispanic Journalists",
      "National Association of Black Journalists",
      "National Press Club",
      "Religion News Association",
      "Society of Environmental Journalists",
      "Society of Professional Journalists",
    ],
    5: [
      "Hispanic Public Relations Association",
      "International Public Relations Association",
      "National Black Public Relations Society (NBPRS)",
      "Public Relations Society of America (PRSA)",
      "Public Relations Student Society of America (PRSSA)",
    ],
    6: ["American Association of Social Media Professionals"],
  };
  return (
    <div className="dashboard-container">
      <h1 className="page-title">My Communication Flowchart</h1>
      <FlowChart />
      <div className="outlook-stats-section">
        <h2>More about your degree</h2>
        <div>
          <BsGraphUp />
          <p>
            Communications careers are expected to grow <b>6%</b> from 2023 to
            2033
          </p>
        </div>
        <div>
          <BsCashCoin />
          <p>
            Salaries in Communications range from <b>$50,000</b> to{" "}
            <b>$95,000</b>
          </p>
        </div>
        <div>
          <BsTools />
          <p>
            Key skills for communications professionals include{" "}
            <b>public speaking</b>, <b>writing</b>, <b>digital marketing</b>,{" "}
            <b>social media management</b>, and <b>strategic thinking</b>.
          </p>
        </div>
      </div>
      <div className="alumni-container">
        <h1>Alumni Destinations: Careers & Grad programs</h1>
        <div className="alumni-sub-container">
          <div>
            <h2>Careers</h2>
            <ul>
              <li>Google</li>
              <li>iHeartMedia</li>
              <li>NYC Department of Education</li>
              <li>Minds Matter NYC</li>
              <li>Sony</li>
              <li>RSA Security</li>
              <li>Federal Highway Administration</li>
              <li>Creative Art Works</li>
              <li>SEQ Technology</li>
              <li>Pomelatto</li>
              <li>NBCUniversal</li>
              <li>Clinton Foundation</li>
              <li>Tiffany & Co</li>
              <li>Capital One</li>
              <li>Giving Forward</li>
              <li>Oppenheimer & Co</li>
              <li>FOX</li>
              <li>YMCA</li>
              <li>Pratt Institute</li>
              <li>Memorial Sloan Kettering</li>
            </ul>
          </div>

          <hr className="section-divider" />
          <div>
            <h2>Graduate Programs</h2>
            <ul>
              <li>JD, Law</li>
              <li>MA, Media Studies</li>
              <li>MA, Public Policy</li>
              <li>MBA, Human Resources Management and Services</li>
              <li>PhD, Communication and Rhetoric</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="student-career-outlook-container">
        <h1 className="page-title">What you can do with your degree</h1>
        <div className="organizations-container">
          <h2>Organizations you can join</h2>
          <div className="tabs">
            {categories.map((category, index) => (
              <label
                className={`tab ${
                  selectedCategory === index ? "selected" : ""
                }`}
                key={index}
                onClick={() => setSelectedCategory(index)}
              >
                {category}
              </label>
            ))}
          </div>
          <div className="tab-categories">
            <ul>
              {subCategories[selectedCategory].length > 0 ? (
                subCategories[selectedCategory].map((subCategory, index) => (
                  <li key={index}>{subCategory}</li>
                ))
              ) : (
                <li>No subcategories available</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
