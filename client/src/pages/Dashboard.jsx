import { useEffect, useState } from "react";
import { BsCashCoin, BsGraphUp, BsTools } from "react-icons/bs";
import { IoIosArrowForward } from "react-icons/io";
import { MdOutlinePendingActions } from "react-icons/md";
import FlowChart from "../components/FlowChart";
import axios from "axios";

function Dashboard() {
  const [selectedChecklistCategory, setSelectedChecklistCategory] = useState(0);
  // useEffect(() => {
  //   // axios
  //   //   .get("http://localhost:5000/api/courses/")
  //   //   .then((response) => console.log(response.data))
  //   //   .catch((error) => console.error(error));
  // }, []);
  const checklistCategories = [
    "College Life",
    "Expand Your Horizons",
    "Pathway to Success",
  ];
  const checkListCategoryTasks = {
    0: [
      "Create a Handshake account",
      "Visit the Learning Center to see how it can help you achieve academic success",
    ],
    1: ["Create a draft résumé or start building a basic résumé"],
    2: ["Not sure what career(s) interest you? Check out MyNextMove"],
  };
  return (
    <div className="dashboard-container">
      <h1 className="page-title">My Communication Flowchart</h1>
      <FlowChart />
      <div className="outlook-stats-section">
        <h2>You should know</h2>
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
      <div className="academic-career-tracker-container">
        <div className="current-course-pathways-tracker">
          <div className="current-course-pathways-subcontainer-title">
            <h2>What You're Doing This Semester</h2>
          </div>
          <div className="current-courses-pathways-subcontainer">
            <table className="current-schedule">
              <thead>
                <tr>
                  <th>
                    <h3>
                      Current Courses{" "}
                      <IoIosArrowForward
                        style={{ color: "rgb(136, 35, 70)", cursor: "pointer" }}
                      />
                    </h3>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ENGL 1010</td>
                </tr>
                <tr>
                  <td>COMM 2000</td>
                </tr>
                <tr>
                  <td>COMM 3000</td>
                </tr>
                <tr>
                  <td>COMM 3100</td>
                </tr>
              </tbody>
            </table>
            <div className="current-checklist">
              <h3>
                Milestone Tracker{" "}
                <IoIosArrowForward
                  style={{ color: "rgb(136, 35, 70)", cursor: "pointer" }}
                />
              </h3>
              <div className="current-checklist-tabs">
                {checklistCategories.map((checkListCategory, index) => (
                  <label
                    className={`checkList-category ${
                      selectedChecklistCategory === index ? "selected" : ""
                    }`}
                    key={index}
                    onClick={() => setSelectedChecklistCategory(index)}
                  >
                    {checkListCategory}
                  </label>
                ))}
              </div>
              <div className="current-checklist-tabs-categories">
                <ul>
                  {checkListCategoryTasks[selectedChecklistCategory].length >
                  0 ? (
                    checkListCategoryTasks[selectedChecklistCategory].map(
                      (checkListCategoryTask, index) => (
                        <li key={index}>
                          <MdOutlinePendingActions
                            style={{ color: "rgb(136, 35, 70)" }}
                          />
                          {checkListCategoryTask}
                        </li>
                      )
                    )
                  ) : (
                    <li>No tasks in progress</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* a div that shows the current course schedule as well as the pathways checklist items that the student marked off as 'doing' */}
      </div>
      <div className="pathways-cards-container">
        {/* make college life, expand your horizons, pathway to success be cards and once clicked will take them to pathways page, change pathways name to something more generic rather than college specific.  */}
        <p className="pathways-cards-title">
          Get the Tools to Jumpstart Your Future in CASD
        </p>
        <div className="pathways-cards-sub-container">
          <div className="thumbnail-card">
            <img src="/assets/images/college_life_1.jpg" alt="" />
            <div>
              <h2>College Life</h2>
            </div>

            <div className="overlay">
              <p className="card-desc">
                Engage in academic and campus resources to build a strong
                foundation for success.
              </p>
            </div>
            <p className="learn-more">Learn more &#8640;</p>
          </div>
          <div className="thumbnail-card">
            <img src="/assets/images/college_life_1.jpg" alt="" />
            <div>
              <h2>Expand Your Horizons</h2>
            </div>

            <div className="overlay">
              <p className="card-desc">
                Take advantage of new experiences, networks, and opportunities
                beyond the classroom.
              </p>
            </div>
            <p className="learn-more">Learn more &#8640;</p>
          </div>
          <div className="thumbnail-card">
            <img src="/assets/images/college_life_1.jpg" alt="" />
            <div>
              <h2>Pathway to Success</h2>
            </div>

            <div className="overlay">
              <p className="card-desc">
                Plan and prepare for your future career with the right tools and
                guidance.
              </p>
            </div>
            <p className="learn-more">Learn more &#8640;</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
