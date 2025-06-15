import { API_BASE_URL } from "../api/config";
import axios from "axios";
import { useEffect, useState } from "react";
import { BsCashCoin, BsGraphUp, BsTools } from "react-icons/bs";
import { IoIosArrowForward, IoMdAddCircle } from "react-icons/io";
import {
  MdOutlineEdit,
  MdOutlinePendingActions,
  MdOutlineAssignmentTurnedIn,
  MdPlaylistAdd,
} from "react-icons/md";
import { toast } from "react-toastify";
import ConcentrationFlowChart from "../components/ConcentrationFlowChart";
import FlowChart from "../components/FlowChart";
import useAuthContext from "../hooks/useAuthContext";
import {
  getCurrentSemesterWithYear,
  generateAvailableSemesters,
} from "../utils/getCurrentSemesterWithYear";
import careerOutlookStats from "../utils/careerOutlookStats.json";
import whereYouCanGo from "../utils/whereYouCanGo.json";
import { Link } from "react-router-dom";
import useLogout from "../hooks/useLogout";

function Dashboard() {
  const [currentCourses, setCurrentCourses] = useState([]);
  const [flowchartCourses, setFlowchartCourses] = useState([]);
  const [concentrationFlowchartCourses, setConcentrationFlowchartCourses] =
    useState([]);
  const [flowChartType, setFlowChartType] = useState<"core" | "concentration">(
    "core"
  );
  const iconMap = {
    BsCashCoin,
    BsGraphUp,
    BsTools,
  };
  const majorAbbrv = {
    Communication: "COMM",
    "Communication Sciences and Disorders": "CASD",
    "Africana Studies": "AFST",
  };

  const [selectedActivityCategory, setSelectedActivityCategory] =
    useState("College Life");
  const activityCategories = [
    "College Life",
    "Expand Your Horizons",
    "Pathway to Success",
  ];
  const [semesterActivities, setSemesterActivities] = useState<{
    [key: string]: Activity[];
  }>({});
  const [studentYear, setStudentYear] = useState("");

  const [afstChosenMajor, setAfstChosenMajor] = useState("");
  const [existingAfstChosenMajor, setExistingAfstChosenMajor] = useState(null);
  const [afstChosenMajorError, setAfstChosenMajorError] = useState<
    string | null
  >(null);
  const [editAfstChosenMajor, setEditAfstChosenMajor] = useState(false);
  const [afstAdditionalCourseCode, setAfstAdditionalCourseCode] =
    useState<string>("");
  const [afstAdditionalCourseCredits, setAfstAdditionalCourseCredits] =
    useState<number | string>("2");
  const [afstAdditionalCourseGrade, setAfstAdditionalCourseGrade] =
    useState("");
  const [
    afstAdditionalCourseSemesterTaken,
    setAfstAdditionalCourseSemesterTaken,
  ] = useState("");
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
  const { user, tkFetchLoading } = useAuthContext();
  const { logout } = useLogout();

  useEffect(() => {
    fetchUserDashboard();
    getStudentYear();
    if (user?.department === "Africana Studies") {
      getAfstChosenMajor();
    }
  }, []);

  if (user?.department === "Africana Studies") {
    useEffect(() => {
      if (existingAfstChosenMajor != null) {
        setAfstChosenMajor(existingAfstChosenMajor);
      }
    }, [existingAfstChosenMajor]);
  }

  async function fetchUserDashboard() {
    if (!tkFetchLoading && user?.access) {
      const headers = {
        Authorization: `Bearer ${user.access}`,
      };
      const flowChartDataReq = axios.get(`${API_BASE_URL}/api/users/`, {
        headers,
      });
      const academicTrackerReq = axios.get(
        `${API_BASE_URL}/api/users/academic-tracker`,
        {
          headers,
        }
      );
      const requests = [flowChartDataReq, academicTrackerReq];

      if (user?.department === "Communication") {
        const concentrationFlowChartDataReq = axios.get(
          `${API_BASE_URL}/api/users/concentration`,
          {
            headers,
          }
        );
        requests.push(concentrationFlowChartDataReq);
      }
      axios
        .all(requests)
        .then(
          axios.spread(
            (flowChartDataRes, academicTrackerRes, concentrationRes) => {
              setFlowchartCourses(
                flowChartDataRes.data?.studentAndDeptCoursesJoined
              );
              setCurrentCourses(academicTrackerRes.data?.studentCurrentCourses);
              parseActivities(academicTrackerRes.data?.activities);
              if (concentrationRes) {
                setConcentrationFlowchartCourses(
                  concentrationRes.data.studentAndConCoursesJoined
                );
              }
            }
          )
        )
        .catch((error) => {
          if (
            error?.response?.status === 401 &&
            (error?.response?.data?.msg === "Unauthorized request" ||
              error?.response?.data?.msg === "No token provided")
          ) {
            logout();
          }
        });
    }
  }

  interface Activity {
    activityId: {
      activity_category: string;
      activity_description: string;
      activity_semester: string;
      activity_year: string;
    };
    completedAt?: string;
    startedAt: string;
    status: string;
  }

  interface GroupedActivities {
    [category: string]: Activity[];
  }

  function parseActivities(activities: Activity[]) {
    const activitiesGroupedByCategory = activities.reduce<GroupedActivities>(
      (acc, activity) => {
        const category = activity?.activityId?.activity_category;

        if (!category) return acc;

        if (!acc[category]) {
          acc[category] = [];
        }

        acc[category].push(activity);

        return acc;
      },
      {}
    );
    setSemesterActivities(activitiesGroupedByCategory);
  }

  async function getStudentYear() {
    axios
      .get(`${API_BASE_URL}/api/users/account/year`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) => {
        const currentSemester = getCurrentSemesterWithYear();
        const availableSemesters = generateAvailableSemesters(
          currentSemester,
          response.data.studentYear
        );
        setAvailableSemesters(availableSemesters);
        setStudentYear(response.data.studentYear);
      })
      .catch((error) => {
        toast.error(error.response.data.msg || error.response.data.error);
        if (
          error?.response?.status === 401 &&
          (error?.response?.data?.msg === "Unauthorized request" ||
            error?.response?.data?.msg === "No token provided")
        ) {
          logout();
        }
      });
  }

  async function getAfstChosenMajor() {
    axios
      .get(`${API_BASE_URL}/api/users/afst-additional-major/`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) => {
        setExistingAfstChosenMajor(response.data.additionalMajor);
      })
      .catch((error) => {
        setAfstChosenMajorError(
          error.response.data.msg || error.response.data.error
        );
        if (
          error?.response?.status === 401 &&
          (error?.response?.data?.msg === "Unauthorized request" ||
            error?.response?.data?.msg === "No token provided")
        ) {
          logout();
        }
      });
  }

  async function handleAfstAddMajor() {
    setAfstChosenMajorError(null);
    if (
      afstChosenMajor.trim().length < 1 ||
      afstChosenMajor.trim().length > 50
    ) {
      setAfstChosenMajorError("Invalid major length");
      return;
    }
    axios
      .post(
        `${API_BASE_URL}/api/users/afst-additional-major/add-major`,
        {
          additionalMajor: afstChosenMajor,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        setExistingAfstChosenMajor(response.data.additionalMajor);
        setAfstChosenMajorError(null);
        toast.success(response.data.msg);
      })
      .catch((error) => {
        setAfstChosenMajorError(
          error.response.data.msg || error.response.data.error
        );
        if (
          error?.response?.status === 401 &&
          (error?.response?.data?.msg === "Unauthorized request" ||
            error?.response?.data?.msg === "No token provided")
        ) {
          logout();
        }
      });
  }

  async function handleAfstAddMajorEdit() {
    setEditAfstChosenMajor(true);
    if (existingAfstChosenMajor === afstChosenMajor.trim()) {
      setAfstChosenMajorError("Major must be different");
      return;
    }
    axios
      .patch(
        `${API_BASE_URL}/api/users/afst-additional-major/update-major`,
        {
          newAdditionalMajor: afstChosenMajor,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        setExistingAfstChosenMajor(response.data.newAdditionalMajor);
        setEditAfstChosenMajor(false);
        toast.success(response.data.msg);
      })
      .catch((error) => {
        setAfstChosenMajorError(
          error.response.data.msg || error.response.data.error
        );
        if (
          error?.response?.status === 401 &&
          (error?.response?.data?.msg === "Unauthorized request" ||
            error?.response?.data?.msg === "No token provided")
        ) {
          logout();
        }
      });
  }

  async function handleAddAfstAdditionalCourse() {
    axios
      .post(
        `${API_BASE_URL}/api/users/afst-additional-major/add-course/${afstAdditionalCourseCode}`,
        {
          credits: afstAdditionalCourseCredits,
          grade: afstAdditionalCourseGrade,
          semesterCompleted: afstAdditionalCourseSemesterTaken,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        toast.success(response.data.msg);
      })
      .catch((error) => {
        toast.error(error.response.data.msg || error.response.data.error);
        if (
          error?.response?.status === 401 &&
          (error?.response?.data?.msg === "Unauthorized request" ||
            error?.response?.data?.msg === "No token provided")
        ) {
          logout();
        }
      });
  }

  return (
    <div className="dashboard-container">
      <h1 className="page-title">
        My {majorAbbrv[user?.department as keyof typeof majorAbbrv]} Flowchart
      </h1>
      {/* only render if user department is communication */}
      {/* tabular approach to dynamically render btwn core & concentration flowcharts *2 separate flowchart components not one uniform one */}

      {user?.department === "Communication" && (
        <div className="flowchart-tabs">
          <button
            className={`core-flowchart-btn ${
              flowChartType === "core" ? "active" : ""
            }`}
            onClick={() => setFlowChartType("core")}
          >
            Core
          </button>
          <button
            className={`concentration-flowchart-btn ${
              flowChartType === "concentration" ? "active" : ""
            }`}
            onClick={() => setFlowChartType("concentration")}
          >
            Concentration
          </button>
        </div>
      )}

      {user?.department === "Africana Studies" ? (
        <ConcentrationFlowChart
          concentrationFlowchartCourses={flowchartCourses}
        />
      ) : flowChartType === "core" ? (
        <FlowChart flowchartCourses={flowchartCourses} />
      ) : (
        <ConcentrationFlowChart
          concentrationFlowchartCourses={concentrationFlowchartCourses}
        />
      )}
      {user?.department === "Africana Studies" && (
        <div className="afst-additional-major-container">
          <p className="container-title">
            AFST students must complete 18 additional credits in a major of
            their choice, ideally toward the end of their degree. List chosen
            major and courses here:
          </p>
          {existingAfstChosenMajor ? (
            <>
              <label htmlFor="major-of-choice">Chosen Major</label>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: ".5rem",
                  marginBottom: ".5rem",
                }}
              >
                {editAfstChosenMajor ? (
                  <>
                    <input
                      type="text"
                      value={afstChosenMajor}
                      onChange={(e) => setAfstChosenMajor(e.target.value)}
                    />
                  </>
                ) : (
                  <p id="major-of-choice" style={{ margin: "0" }}>
                    {existingAfstChosenMajor}
                  </p>
                )}

                {editAfstChosenMajor ? (
                  <>
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0",
                        fontSize: "1.2rem",
                      }}
                      onClick={handleAfstAddMajorEdit}
                    >
                      ✅
                    </button>
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0",
                        fontSize: "1.2rem",
                      }}
                      onClick={() => setEditAfstChosenMajor(false)}
                    >
                      ❌
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="add-additional-major-btn"
                    onClick={() => setEditAfstChosenMajor(true)}
                  >
                    <MdOutlineEdit />
                  </button>
                )}
                {editAfstChosenMajor && (
                  <p
                    style={{
                      color: "rgb(220, 53, 69)",
                      fontSize: "0.8rem",
                      flexBasis: "100%",
                      textAlign: "center",
                      padding: "0",
                    }}
                  >
                    Warning: Changing major will erase your existing additional
                    courses{" "}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <label htmlFor="major-of-choice">Enter major</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: ".5rem",
                  marginBottom: "1rem",
                }}
              >
                <input
                  id="major-of-choice"
                  type="text"
                  value={afstChosenMajor}
                  onChange={(e) => setAfstChosenMajor(e.target.value)}
                />
                <button
                  type="button"
                  className="add-additional-major-btn"
                  disabled={!afstChosenMajor}
                  onClick={handleAfstAddMajor}
                >
                  <IoMdAddCircle />
                </button>
              </div>
              {afstChosenMajorError && (
                <div className="error">{afstChosenMajorError}</div>
              )}
            </>
          )}
          {existingAfstChosenMajor && (
            <div className="add-additional-course-container">
              <label htmlFor="add-additional-course-input">
                Enter course code/abbr. (e.g "HIST 1201")
              </label>
              <input
                id="add-additional-course-input"
                type="text"
                value={afstAdditionalCourseCode}
                onChange={(e) => setAfstAdditionalCourseCode(e.target.value)}
              />
              <label htmlFor="add-additional-course-credits">
                Select course credits
              </label>
              <select
                id="add-additional-course-credits"
                value={afstAdditionalCourseCredits}
                onChange={(e) =>
                  setAfstAdditionalCourseCredits(parseInt(e.target.value))
                }
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
              <label htmlFor="add-additional-course-grade-select">
                Select grade recieved
              </label>
              <select
                id="add-additional-course-grade-select"
                value={afstAdditionalCourseGrade}
                onChange={(e) => setAfstAdditionalCourseGrade(e.target.value)}
              >
                <option value=""></option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B">B</option>
                <option value="B-">B-</option>
                <option value="C+">C+</option>
                <option value="C">C</option>
                <option value="C-">C-</option>
                <option value="D+">D+</option>
                <option value="D">D</option>
                <option value="D-">D</option>
                <option value="F">F</option>
                <option value="P/CR">P/CR</option>
              </select>
              <label htmlFor="add-additional-course-semester-select">
                Select semester taken
              </label>
              <select
                id="add-additional-course-semester-select"
                value={afstAdditionalCourseSemesterTaken}
                onChange={(e) =>
                  setAfstAdditionalCourseSemesterTaken(e.target.value)
                }
              >
                <option value=""></option>
                {availableSemesters &&
                  availableSemesters?.map((semester) => (
                    <option key={semester}>{semester}</option>
                  ))}
              </select>
              <button
                className="add-additional-course-btn"
                disabled={
                  !afstAdditionalCourseCode ||
                  !afstAdditionalCourseGrade ||
                  !afstAdditionalCourseSemesterTaken
                }
                onClick={handleAddAfstAdditionalCourse}
              >
                <MdPlaylistAdd />
              </button>
            </div>
          )}
        </div>
      )}

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
                      <Link to={"/courses"}>
                        <IoIosArrowForward
                          style={{
                            color: "rgb(136, 35, 70)",
                            cursor: "pointer",
                          }}
                        />
                      </Link>
                    </h3>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentCourses && currentCourses.length > 0 ? (
                  (currentCourses as { courseCode: string }[])?.map(
                    (course, idx) => (
                      <tr key={idx}>
                        <td>{course.courseCode}</td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td colSpan={1} style={{ textAlign: "center" }}>
                      No courses this semester
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="current-checklist">
              <h3>
                Milestone Tracker{" "}
                <Link to={"/degree-roadmap"}>
                  <IoIosArrowForward
                    style={{
                      color: "rgb(136, 35, 70)",
                      cursor: "pointer",
                    }}
                  />
                </Link>
              </h3>
              <div className="current-checklist-tabs">
                {activityCategories?.map((activityCategory, index) => (
                  <label
                    className={`checkList-category ${
                      selectedActivityCategory === activityCategory
                        ? "selected"
                        : ""
                    }`}
                    key={index}
                    onClick={() =>
                      setSelectedActivityCategory(activityCategory)
                    }
                  >
                    {activityCategory}
                  </label>
                ))}
              </div>
              <div className="current-checklist-tabs-categories">
                <ul>
                  {semesterActivities[selectedActivityCategory]?.length > 0 ? (
                    semesterActivities[selectedActivityCategory]?.map(
                      (activity, idx) => (
                        <li key={idx}>
                          {activity.status === "completed" ? (
                            <MdOutlineAssignmentTurnedIn
                              style={{ color: "rgb(136, 35, 70)" }}
                            />
                          ) : activity.status === "in-progress" ? (
                            <MdOutlinePendingActions
                              style={{ color: "rgb(136, 35, 70)" }}
                            />
                          ) : null}
                          {activity.activityId.activity_description}
                        </li>
                      )
                    )
                  ) : (
                    <li>No activities for this category</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="what-if-tools-call-for-action">
        <p className="container-title">
          Explore the “What If” tools, at the end of your courses page, to see
          how your future grades could shape your GPA — and whether your GPA
          goals are within reach.
        </p>
      </div>
      <div className="outlook-stats-section">
        <p className="page-sub-title">You should know</p>

        {careerOutlookStats[
          user?.department as keyof typeof careerOutlookStats
        ]?.map((stat, idx) => {
          const IconComponent = iconMap[stat.icon as keyof typeof iconMap];
          return (
            <div key={idx}>
              <IconComponent />
              <p dangerouslySetInnerHTML={{ __html: stat.text }} />
            </div>
          );
        })}
      </div>
      <div className="where-you-can-go-container">
        <p className="page-sub-title">Where you can go with your degree</p>
        <p className="where-you-can-go">
          {whereYouCanGo[user?.department as keyof typeof whereYouCanGo]}
        </p>
      </div>
      <div className="pathways-cards-container">
        <p className="pathways-cards-title">
          Get the Tools to Jumpstart Your Future in{" "}
          {majorAbbrv[user?.department as keyof typeof majorAbbrv]}
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
            <p className="learn-more">
              <Link to={"/degree-roadmap"}>Learn more &#8640;</Link>
            </p>
          </div>
          <div className="thumbnail-card">
            <img src="/assets/images/bc_career_fair.jpg" alt="" />
            <div>
              <h2>Expand Your Horizons</h2>
            </div>

            <div className="overlay">
              <p className="card-desc">
                Take advantage of new experiences, networks, and opportunities
                beyond the classroom.
              </p>
            </div>
            <p className="learn-more">
              <Link to={"/degree-roadmap"}>Learn more &#8640;</Link>
            </p>
          </div>
          <div className="thumbnail-card">
            <img src="/assets/images/bc_career_mentor.jpg" alt="" />
            <div>
              <h2>Pathway to Success</h2>
            </div>

            <div className="overlay">
              <p className="card-desc">
                Plan and prepare for your future career with the right tools and
                guidance.
              </p>
            </div>
            <p className="learn-more">
              <Link to={"/degree-roadmap"}>Learn more &#8640;</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
