import { useEffect, useState } from "react";
import { BsCashCoin, BsGraphUp, BsTools } from "react-icons/bs";
import { IoIosArrowForward } from "react-icons/io";
import { MdOutlinePendingActions } from "react-icons/md";
import FlowChart from "../components/FlowChart";
import axios from "axios";
import useAuthContext from "../hooks/useAuthContext";

function Dashboard() {
  const [currentCourses, setCurrentCourses] = useState([]);
  const [flowchartCourses, setFlowchartCourses] = useState([]);
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
  const { user, tkFetchLoading } = useAuthContext();

  useEffect(() => {
    fetchUserDashboard();
  }, []);

  async function fetchUserDashboard() {
    if (!tkFetchLoading) {
      if (user?.access) {
        const flowChartDataReq = axios.get(
          "http://localhost:5000/api/courses/",
          {
            headers: {
              Authorization: `Bearer ${user?.access}`,
            },
          }
        );
        const academicTrackerReq = axios.get(
          "http://localhost:5000/api/users/academic-tracker",
          {
            headers: {
              Authorization: `Bearer ${user?.access}`,
            },
          }
        );
        axios
          .all([flowChartDataReq, academicTrackerReq])
          .then(
            axios.spread((flowChartDataRes, academicTrackerRes) => {
              setFlowchartCourses(flowChartDataRes.data?.courses);
              setCurrentCourses(academicTrackerRes.data?.studentCurrentCourses);
              parseActivities(academicTrackerRes.data?.activities);
            })
          )
          .catch((error) => console.error(error));
      }
    }
  }
  // if (flowchartCourses.length > 0)
  //   console.log("flowchartCourses", flowchartCourses);

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
    // console.log("activitiesGroupedByCategory", activitiesGroupedByCategory);

    setSemesterActivities(activitiesGroupedByCategory);
  }

  return (
    <div className="dashboard-container">
      <h1 className="page-title">My Communication Flowchart</h1>
      <FlowChart flowchartCourses={flowchartCourses} />
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
                {currentCourses && currentCourses.length > 0 ? (
                  (currentCourses as { courseCode: string }[]).map(
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
                <IoIosArrowForward
                  style={{ color: "rgb(136, 35, 70)", cursor: "pointer" }}
                />
              </h3>
              <div className="current-checklist-tabs">
                {activityCategories.map((activityCategory, index) => (
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
                    semesterActivities[selectedActivityCategory].map(
                      (activity, idx) => (
                        <li key={idx}>
                          <MdOutlinePendingActions
                            style={{ color: "rgb(136, 35, 70)" }}
                          />
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
