import { API_BASE_URL } from "../api/config";
import axios from "axios";
import React, { useEffect, useState } from "react";
import useAuthContext from "../hooks/useAuthContext";
import {
  MdOutlinePlaylistAddCheck,
  MdOutlinePlaylistRemove,
  MdOutlineEditNote,
  MdOutlineEdit,
  MdInfo,
} from "react-icons/md";
import { Tooltip } from "react-tooltip";
import { toast } from "react-toastify";
import { HiMiniMinus } from "react-icons/hi2";
import {
  getCurrentSemesterWithYear,
  generateAvailableSemesters,
} from "../utils/getCurrentSemesterWithYear";
import {
  semesterInAdv,
  semesterInAdvWithYr,
} from "../utils/getNextSemesterRecommendedCourseStructure";
import recommendedCourses from "../utils/recommendedCourseStructure.json";
import { useLocation } from "react-router-dom";
import useLogout from "../hooks/useLogout";

interface PastCourse {
  courseCode: string;
  grade: string;
  semester: string;
  status: string;
  comment?: string;
}

function Courses() {
  const location = useLocation();
  const currentSemester = getCurrentSemesterWithYear();
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
  const [recommendedCourseStructure, setRecommendedCourseStructure] = useState(
    []
  );
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

  const [afstAdditionalCourses, setAfstAdditionalCourses] = useState<
    { courseCode: string; grade: String; semester_completed: string }[]
  >([]);

  const [editPastCourseSemester, setEditPastCourseSemester] = useState<{
    courseCode: string;
    idx: number;
  } | null>(null);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
  const [newPastCourseSemester, setNewPastCourseSemester] = useState("");

  const { user, tkFetchLoading } = useAuthContext();
  const { logout } = useLogout();

  useEffect(() => {
    if (!tkFetchLoading) {
      if (user?.access) {
        getCourses();
        if (user?.department === "Africana Studies") {
          getAfstAdditionalCreditCourses();
        }
        // these will be used to get recommended course structure.
        getStudentYear();
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

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
      }
    }
  }, [location]);

  async function getCourses() {
    const pastCoursesReq = axios.get(`${API_BASE_URL}/api/users/past-courses`, {
      headers: {
        Authorization: `Bearer ${user?.access}`,
      },
    });
    const currCoursesReq = axios.get(
      `${API_BASE_URL}/api/users/current-courses`,
      {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      }
    );
    const incompleteCoursesReq = axios.get(
      `${API_BASE_URL}/api/users/incomplete-courses`,
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

  function getRecommendedCourseStructure(studentYr: string) {
    if (user?.department) {
      const nextSemRecommendedCourseStructure = (recommendedCourses as any)[
        user.department
      ][studentYr][semesterInAdv.toLowerCase()];
      setRecommendedCourseStructure(nextSemRecommendedCourseStructure);
    }
  }

  async function calculateDesiredGPA() {
    setAchievableDesiredGPAMsg("");
    const desiredGPAasNumber = Number(desiredGPA);
    if (desiredGPAasNumber < 0 || desiredGPAasNumber > 4) {
      setDesiredGPAError("Desired gpa must be between 0 and 4.0");
    } else {
      setDesiredGPAError(null);
      axios
        .post(
          `${API_BASE_URL}/api/users/desired-gpa`,
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
        .catch((error) => {
          setDesiredGPAError(error.response.data.error);
          setAchievableDesiredGPAMsg("");
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

  async function calculateEstimatedGPA() {
    axios
      .post(
        `${API_BASE_URL}/api/users/estimated-gpa`,
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

  function handlePotentialGradeChange(
    e: React.ChangeEvent<any>,
    courseCode: string
  ) {
    const formattedWhatIfCourses = whatIfCourses?.map((whatIfCourse) => {
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
            `${API_BASE_URL}/api/users/past-courses/add/${courseCode}`,
            {
              grade: gradeRecieved,
              // change semester to semester that user manually adds
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
              (incompleteCourse) => {
                if (response.data.returnedCourse.courseCode === "COMM 4100") {
                  return (
                    incompleteCourse.courseCode !==
                      response.data.returnedCourse.courseCode &&
                    incompleteCourse.courseCode !== "COMM 4000"
                  );
                } else if (
                  response.data.returnedCourse.courseCode === "COMM 4000"
                ) {
                  return (
                    incompleteCourse.courseCode !==
                      response.data.returnedCourse.courseCode &&
                    incompleteCourse.courseCode !== "COMM 4100"
                  );
                }
                return (
                  incompleteCourse.courseCode !==
                  response.data.returnedCourse.courseCode
                );
              }
            );
            setIncompleteCourses(updatedIncompleteCourses);

            const updatedWhatIfCourses = whatIfCourses.filter(
              (whatIfCourse) => {
                if (response.data.returnedCourse.courseCode === "COMM 4100") {
                  return (
                    whatIfCourse.courseCode !==
                      response.data.returnedCourse.courseCode &&
                    whatIfCourse.courseCode !== "COMM 4000"
                  );
                } else if (
                  response.data.returnedCourse.courseCode === "COMM 4000"
                ) {
                  return (
                    whatIfCourse.courseCode !==
                      response.data.returnedCourse.courseCode &&
                    whatIfCourse.courseCode !== "COMM 4100"
                  );
                }
                return (
                  whatIfCourse.courseCode !==
                  response.data.returnedCourse.courseCode
                );
              }
            );
            setWhatIfCourses(updatedWhatIfCourses);

            toast.success(response.data.msg);
            setSelectedCurrToPastCourse(null);
            setGradeRecieved("");
          })
          .catch((error) => {
            toast.error(error?.response?.data?.msg);
            if (
              error?.response?.status === 401 &&
              (error?.response?.data?.msg === "Unauthorized request" ||
                error?.response?.data?.msg === "No token provided")
            ) {
              logout();
            }
          });
      } else {
        toast.error("Must provide a grade");
      }
    } else {
      toast.error("Invalid course");
    }
  }

  async function handleRemovePastCourse(courseCode: string) {
    axios
      .delete(`${API_BASE_URL}/api/users/past-courses/remove/${courseCode}`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
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
          if (
            response.data.courseCode === "COMM 4000" ||
            response.data.courseCode === "COMM 4100"
          ) {
            const otherCourseCode =
              courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000";
            setIncompleteCourses([
              ...incompleteCourses,
              { courseCode: response.data.courseCode },
              { courseCode: otherCourseCode },
            ]);
          } else {
            setIncompleteCourses([
              ...incompleteCourses,
              { courseCode: response.data.courseCode },
            ]);
          }
        }
        const courseExistsInWhatIfCourses = whatIfCourses.find(
          (course) => course.courseCode === response.data.courseCode
        );
        if (!courseExistsInWhatIfCourses) {
          if (
            response.data.courseCode === "COMM 4000" ||
            response.data.courseCode === "COMM 4100"
          ) {
            const otherCourseCode =
              courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000";
            setWhatIfCourses([
              ...whatIfCourses,
              { courseCode: response.data.courseCode },
              { courseCode: otherCourseCode },
            ]);
          } else {
            setWhatIfCourses([
              ...whatIfCourses,
              { courseCode: response.data.courseCode },
            ]);
          }
        }
        toast.success(response.data.msg);
      })
      .catch((error) => {
        toast.error(error?.response?.data?.msg);
        if (
          error?.response?.status === 401 &&
          (error?.response?.data?.msg === "Unauthorized request" ||
            error?.response?.data?.msg === "No token provided")
        ) {
          logout();
        }
      });
  }

  async function handleCourseComment(
    modificationType: string,
    course_code: string
  ) {
    switch (modificationType) {
      case "save":
        axios
          .patch(
            `${API_BASE_URL}/api/users/${course_code}/edit-comment`,
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
              past_courses: prev.past_courses?.map((course) =>
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
          .catch((error) => {
            toast.error(error?.response?.data?.msg);
            if (
              error?.response?.status === 401 &&
              (error?.response?.data?.msg === "Unauthorized request" ||
                error?.response?.data?.msg === "No token provided")
            ) {
              logout();
            }
          });
        break;
      case "delete":
        axios
          .patch(
            `${API_BASE_URL}/api/users/${course_code}/edit-comment`,
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
              past_courses: prev.past_courses?.map((course) =>
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
      default:
    }
  }

  async function getAfstAdditionalCreditCourses() {
    axios
      .get(`${API_BASE_URL}/api/users/afst-additional-major/courses`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) =>
        setAfstAdditionalCourses(response.data.additionalCourses)
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

  async function handleRemovePastAfstAddCourse(courseCode: string) {
    axios
      .delete(
        `${API_BASE_URL}/api/users/afst-additional-major/delete-course/${courseCode}`,
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        const removedCourseCode = response.data.removedCourseCode;
        setAfstAdditionalCourses((prev) =>
          prev.filter((course) => course.courseCode !== removedCourseCode)
        );
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
        getRecommendedCourseStructure(response.data.studentYear);
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

  async function handlePastCourseSemesterChange(
    courseCode: string,
    isAfstAdditionalCredCourse: boolean,
    semester: string
  ) {
    if (newPastCourseSemester === "") {
      toast.error("Must select a semester");
      return;
    }

    if (semester === newPastCourseSemester) {
      toast.error("New semester must be different");
      return;
    }

    axios
      .patch(
        `${API_BASE_URL}/api/users/past-courses/edit-semester/${courseCode}`,
        {
          isAfstAdditionalCredCourse,
          newSemester: newPastCourseSemester,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        const courseCode = response.data.courseCode;
        const updatedSemester = response.data.updatedSemester;
        if (response.data?.isAfstAddCredCourse) {
          setAfstAdditionalCourses((prev) =>
            prev?.map((course) => {
              if (course.courseCode === courseCode) {
                return {
                  ...course,
                  semester_completed: updatedSemester,
                };
              }
              return course;
            })
          );
        } else {
          setPastCourses((prev) => {
            const courseWithUpdatedSemester = prev.past_courses?.map(
              (course) => {
                if (course.courseCode === courseCode) {
                  return {
                    ...course,
                    semester: updatedSemester,
                  };
                }
                return course;
              }
            );
            return {
              ...prev,
              past_courses: courseWithUpdatedSemester,
            };
          });
        }
        toast.success(response.data.msg);
        setEditPastCourseSemester(null);
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
                )?.map((course, idx) => (
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
                pastCourses.past_courses?.map((course, idx) => (
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
                    <td>
                      <div className="past-courses-table-semester-wrapper">
                        {editPastCourseSemester &&
                        editPastCourseSemester.courseCode ===
                          course.courseCode &&
                        editPastCourseSemester.idx === idx ? (
                          <select
                            value={newPastCourseSemester}
                            onChange={(e) =>
                              setNewPastCourseSemester(e.target.value)
                            }
                          >
                            <option value=""></option>
                            {availableSemesters &&
                              availableSemesters?.map((semester) => (
                                <option key={semester}>{semester}</option>
                              ))}
                          </select>
                        ) : (
                          course.semester
                        )}{" "}
                        {editPastCourseSemester &&
                        editPastCourseSemester.courseCode ===
                          course.courseCode &&
                        editPastCourseSemester.idx === idx ? (
                          <div style={{ display: "flex", gap: ".5rem" }}>
                            <button
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: "0",
                                fontSize: "1rem",
                              }}
                              onClick={() =>
                                handlePastCourseSemesterChange(
                                  course.courseCode,
                                  false,
                                  course.semester
                                )
                              }
                            >
                              ✅
                            </button>
                            <button
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: "0",
                                fontSize: "1rem",
                              }}
                              onClick={() => setEditPastCourseSemester(null)}
                            >
                              ❌
                            </button>
                          </div>
                        ) : (
                          <>
                            <Tooltip
                              id="edit-past-course-semester"
                              place="top"
                            />
                            <button
                              type="button"
                              className="edit-course-semester-btn"
                              data-tooltip-id="edit-past-course-semester"
                              data-tooltip-content="Edit semester"
                              onClick={() =>
                                setEditPastCourseSemester({
                                  courseCode: course.courseCode,
                                  idx: idx,
                                })
                              }
                            >
                              <MdOutlineEdit />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
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
        </div>
        {user?.department === "Africana Studies" ? (
          afstAdditionalCourses ? (
            <>
              <p className="page-sub-title" style={{ marginTop: "7.5rem" }}>
                Additional credit courses
              </p>
              <div className="afst-additional-courses-table-wrapper">
                <table className="past-courses-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Grade</th>
                      <th>Semester</th>
                    </tr>
                  </thead>
                  <tbody>
                    {afstAdditionalCourses &&
                    afstAdditionalCourses.length > 0 ? (
                      afstAdditionalCourses?.map((course, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="curr-courses-table-course-code-wrapper">
                              <p>{course.courseCode}</p>
                              <Tooltip
                                id="remove-past-afst-course"
                                place="top"
                              />
                              <MdOutlinePlaylistRemove
                                data-tooltip-id="remove-past-afst-course"
                                data-tooltip-content="Remove course"
                                className="remove-past-course-icon"
                                onClick={() =>
                                  handleRemovePastAfstAddCourse(
                                    course.courseCode
                                  )
                                }
                              />
                            </div>
                          </td>
                          <td>{course.grade}</td>
                          <td>
                            <div className="past-afst-table-course-semester-wrapper">
                              {editPastCourseSemester &&
                              editPastCourseSemester.courseCode ===
                                course.courseCode &&
                              editPastCourseSemester.idx === idx ? (
                                <select
                                  value={newPastCourseSemester}
                                  onChange={(e) =>
                                    setNewPastCourseSemester(e.target.value)
                                  }
                                >
                                  <option value=""></option>
                                  {availableSemesters &&
                                    availableSemesters?.map((semester) => (
                                      <option key={semester}>{semester}</option>
                                    ))}
                                </select>
                              ) : (
                                course.semester_completed
                              )}{" "}
                              {editPastCourseSemester &&
                              editPastCourseSemester.courseCode ===
                                course.courseCode &&
                              editPastCourseSemester.idx === idx ? (
                                <div style={{ display: "flex", gap: ".5rem" }}>
                                  <button
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: "0",
                                      fontSize: "1rem",
                                    }}
                                    onClick={() =>
                                      handlePastCourseSemesterChange(
                                        course.courseCode,
                                        true,
                                        course.semester_completed
                                      )
                                    }
                                  >
                                    ✅
                                  </button>
                                  <button
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: "0",
                                      fontSize: "1rem",
                                    }}
                                    onClick={() =>
                                      setEditPastCourseSemester(null)
                                    }
                                  >
                                    ❌
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <Tooltip
                                    id="edit-past-afst-course-semester"
                                    place="top"
                                  />
                                  <button
                                    type="button"
                                    className="edit-course-semester-btn"
                                    data-tooltip-id="edit-past-afst-course-semester"
                                    data-tooltip-content="Edit semester"
                                    onClick={() =>
                                      setEditPastCourseSemester({
                                        courseCode: course.courseCode,
                                        idx: idx,
                                      })
                                    }
                                  >
                                    <MdOutlineEdit />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={{ textAlign: "center" }} colSpan={3}>
                          No past additional credit courses
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null
        ) : null}
      </div>

      <div
        className="recommended-course-structure-container"
        id="recommended-course-structure-section"
      >
        <p className="page-sub-title">
          Recommended course structure for {semesterInAdvWithYr}
        </p>
        <div className="recommended-courses-table-wrapper">
          <table className="recommended-courses-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {recommendedCourseStructure &&
              recommendedCourseStructure.length > 0 ? (
                (
                  recommendedCourseStructure as {
                    course: string;
                    category: string;
                  }[]
                )?.map((course, idx) => (
                  <tr key={idx}>
                    <td>
                      <p>{course.course}</p>
                    </td>
                    <td>{course.category}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ textAlign: "center" }} colSpan={3}>
                    No recommended courses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="desired-gpa-estimator-container">
        <p className="page-sub-title">What If</p>
        <div className="desired-gpa-estimator-sub-container">
          <Tooltip
            id="what-if-tools-more-info"
            place="top"
            style={{
              zIndex: "1500",
              whiteSpace: "normal",
              maxWidth: "250px",
            }}
          />
          <MdInfo
            data-tooltip-id="what-if-tools-more-info"
            data-tooltip-content="Use the Desired GPA Checker to see if your goal GPA is possible, and the GPA Estimator to predict your GPA based on potential future grades."
            className="what-if-tools-more-info"
          />
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
            <p style={{ textAlign: "center" }}>{achievableDesiredGPAMsg}</p>
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
            {user?.department === "Communication" ? (
              <>
                <Tooltip
                  id="what-if-tools-future-gpa-more-info"
                  place="top"
                  style={{
                    zIndex: "1500",
                    whiteSpace: "normal",
                    maxWidth: "250px",
                  }}
                />
                <MdInfo
                  data-tooltip-id="what-if-tools-future-gpa-more-info"
                  data-tooltip-content="Non-COMM courses are randomly picked from your remaining concentration areas, or from a random concentration if you haven't chosen one yet."
                  className="what-if-tools-future-gpa-more-info"
                />
              </>
            ) : user?.department === "Africana Studies" ? (
              <>
                <Tooltip
                  id="what-if-tools-future-gpa-more-info"
                  place="top"
                  style={{
                    zIndex: "1500",
                    whiteSpace: "normal",
                    maxWidth: "250px",
                  }}
                />
                <MdInfo
                  data-tooltip-id="what-if-tools-future-gpa-more-info"
                  data-tooltip-content="The courses below are the remaining credit requirement courses randomly selected from each category you haven't fulfilled. Additional credit courses don't apply to your core GPA so they are irrelevant here."
                  className="what-if-tools-future-gpa-more-info"
                />
              </>
            ) : null}
            <table className="desired-gpa-courses-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Potential Grade</th>
                </tr>
              </thead>
              <tbody>
                {incompleteCourses && incompleteCourses.length > 0 ? (
                  (incompleteCourses as { courseCode: string }[])?.map(
                    (incompleteCourse) => {
                      const courseCode = incompleteCourse.courseCode;
                      let disableCommInternshipCourse = false;
                      if (
                        courseCode === "COMM 4000" &&
                        whatIfCourses.find(
                          (course) => course.courseCode === "COMM 4100"
                        )?.estimatedGrade
                      ) {
                        disableCommInternshipCourse = true;
                      } else if (
                        courseCode === "COMM 4100" &&
                        whatIfCourses.find(
                          (course) => course.courseCode === "COMM 4000"
                        )?.estimatedGrade
                      ) {
                        disableCommInternshipCourse = true;
                      }
                      return (
                        <tr key={incompleteCourse.courseCode}>
                          <td>{incompleteCourse.courseCode}</td>
                          <td>
                            {disableCommInternshipCourse && (
                              <Tooltip
                                id="internship-grade-selector"
                                place="top"
                              />
                            )}
                            <select
                              data-tooltip-id={
                                disableCommInternshipCourse
                                  ? "internship-grade-selector"
                                  : undefined
                              }
                              data-tooltip-content={
                                disableCommInternshipCourse
                                  ? "Can set grade for only one internship course."
                                  : undefined
                              }
                              className="potential-grade-selector"
                              name="grade-selector"
                              id="grade-selector"
                              onChange={(e) =>
                                handlePotentialGradeChange(
                                  e,
                                  incompleteCourse.courseCode
                                )
                              }
                              disabled={disableCommInternshipCourse}
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
                      );
                    }
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
    </div>
  );
}

export default Courses;
