import axios from "axios";
import React, { useEffect, useState } from "react";
import useAuthContext from "../hooks/useAuthContext";
import {
  MdOutlinePlaylistAddCheck,
  MdOutlinePlaylistRemove,
  MdOutlineEditNote,
} from "react-icons/md";
import { Tooltip } from "react-tooltip";
import { toast } from "react-toastify";
import { HiMiniMinus } from "react-icons/hi2";
import getSemester from "../utils/getCurrentSemesterWithYear";

interface PastCourse {
  courseCode: string;
  grade: string;
  semester: string;
  status: string;
  comment?: string;
}

function Courses() {
  const currentSemester = getSemester();
  const [pastCourses, setPastCourses] = useState<{
    past_courses: PastCourse[];
    gpa: number;
  }>({ past_courses: [], gpa: 0 });
  const [currCourses, setCurrCourses] = useState<
    { courseCode: string; semester: string; status: string; comment?: string }[]
  >([]);
  const [selectedCourseComment, setSelectedCourseComment] = useState<{
    courseCode: string;
    comment?: string;
  } | null>(null);
  const [newCommentBody, setNewCommentBody] = useState<{
    courseCode: string;
    comment?: string;
  } | null>(null);
  const [gpa, setGpa] = useState(0);
  const [desiredGPA, setDesiredGPA] = useState("");
  const [achievableDesiredGPAMsg, setAchievableDesiredGPAMsg] = useState("");
  const [desiredGPAError, setDesiredGPAError] = useState<string | null>(null);
  const [whatIfCourses, setWhatIfCourses] = useState<
    { courseCode: string; estimatedGrade?: string }[]
  >([]);
  const [estimatedGPA, setEstimatedGPA] = useState(0);
  const [estimatedGPAMsg, setEstimatedGPAMsg] = useState("");
  const [estimatedGPAError, setEstimatedGPAError] = useState(null);
  const [incompleteCourses, setIncompleteCourses] = useState<
    { courseCode: string }[]
  >([]);
  const [selectedCurrToPastCourse, setSelectedCurrToPastCourse] = useState<{
    courseCode: string;
    semester: string;
  } | null>(null);
  const [gradeRecieved, setGradeRecieved] = useState("");

  const { user, tkFetchLoading } = useAuthContext();

  useEffect(() => {
    if (!tkFetchLoading) {
      if (user?.access) {
        getCourses();
      }
    }
  }, []);

  useEffect(() => {
    setGpa(pastCourses.gpa);
  }, [pastCourses]);

  useEffect(() => {
    if (selectedCourseComment) {
      setNewCommentBody({
        courseCode: selectedCourseComment.courseCode,
        comment: selectedCourseComment.comment,
      });
    }
  }, [selectedCourseComment]);

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
    const incompleteCoursesReq = axios.get(
      "http://localhost:5000/api/users/incomplete-courses",
      {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      }
    );
    axios
      .all([pastCoursesReq, currCoursesReq, incompleteCoursesReq])
      .then(
        axios.spread((pastCoursesRes, currCoursesRes, incompleteCoursesRes) => {
          setPastCourses({
            past_courses: pastCoursesRes.data?.past_courses,
            gpa: pastCoursesRes.data?.gpa,
          });
          setGpa(pastCoursesRes.data?.gpa);
          setCurrCourses(currCoursesRes.data?.current_courses);
          setIncompleteCourses(incompleteCoursesRes.data?.inCompleteCourses);
          setWhatIfCourses(incompleteCoursesRes.data?.inCompleteCourses);
        })
      )
      .catch((error) => console.error(error));
  }

  async function calculateDesiredGPA() {
    const desiredGPAasNumber = Number(desiredGPA);
    if (desiredGPAasNumber < 0 || desiredGPAasNumber > 4) {
      setDesiredGPAError("Desired gpa must be between 0 and 4.0");
    } else {
      setDesiredGPAError(null);
      axios
        .post(
          "http://localhost:5000/api/users/desired-gpa",
          {
            desiredGPA,
          },
          {
            headers: {
              Authorization: `Bearer ${user?.access}`,
            },
          }
        )
        .then((response) => setAchievableDesiredGPAMsg(response.data.msg))
        .catch((error) => setDesiredGPAError(error.response.data.error));
    }
  }

  async function calculateEstimatedGPA() {
    axios
      .post(
        "http://localhost:5000/api/users/estimated-gpa",
        {
          whatIfCourses,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        setEstimatedGPA(response.data.estimatedGPA);
        setEstimatedGPAMsg(response.data.msg || "");
      })
      .catch((error) => {
        toast.error(error.response.data.error);
      });
  }

  function handlePotentialGradeChange(
    e: React.ChangeEvent<any>,
    courseCode: string
  ) {
    const formattedWhatIfCourses = whatIfCourses.map((whatIfCourse) => {
      if (whatIfCourse.courseCode === courseCode) {
        return {
          ...whatIfCourse,
          estimatedGrade: e.target.value,
        };
      }
      return { ...whatIfCourse };
    });

    setWhatIfCourses(formattedWhatIfCourses);
  }

  async function handleCurrToPastCourse(courseCode: string) {
    if (selectedCurrToPastCourse?.courseCode !== "") {
      if (gradeRecieved.trim() !== "") {
        axios
          .post(
            `http://localhost:5000/api/users/past-courses/add/${courseCode}`,
            {
              grade: gradeRecieved,
              semester: currentSemester,
            },
            {
              headers: {
                Authorization: `Bearer ${user?.access}`,
              },
            }
          )
          .then((response) => {
            const updatedCurrCourses = currCourses.filter(
              (course) =>
                course.courseCode !== response.data.returnedCourse.courseCode
            );

            const courseAlrInPastCourses = pastCourses.past_courses?.find(
              (course) =>
                course.courseCode === response.data.returnedCourse.courseCode
            );

            // change semester to semester that user manually adds
            if (!courseAlrInPastCourses) {
              const newCourse = {
                courseCode: response.data.returnedCourse.courseCode,
                grade: gradeRecieved,
                semester: currentSemester,
                status: "taken",
              };
              setPastCourses((prev) => ({
                ...prev,
                past_courses: [...prev.past_courses, newCourse],
                gpa: response.data.gpa,
              }));
            }

            setCurrCourses(updatedCurrCourses);
            const updatedIncompleteCourses = incompleteCourses.filter(
              (incompleteCourse) =>
                incompleteCourse.courseCode !==
                response.data.returnedCourse.courseCode
            );
            setIncompleteCourses(updatedIncompleteCourses);

            const updatedWhatIfCourses = whatIfCourses.filter(
              (whatIfCourse) =>
                whatIfCourse.courseCode !==
                response.data.returnedCourse.courseCode
            );
            setWhatIfCourses(updatedWhatIfCourses);

            toast.success(response.data.msg);
            setSelectedCurrToPastCourse(null);
            setGradeRecieved("");
          })
          .catch((error) => toast.error(error.response.data.msg));
      } else {
        toast.error("Must provide a grade");
      }
    } else {
      toast.error("Invalid course");
    }
  }

  async function handleRemovePastCourse(courseCode: string) {
    axios
      .delete(
        `http://localhost:5000/api/users/past-courses/remove/${courseCode}`,
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        const updatedPastCourses = pastCourses.past_courses.filter(
          (course) => course.courseCode !== response.data.courseCode
        );
        setPastCourses({
          past_courses: updatedPastCourses,
          gpa: response.data.gpa,
        });

        const courseExistsInIncompleteCourses = incompleteCourses.find(
          (course) => course.courseCode === response.data.courseCode
        );

        if (!courseExistsInIncompleteCourses) {
          setIncompleteCourses([
            ...incompleteCourses,
            { courseCode: response.data.courseCode },
          ]);
        }
        const courseExistsInWhatIfCourses = whatIfCourses.find(
          (course) => course.courseCode === response.data.courseCode
        );
        if (!courseExistsInWhatIfCourses) {
          setWhatIfCourses([
            ...whatIfCourses,
            { courseCode: response.data.courseCode },
          ]);
        }

        toast.success(response.data.msg);
      })
      .catch((error) => toast.error(error.response.data.msg));
  }

  async function handleCourseComment(
    modificationType: string,
    course_code: string
  ) {
    switch (modificationType) {
      case "save":
        axios
          .patch(
            `http://localhost:5000/api/users/${course_code}/edit-comment`,
            {
              comment: newCommentBody?.comment,
            },
            {
              headers: {
                Authorization: `Bearer ${user?.access}`,
              },
            }
          )
          .then((response) => {
            setPastCourses((prev) => ({
              ...prev,
              past_courses: prev.past_courses.map((course) =>
                course.courseCode === response.data.courseCode
                  ? { ...course, comment: response.data.comment }
                  : course
              ),
            }));
            setNewCommentBody((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                comment: response.data.comment,
              };
            });
            toast.success(response.data.msg);
            setSelectedCourseComment(null);
          })
          .catch((error) => toast.error(error.response.data.msg));
        break;
      case "delete":
        axios
          .patch(
            `http://localhost:5000/api/users/${course_code}/edit-comment`,
            {
              comment: "",
            },
            {
              headers: {
                Authorization: `Bearer ${user?.access}`,
              },
            }
          )
          .then((response) => {
            setPastCourses((prev) => ({
              ...prev,
              past_courses: prev.past_courses.map((course) =>
                course.courseCode === response.data.courseCode
                  ? { ...course, comment: undefined }
                  : course
              ),
            }));
            setNewCommentBody((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                comment: undefined,
              };
            });
            toast.success(response.data.msg);
            setSelectedCourseComment(null);
          })
          .catch((error) => toast.error(error.response.data.msg));
      default:
    }
  }

  return (
    <div className="courses-container">
      <h1 className="page-title">My Courses</h1>
      <div className="courses-tables-container">
        <p className="page-sub-title">Current courses</p>
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
                (
                  currCourses as {
                    courseCode: string;
                    semester: string;
                    comment?: string;
                  }[]
                ).map((course, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="curr-courses-table-course-code-wrapper">
                        <p>{course.courseCode}</p>

                        <Tooltip id="mark-past-course" place="top" />
                        <MdOutlinePlaylistAddCheck
                          data-tooltip-id="mark-past-course"
                          data-tooltip-content="Mark as past/taken course"
                          className="add-past-courses-icon"
                          onClick={() => setSelectedCurrToPastCourse(course)}
                        />
                      </div>
                    </td>
                    <td>{course.semester}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ textAlign: "center" }} colSpan={2}>
                    No current Courses
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {selectedCurrToPastCourse && (
            <div
              className="curr-to-past-course-grade-prompt-overlay"
              onClick={() => setSelectedCurrToPastCourse(null)}
            >
              <div
                className="curr-to-past-course-grade-prompt"
                onClick={(e) => e.stopPropagation()}
              >
                <label htmlFor="grade-recieved-selector">
                  Enter grade recieved:
                </label>
                <select
                  className="grade-recieved-selector"
                  name="grade-recieved-selector"
                  id="grade-recieved-selector"
                  onChange={(e) => setGradeRecieved(e.target.value)}
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
                <div>
                  <button
                    className="move-curr-course-to-past-course"
                    onClick={() =>
                      handleCurrToPastCourse(
                        selectedCurrToPastCourse.courseCode
                      )
                    }
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <p className="page-sub-title">Past courses</p>
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
              {pastCourses.past_courses &&
              pastCourses.past_courses.length > 0 ? (
                pastCourses.past_courses.map((course, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="curr-courses-table-course-code-wrapper">
                        <p>{course.courseCode}</p>

                        <Tooltip id="edit-course-comment" place="top" />
                        <MdOutlineEditNote
                          data-tooltip-id="edit-course-comment"
                          data-tooltip-content="Add/Edit course comment"
                          className="edit-course-comment-icon"
                          onClick={() =>
                            setSelectedCourseComment({
                              courseCode: course.courseCode,
                              comment: course.comment,
                            })
                          }
                        />
                        <Tooltip id="remove-past-course" place="top" />
                        <MdOutlinePlaylistRemove
                          data-tooltip-id="remove-past-course"
                          data-tooltip-content="Remove past/taken course"
                          className="remove-past-course-icon"
                          onClick={() =>
                            handleRemovePastCourse(course.courseCode)
                          }
                        />
                      </div>
                    </td>
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
          {selectedCourseComment && (
            <div
              className="course-comment-overlay-wrapper"
              onMouseDown={(e) => {
                if (
                  !(e.target as HTMLElement).closest(".course-comment-overlay")
                ) {
                  setSelectedCourseComment(null);
                }
              }}
            >
              <div
                className="course-comment-overlay"
                onClick={(e) => e.stopPropagation()}
              >
                <HiMiniMinus
                  className="minimize-note-icon"
                  onClick={() => setSelectedCourseComment(null)}
                />
                <p className="comment-title">Course comment</p>
                <textarea
                  value={newCommentBody?.comment ?? ""}
                  onChange={(e) =>
                    setNewCommentBody({
                      courseCode: selectedCourseComment.courseCode!,
                      comment: e.target.value,
                    })
                  }
                >
                  {selectedCourseComment.comment}
                </textarea>
                <div className="btn-wrapper">
                  <button
                    className="save-comment-btn"
                    onClick={() =>
                      handleCourseComment(
                        "save",
                        selectedCourseComment.courseCode
                      )
                    }
                  >
                    Save
                  </button>
                  <button
                    className="delete-comment-btn"
                    onClick={() =>
                      handleCourseComment(
                        "delete",
                        selectedCourseComment.courseCode
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="current-gpa-container">
          <div className="gpa-container">
            <label htmlFor="gpa">Core GPA</label>
            <p id="gpa" className="gpa">
              {gpa > 0 ? gpa : "N/A"}
            </p>
          </div>
          <div className="current-gpa-color-bar-container">
            <div className="current-gpa-color-bar"></div>
          </div>
        </div>
      </div>
      <div className="desired-gpa-estimator-container">
        <p className="page-sub-title">What If</p>
        <div className="desired-gpa-estimator-sub-container">
          <p className="container-title">Achievable desired GPA checker</p>
          <div className="achievable-desired-gpa-content-subcontainer">
            <p className="container-sub-title">Enter desired GPA:</p>
            <input
              type="number"
              min="0"
              max="4.0"
              placeholder="e.g. 3.99"
              value={desiredGPA}
              onChange={(e) => setDesiredGPA(e.target.value)}
            />
          </div>
          <button
            className="calculate-desired-gpa-btn"
            onClick={calculateDesiredGPA}
          >
            Calculate
          </button>
          {desiredGPAError ? (
            <p className="error">{desiredGPAError}</p>
          ) : achievableDesiredGPAMsg ? (
            <p>{achievableDesiredGPAMsg}</p>
          ) : null}
          <hr className="courses-sections-divider" />
          <label
            className="container-title"
            htmlFor="desired-gpa-courses-table-wrapper"
          >
            Future GPA Estimator
          </label>
          <div
            id="desired-gpa-courses-table-wrapper"
            className="desired-gpa-courses-table-wrapper"
          >
            <table className="desired-gpa-courses-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Potential Grade</th>
                </tr>
              </thead>
              <tbody>
                {incompleteCourses && incompleteCourses.length > 0 ? (
                  (incompleteCourses as { courseCode: string }[]).map(
                    (incompleteCourse) => (
                      <tr key={incompleteCourse.courseCode}>
                        <td>{incompleteCourse.courseCode}</td>
                        <td>
                          <select
                            className="potential-grade-selector"
                            name="grade-selector"
                            id="grade-selector"
                            onChange={(e) =>
                              handlePotentialGradeChange(
                                e,
                                incompleteCourse.courseCode
                              )
                            }
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
                          </select>
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td style={{ textAlign: "center" }} colSpan={3}>
                      No incomplete courses
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button className="estimate-btn" onClick={calculateEstimatedGPA}>
            Estimate
          </button>
          {estimatedGPAError ? (
            <p className="error">{estimatedGPAError}</p>
          ) : estimatedGPA && estimatedGPAMsg ? (
            <div className="estimated-gpa-res">
              <p>Estimated GPA: {estimatedGPA}</p>
              <p>{estimatedGPAMsg}</p>
            </div>
          ) : estimatedGPA ? (
            <div className="estimated-gpa-res">
              <p>Estimated GPA: {estimatedGPA}</p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="recommended-course-structure-container">
        <p className="page-sub-title">
          Recommended course structure for Fall 2025
        </p>
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
                <td>Fall 2025</td>
              </tr>
              <tr>
                <td>COMM 2100</td>
                <td>Medium</td>
                <td>Fall 2025</td>
              </tr>
              <tr>
                <td>COMM 3200</td>
                <td>Hard</td>
                <td>Fall 2025</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Courses;
