import axios from "axios";
import React, { useEffect, useState } from "react";
import useAuthContext from "../hooks/useAuthContext";

function Courses() {
  const [pastCourses, setPastCourses] = useState([]);
  const [currCourses, setCurrCourses] = useState([]);

  const { user, tkFetchLoading } = useAuthContext();

  useEffect(() => {
    if (!tkFetchLoading) {
      if (user?.access) {
        getCourses();
      }
    }
  }, []);

  async function getCourses() {
    const pastCoursesReq = axios.get(
      "http://localhost:5000/api/users/past-courses",
      {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      }
    );
    const currCoursesReq = axios.get(
      "http://localhost:5000/api/users/current-courses",
      {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      }
    );
    axios
      .all([pastCoursesReq, currCoursesReq])
      .then(
        axios.spread((pastCoursesRes, currCoursesRes) => {
          console.log("pastCoursesRes", pastCoursesRes.data?.past_courses);
          console.log("currCoursesRes", currCoursesRes.data?.current_courses);
          setPastCourses(pastCoursesRes.data?.past_courses);
          setCurrCourses(currCoursesRes.data?.current_courses);
        })
      )
      .catch((error) => console.error(error));
  }
  return (
    <div className="courses-container">
      <h1 className="page-title">My Courses</h1>
      <div className="courses-tables-container">
        <h2 className="page-sub-title">Past courses</h2>
        <div className="past-courses-table-wrapper">
          <table className="past-courses-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Grade</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {pastCourses && pastCourses.length > 0 ? (
                (
                  pastCourses as {
                    courseCode: string;
                    grade: string;
                    semester: string;
                  }[]
                ).map((course, idx) => (
                  <tr key={idx}>
                    <td>{course.courseCode}</td>
                    <td>{course.grade}</td>
                    <td>{course.semester}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ textAlign: "center" }} colSpan={3}>
                    No past courses
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="current-gpa-container">
          <p>
            Current GPA: <b>3.7</b>
          </p>
          <div className="current-gpa-color-bar-container">
            <div className="current-gpa-color-bar"></div>
          </div>
          <p>Keep up the good work!</p>
          <p style={{ fontSize: "1.25rem" }}>
            You're on track to graduate by Spring 2025!
          </p>
        </div>
        <hr className="courses-sections-divider" />
        <h2 className="page-sub-title">Current courses</h2>
        <div className="current-courses-table-wrapper">
          <table className="current-courses-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {currCourses && currCourses.length > 0 ? (
                (currCourses as { courseCode: string; semester: string }[]).map(
                  (course, idx) => (
                    <tr key={idx}>
                      <td>{course.courseCode}</td>
                      <td>{course.semester}</td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td style={{ textAlign: "center" }} colSpan={2}>
                    No current Courses
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <hr className="courses-sections-divider" />
      <div className="desired-gpa-estimator-container">
        <h2 className="page-sub-title">
          What you need to achieve your desired GPA
        </h2>
        <h3 className="page-sub-title">Enter desired GPA:</h3>
        <input type="number" min="0" max="4.0" placeholder="e.g. 3.99" />
        <button>Calculate</button>
        <div className="desired-gpa-courses-table-wrapper">
          <table className="desired-gpa-courses-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Grade Needed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ENGL 1010</td>
                <td>A</td>
              </tr>
              <tr>
                <td>COMM 2000</td>
                <td>A-</td>
              </tr>
              <tr>
                <td>COMM 3000</td>
                <td>A+</td>
              </tr>
              <tr>
                <td>COMM 3100</td>
                <td>A</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="page-sub-title">
          Here is a recommended course structure for Fall 2024
        </h2>
        <div className="recommended-courses-table-wrapper">
          <table className="recommended-courses-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Difficulty</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ENGL 1012</td>
                <td>Medium</td>
                <td>Fall 2024</td>
              </tr>
              <tr>
                <td>COMM 2100</td>
                <td>Medium</td>
                <td>Fall 2024</td>
              </tr>
              <tr>
                <td>COMM 3200</td>
                <td>Hard</td>
                <td>Fall 2024</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Courses;
