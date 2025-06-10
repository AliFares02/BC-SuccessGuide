import { API_BASE_URL } from "../api/config";
import axios from "axios";
import { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import {
  MdCancel,
  MdDeleteForever,
  MdInfo,
  MdPlaylistAdd,
  MdPlaylistRemove,
} from "react-icons/md";
import { IoAddCircle } from "react-icons/io5";
import { IoIosClose } from "react-icons/io";
import { Tooltip } from "react-tooltip";
import { toast } from "react-toastify";
import useAuthContext from "../hooks/useAuthContext";

type Course = {
  _id: string;
  course_code: string;
  course_name: string;
  course_credits: number;
  course_description: string;
  course_difficulty: string;
  course_prerequisites: string[];
  enrollmentCount: number;
  isConcentrationCourse?: string;
  concentration?: string;
  concentration_area?: string;
};
type Student = {
  gpa: number;
  name: string;
  _id: string;
};
type UpdatedCourseBody = {
  _id?: string;
  course_code?: string;
  course_name?: string;
  course_credits?: number;
  course_description?: string;
  course_difficulty?: string;
  course_prerequisites?: string[];
  enrollmentCount?: number;
};

type CreateCourseBody = {
  course_code?: string;
  course_name?: string;
  course_credits?: number | "";
  course_description?: string;
  course_difficulty?: string;
  course_prerequisites?: string[];
  isConcentrationCourse?: boolean;
  concentration?: string;
  concentration_area?: string;
};

function AdminCourses() {
  const [adminCoursesType, setAdminCoursesType] = useState<
    "core" | "concentration"
  >("core");
  const [adminConcentrationFilterType, setAdminConcentrationFilterType] =
    useState<
      | string
      | "Interpersonal and Intercultural Communication"
      | "Professional and Organizational Communication"
      | "Visual and Media Studies"
    >("Interpersonal and Intercultural Communication");
  const [coreCourses, setCoreCourses] = useState<Course[]>([]);
  const [concentrationCourses, setConcentrationCourses] = useState<Course[]>(
    []
  );
  const [filteredConcentrationCourses, setFilteredConcentrationCourses] =
    useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [courseComments, setCourseComments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [createCourseOverlay, setCreateCourseOverlay] = useState(false);
  const [createCourseBody, setCreateCourseBody] = useState<CreateCourseBody>({
    course_code: "",
    course_name: "",
    course_credits: "",
    course_description: "",
    course_difficulty: "",
    course_prerequisites: [],
  });
  const [createCourseError, setCreateCourseError] = useState(null);
  const [updatedCourseBody, setUpdatedCourseBody] =
    useState<UpdatedCourseBody | null>(null);
  const [deleteCoursePrompt, setDeleteCoursePrompt] = useState(false);
  const [unenrollPromptStudentId, setUnenrollPromptStudentId] = useState<
    string | null
  >(null);
  const [unenrollPrompt, setUnenrollPrompt] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    "course details" | "enrolled students" | "course comments"
  >("course details");
  const [newCoursePrerequisite, setNewCoursePrerequisite] = useState("");
  const [availablePrereqs, setAvailablePrereqs] = useState<string[]>([]);
  const [availablePrereqsCopy, setAvailablePrereqsCopy] = useState<string[]>(
    []
  );
  const [existingPrereqStructure, setExistingPrereqStructure] = useState<
    Map<string, string[]>
  >(new Map<string, string[]>());
  const { user } = useAuthContext();

  // state for communications department chair for purpose of adding concentration courses
  const [courseIsConcentration, setCourseIsConcentration] = useState("No");
  const [selectedConcentration, setSelectedConcentration] = useState("");
  const [selectedConcentrationArea, setSelectedConcentrationArea] =
    useState("");
  const validConcentrationAreas: Record<string, string[]> = {
    "Interpersonal and Intercultural Communication": [
      "Culture",
      "Society",
      "Family",
      "Gender",
    ],
    "Professional and Organizational Communication": [
      "Organizational",
      "Communication and Presentation Skills",
      "Groups and Teams",
      "Specialization",
    ],
    "Visual and Media Studies": ["Culture", "Media", "History", "Theory"],
  };

  useEffect(() => {
    if (user) {
      getAllCourses();
    }
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      setUpdatedCourseBody(selectedCourse);
    }
  }, [selectedCourse]);

  function buildReverseMap(
    prereqMap: Map<string, string[]>
  ): Map<string, string[]> {
    const reverseMap = new Map<string, string[]>();
    for (const [course, prereqs] of prereqMap.entries()) {
      for (const prereq of prereqs) {
        if (!reverseMap.has(prereq)) {
          reverseMap.set(prereq, []);
        }
        reverseMap.get(prereq)!.push(course);
      }
    }
    return reverseMap;
  }

  function getAllDependentsRecursively(
    course: string,
    reverseMap: Map<string, string[]>,
    visited = new Set<string>()
  ): string[] {
    if (visited.has(course)) return [];
    visited.add(course);

    const directDependents = reverseMap.get(course) || [];
    let allDependents = [...directDependents];

    for (const dependent of directDependents) {
      allDependents = allDependents.concat(
        getAllDependentsRecursively(dependent, reverseMap, visited)
      );
    }

    return allDependents;
  }

  function getAllPrereqsRecursively(
    course: string,
    visited = new Set<string>()
  ) {
    if (visited.has(course)) return [];
    visited.add(course);

    const directPrereqs = existingPrereqStructure?.get(course) || [];
    let allPrereqs = [...directPrereqs];

    for (const prereq of directPrereqs) {
      allPrereqs = allPrereqs.concat(getAllPrereqsRecursively(prereq, visited));
    }

    return allPrereqs;
  }

  function handleAddingPrereqToCreateCourse() {
    if (!newCoursePrerequisite) return;

    const allRelatedPrereqs = getAllPrereqsRecursively(newCoursePrerequisite);

    const reverseMap = buildReverseMap(existingPrereqStructure);
    const allRelatedDependents = getAllDependentsRecursively(
      newCoursePrerequisite,
      reverseMap
    );

    const toRemoveFromAvailable = new Set([
      newCoursePrerequisite,
      ...allRelatedPrereqs,
      ...allRelatedDependents,
    ]);

    setAvailablePrereqs((prev) =>
      prev.filter((courseCode) => !toRemoveFromAvailable.has(courseCode))
    );

    setCreateCourseBody((prev) => {
      return {
        ...prev,
        course_prerequisites: [
          ...prev.course_prerequisites!,
          newCoursePrerequisite,
        ],
      };
    });

    setNewCoursePrerequisite("");
  }

  function handleRemovingPrereqFromCreateCourse(courseCode: string) {
    const relatedPrereqs = getAllPrereqsRecursively(courseCode);

    setAvailablePrereqs((prev) => {
      const remainingSelected = createCourseBody.course_prerequisites!.filter(
        (code) => code !== courseCode
      );

      const allStillBlocked = new Set<string>();
      for (const selected of remainingSelected) {
        getAllPrereqsRecursively(selected).forEach((p) =>
          allStillBlocked.add(p)
        );
        allStillBlocked.add(selected);
      }

      return availablePrereqsCopy.filter(
        (course) => !allStillBlocked.has(course)
      );
    });

    setCreateCourseBody((prev) => {
      return {
        ...prev,
        course_prerequisites: prev.course_prerequisites!.filter(
          (course) => course !== courseCode
        ),
      };
    });

    setNewCoursePrerequisite("");
  }

  function handleConcentrationCoursesFilter(concentrationType: string) {
    const filtered = concentrationCourses.filter(
      (course) => course.concentration === concentrationType
    );
    setFilteredConcentrationCourses(filtered);
  }

  function parseCommunicationCourses(courses: Course[]) {
    const coreCourses: Course[] = [];
    const concentrationCourses: Course[] = [];
    for (const course of courses) {
      if (course.isConcentrationCourse) {
        concentrationCourses.push(course);
      } else {
        coreCourses.push(course);
      }
    }
    setCoreCourses(coreCourses);
    setConcentrationCourses(concentrationCourses);
    const initialFiltered = concentrationCourses.filter(
      (course) =>
        course.concentration === "Interpersonal and Intercultural Communication"
    );
    setFilteredConcentrationCourses(initialFiltered);
  }

  async function getAllCourses() {
    axios
      .get(`${API_BASE_URL}/api/admin/courses/all`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) => {
        if (user?.department === "Communication") {
          parseCommunicationCourses(response.data.coursesWithDetailsAndCounts);
        }
        setAllCourses(response.data.coursesWithDetailsAndCounts);
        setAvailablePrereqs(response.data.availablePrereqs);
        setAvailablePrereqsCopy(response.data.availablePrereqs);
        setExistingPrereqStructure(
          new Map(Object.entries(response.data.existingPrereqStructure))
        );
      })
      .catch((error) => {});
  }

  async function getCourseEnrollees() {
    setLoading(true);
    const enrolleesFromLS = localStorage.getItem("course_enrollees");
    if (enrolleesFromLS !== null) {
      setEnrolledStudents(JSON.parse(enrolleesFromLS));
      setLoading(false);
    } else {
      axios
        .get(
          `${API_BASE_URL}/api/admin/course/${selectedCourse?.course_code}/enrollees`,
          {
            headers: {
              Authorization: `Bearer ${user?.access}`,
            },
          }
        )
        .then((response) => {
          localStorage.setItem(
            "course_enrollees",
            JSON.stringify(response.data.enrollees)
          );
          setEnrolledStudents(response.data.enrollees);
          setLoading(false);
        })
        .catch((error) => {});
    }
  }

  async function getCourseComments() {
    setLoadingComments(true);
    const commentsFromLS = localStorage.getItem("comments");
    if (commentsFromLS !== null) {
      setCourseComments(JSON.parse(commentsFromLS));
      setLoadingComments(false);
    } else {
      axios
        .get(
          `${API_BASE_URL}/api/admin/course/${selectedCourse?.course_code}/comments`,
          {
            headers: {
              Authorization: `Bearer ${user?.access}`,
            },
          }
        )
        .then((response) => {
          localStorage.setItem(
            "comments",
            JSON.stringify(response.data.commentStrings)
          );
          setCourseComments(response.data.commentStrings);
          setLoadingComments(false);
        })
        .catch((error) => {});
    }
  }

  async function handleCreateCourse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    axios
      .post(
        `${API_BASE_URL}/api/courses/create-course`,
        {
          createCourseBody,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        const newCourse =
          response.data.course || response.data.concentrationCourse;
        newCourse.enrollmentCount = response.data.enrollmentCount;
        if (user?.department === "Communication") {
          if (newCourse?.isConcentrationCourse) {
            setConcentrationCourses((prev) => [...prev, newCourse]);
          } else {
            setCoreCourses((prev) => [...prev, newCourse]);
          }
          setCourseIsConcentration("No");
          setSelectedConcentration("");
          setSelectedConcentrationArea("");
        } else {
          setAllCourses((prev) => [...prev, newCourse]);
        }
        setCreateCourseError(null);
        setCreateCourseOverlay(false);
        setCreateCourseBody({
          course_code: "",
          course_name: "",
          course_credits: "",
          course_description: "",
          course_difficulty: "",
          course_prerequisites: [],
        });
        setAvailablePrereqs(availablePrereqsCopy);
        toast.success(response.data.msg);
      })
      .catch((error) => {
        setCreateCourseError(error.response.data.msg);
      });
  }

  async function handleCourseUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    axios
      .patch(
        `${API_BASE_URL}/api/courses/update-course/${updatedCourseBody?.course_code}`,
        { updatedCourseBody },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        const updatedCourse = response.data.course;
        updatedCourse.enrollmentCount = response.data.enrollmentCount;
        if (user?.department === "Communication") {
          if (updatedCourse?.isConcentrationCourse) {
            setConcentrationCourses((prev) => {
              const updatedCourses = prev.map((course) => {
                if (course.course_code === updatedCourse.course_code) {
                  return updatedCourse;
                }
                return course;
              });
              return updatedCourses;
            });
          } else {
            setCoreCourses((prev) => {
              const updatedCourses = prev.map((course) => {
                if (course.course_code === updatedCourse.course_code) {
                  return updatedCourse;
                }
                return course;
              });
              return updatedCourses;
            });
          }
        } else {
          setAllCourses((prev) => {
            const updatedCourses = prev.map((course) => {
              if (course.course_code === updatedCourse.course_code) {
                return updatedCourse;
              }
              return course;
            });
            return updatedCourses;
          });
        }
        localStorage.removeItem("course_enrollees");
        localStorage.removeItem("comments");
        setSelectedCourse(null);
        setSelectedCategory("course details");
        setEnrolledStudents([]);
        setDeleteCoursePrompt(false);
        toast.success(response.data.msg);
      })
      .catch((error) => toast.error(error.response.data.msg));
  }
  async function handleDeleteCourse() {
    axios
      .delete(
        `${API_BASE_URL}/api/courses/delete-course/${selectedCourse?.course_code}`,
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        const removedCourseCode: string = response.data.courseCode;
        if (user?.department === "Communication") {
          if (removedCourseCode.startsWith("COMM ")) {
            // then its a core course
            setCoreCourses((prev) =>
              prev.filter((course) => course.course_code !== removedCourseCode)
            );
          } else {
            setConcentrationCourses((prev) =>
              prev.filter((course) => course.course_code !== removedCourseCode)
            );
          }
        } else {
          setAllCourses((prev) =>
            prev.filter((course) => course.course_code !== removedCourseCode)
          );
        }
        localStorage.removeItem("course_enrollees");
        localStorage.removeItem("comments");
        setSelectedCourse(null);
        setSelectedCategory("course details");
        setEnrolledStudents([]);
        setDeleteCoursePrompt(false);
        toast.success(response.data.msg);
      })
      .catch((error) => {
        toast.error(error.response.data.msg);
      });
  }

  function handleUnenrollStudent() {
    axios
      .delete(
        `${API_BASE_URL}/api/admin/course/${selectedCourse?.course_code}/${unenrollPromptStudentId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        toast.success(response.data.msg);
        setEnrolledStudents((prev) =>
          [...prev].filter((student) => student._id !== response.data.student)
        );
        setUnenrollPrompt(false);
        setUnenrollPromptStudentId(null);
        setSelectedCourse((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            enrollmentCount: prev.enrollmentCount - 1,
          };
        });
      })
      .catch((error) => {
        toast.error(error.response.data.msg);
        setUnenrollPrompt(false);
        setUnenrollPromptStudentId(null);
      });
  }

  return (
    <div className="admin-courses-container">
      <h1 className="page-title">Courses</h1>
      <div className="admin-courses-subcontainer">
        {user?.department === "Communication" && (
          <div className="courses-type-tabs">
            <button
              className={`core-type-btn ${
                adminCoursesType === "core" ? "active" : ""
              }`}
              onClick={() => setAdminCoursesType("core")}
            >
              Core
            </button>
            <button
              className={`concentration-type-btn ${
                adminCoursesType === "concentration" ? "active" : ""
              }`}
              onClick={() => setAdminCoursesType("concentration")}
            >
              Concentration
            </button>
            {adminCoursesType === "concentration" && (
              <select
                className="admin-concentration-filter-type-select"
                value={adminConcentrationFilterType}
                onChange={(e) => {
                  handleConcentrationCoursesFilter(e.target.value);
                  setAdminConcentrationFilterType(e.target.value);
                }}
              >
                <option value="Interpersonal and Intercultural Communication">
                  Interpersonal and Intercultural Communication
                </option>
                <option value="Professional and Organizational Communication">
                  Professional and Organizational Communication
                </option>
                <option value="Visual and Media Studies">
                  Visual and Media Studies
                </option>
              </select>
            )}
          </div>
        )}
        <div className="admin-courses-table-wrapper">
          <table className="admin-courses-table">
            <thead>
              <tr>
                <th>Course code</th>
                <th>Course name</th>
                <th>Course description</th>
                <th>Course credits</th>
                <th>Total enrollees</th>
              </tr>
            </thead>
            <tbody>
              {user?.department === "Communication"
                ? adminCoursesType === "core"
                  ? coreCourses.map((course) => (
                      <tr
                        key={course._id}
                        onClick={() => setSelectedCourse(course)}
                      >
                        <td data-cell="code">{course.course_code}</td>
                        <td data-cell="name">
                          <p className="course-name-cell">
                            {course.course_name}
                          </p>
                        </td>
                        <td data-cell="description">
                          <p className="course-desc-cell">
                            {course.course_description}
                          </p>
                        </td>
                        <td data-cell="credits">{course.course_credits}</td>
                        <td data-cell="enrollment count">
                          {course.enrollmentCount}
                        </td>
                      </tr>
                    ))
                  : filteredConcentrationCourses.map((course) => (
                      <tr
                        key={course._id}
                        onClick={() => setSelectedCourse(course)}
                      >
                        <td data-cell="code">{course.course_code}</td>
                        <td data-cell="name">
                          <p className="course-name-cell">
                            {course.course_name}
                          </p>
                        </td>
                        <td data-cell="description">
                          <p className="course-desc-cell">
                            {course.course_description}
                          </p>
                        </td>
                        <td data-cell="credits">{course.course_credits}</td>
                        <td data-cell="enrollment count">
                          {course.enrollmentCount}
                        </td>
                      </tr>
                    ))
                : allCourses &&
                  allCourses.map((course) => (
                    <tr
                      key={course._id}
                      onClick={() => setSelectedCourse(course)}
                    >
                      <td data-cell="code">{course.course_code}</td>
                      <td data-cell="name">
                        <p className="course-name-cell">{course.course_name}</p>
                      </td>
                      <td data-cell="description">
                        <p className="course-desc-cell">
                          {course.course_description}
                        </p>
                      </td>
                      <td data-cell="credits">{course.course_credits}</td>
                      <td data-cell="enrollment count">
                        {course.enrollmentCount}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {selectedCourse && (
            <div
              className="selected-admin-class-overlay-wrapper"
              onMouseDown={(e) => {
                if (
                  !(e.target as HTMLElement).closest(
                    ".selected-admin-class-overlay"
                  )
                ) {
                  localStorage.removeItem("course_enrollees");
                  localStorage.removeItem("comments");
                  setSelectedCourse(null);
                  setSelectedCategory("course details");
                  setEnrolledStudents([]);
                  setDeleteCoursePrompt(false);
                  setUnenrollPrompt(false);
                  setUnenrollPromptStudentId(null);
                }
              }}
            >
              <div
                className="selected-admin-class-overlay"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="selected-course-tabs-wrapper">
                  <div className="tabs">
                    <label
                      className={`tab ${
                        selectedCategory === "course details" ? "selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedCategory("course details");
                        setDeleteCoursePrompt(false);
                        setUnenrollPrompt(false);
                        setUnenrollPromptStudentId(null);
                      }}
                    >
                      Course details
                    </label>
                    <label
                      className={`tab ${
                        selectedCategory === "enrolled students"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        getCourseEnrollees();
                        setSelectedCategory("enrolled students");
                        setDeleteCoursePrompt(false);
                      }}
                    >
                      Enrolled students
                    </label>
                    <label
                      className={`tab ${
                        selectedCategory === "course comments" ? "selected" : ""
                      }`}
                      onClick={() => {
                        getCourseComments();
                        setSelectedCategory("course comments");
                        setDeleteCoursePrompt(false);
                        setUnenrollPrompt(false);
                        setUnenrollPromptStudentId(null);
                      }}
                    >
                      Course comments
                    </label>
                  </div>

                  <div className="selected-course-tab-categories">
                    {selectedCategory === "course details" ? (
                      updatedCourseBody && (
                        <form
                          className="update-course-form"
                          onSubmit={(e) => handleCourseUpdate(e)}
                        >
                          <label htmlFor="overlay-course-code">Code</label>
                          <input
                            id="overlay-course-code"
                            type="text"
                            value={updatedCourseBody?.course_code}
                            onChange={(e) =>
                              setUpdatedCourseBody((prev) => {
                                return {
                                  ...prev,
                                  course_code: e.target.value,
                                };
                              })
                            }
                          />
                          <label htmlFor="">Name</label>
                          <input
                            id="overlay-course-name"
                            type="text"
                            value={updatedCourseBody?.course_name}
                            onChange={(e) =>
                              setUpdatedCourseBody((prev) => {
                                return {
                                  ...prev,
                                  course_name: e.target.value,
                                };
                              })
                            }
                          />
                          <label htmlFor="course-description">
                            Description
                          </label>
                          <textarea
                            id="course-description"
                            className="overlay-course-description"
                            value={updatedCourseBody?.course_description}
                            onChange={(e) =>
                              setUpdatedCourseBody((prev) => {
                                return {
                                  ...prev,
                                  course_description: e.target.value,
                                };
                              })
                            }
                          />
                          <label htmlFor="course-credits">Credits</label>
                          <select
                            className="overlay-credit-select"
                            value={updatedCourseBody?.course_credits}
                            onChange={(e) =>
                              setUpdatedCourseBody((prev) => {
                                return {
                                  ...prev,
                                  course_credits: parseInt(e.target.value),
                                };
                              })
                            }
                            aria-label="Select number of credits for course"
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </select>
                          {selectedCourse.course_prerequisites &&
                          selectedCourse.course_prerequisites.length > 0 ? (
                            <>
                              <label htmlFor="course-prerequisites-ctr">
                                Prerequisites
                              </label>
                              <div
                                id="course-prerequisites-ctr"
                                className="course-prerequisites-ctr"
                              >
                                {selectedCourse.course_prerequisites.map(
                                  (course) => (
                                    <p
                                      key={course}
                                      className="course-prerequisite"
                                    >
                                      {course}
                                    </p>
                                  )
                                )}
                              </div>
                            </>
                          ) : null}

                          <p className="overlay-enrollee-ct">
                            Total enrollees: {selectedCourse.enrollmentCount}
                          </p>
                          <button
                            type="submit"
                            className="save-course-changes"
                            disabled={
                              JSON.stringify(selectedCourse) ===
                              JSON.stringify(updatedCourseBody)
                            }
                          >
                            Save changes
                          </button>
                        </form>
                      )
                    ) : selectedCategory === "enrolled students" ? (
                      loading ? (
                        <CgSpinner className="loading-course-enrollees-spinner spinner" />
                      ) : (
                        <ul>
                          {enrolledStudents && enrolledStudents.length > 0 ? (
                            enrolledStudents.map((student) => (
                              <li
                                key={student._id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                &#8640; {student.name}{" "}
                                {unenrollPromptStudentId === student._id &&
                                unenrollPrompt ? (
                                  <>
                                    <p style={{ margin: "0 .25rem 0 auto" }}>
                                      Are you sure?
                                    </p>
                                    <strong
                                      style={{
                                        cursor: "pointer",
                                        marginRight: ".5rem",
                                      }}
                                      onClick={handleUnenrollStudent}
                                    >
                                      ✅
                                    </strong>
                                    <strong
                                      style={{ cursor: "pointer" }}
                                      onClick={() => {
                                        setUnenrollPrompt(false);
                                        setUnenrollPromptStudentId(null);
                                      }}
                                    >
                                      ❌
                                    </strong>
                                  </>
                                ) : (
                                  <>
                                    <Tooltip
                                      id="unenroll-student"
                                      place="top"
                                    />
                                    <MdPlaylistRemove
                                      data-tooltip-id="unenroll-student"
                                      data-tooltip-content={`Unenroll student from ${selectedCourse.course_code}`}
                                      className="unenroll-student-from-course-icon"
                                      onClick={() => {
                                        setUnenrollPrompt(true);
                                        setUnenrollPromptStudentId(student._id);
                                      }}
                                    />
                                  </>
                                )}
                              </li>
                            ))
                          ) : (
                            <li>No enrolled students</li>
                          )}
                        </ul>
                      )
                    ) : selectedCategory === "course comments" ? (
                      loadingComments ? (
                        <CgSpinner className="loading-course-comments-spinner spinner" />
                      ) : (
                        <ul>
                          {courseComments && courseComments.length > 0 ? (
                            courseComments.map((comment, idx) => (
                              <li
                                style={{
                                  marginBottom: ".5rem",
                                  borderRadius: ".5rem",
                                  backgroundColor: "aliceblue",
                                  padding: ".5rem",
                                  boxShadow: "0 4px 10px 0 rgba(0, 0, 0, 0.2)",
                                }}
                                key={idx}
                              >
                                "{comment}"
                              </li>
                            ))
                          ) : (
                            <li>No comments found</li>
                          )}
                        </ul>
                      )
                    ) : null}
                  </div>
                </div>
                {deleteCoursePrompt ? (
                  <div className="delete-course-prompt-wrapper">
                    <p>
                      Are you sure you want to delete{" "}
                      <span>{selectedCourse.course_code}?</span>
                    </p>
                    <button
                      className="confirm-del-course"
                      onClick={handleDeleteCourse}
                    >
                      Yes
                    </button>
                    <button
                      className="deny-del-course"
                      onClick={() => setDeleteCoursePrompt(false)}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    className="delete-course-btn"
                    onClick={() => setDeleteCoursePrompt(true)}
                  >
                    <MdDeleteForever className="remove-from-courses-icon" />
                    Delete course
                  </button>
                )}
                <MdCancel
                  className="exit-student-overlay-icon"
                  onClick={() => {
                    localStorage.removeItem("course_enrollees");
                    localStorage.removeItem("comments");
                    setSelectedCourse(null);
                    setSelectedCategory("course details");
                    setDeleteCoursePrompt(false);
                    setUnenrollPrompt(false);
                    setUnenrollPromptStudentId(null);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <Tooltip id="create-course" place="top" />
      <IoAddCircle
        data-tooltip-id="create-course"
        data-tooltip-content="Create new course"
        className="create-course-icon"
        onClick={() => setCreateCourseOverlay(true)}
      />
      {createCourseOverlay && (
        <div
          className="create-course-overlay-wrapper"
          onMouseDown={(e) => {
            if (!(e.target as HTMLElement).closest(".create-course-overlay")) {
              setCreateCourseOverlay(false);
              setCreateCourseError(null);
              setCreateCourseBody({
                course_code: "",
                course_name: "",
                course_credits: "",
                course_description: "",
                course_difficulty: "",
                course_prerequisites: [],
              });
              setCourseIsConcentration("No");
              setSelectedConcentration("");
              setSelectedConcentrationArea("");
              setNewCoursePrerequisite("");
              setAvailablePrereqs(availablePrereqsCopy);
            }
          }}
        >
          <div
            className="create-course-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip
              id="create-course-more-info"
              place="top"
              style={{
                zIndex: "1500",
                whiteSpace: "normal",
                maxWidth: "250px",
              }}
            />
            <MdInfo
              data-tooltip-id="create-course-more-info"
              data-tooltip-content="Adding a prerequisite may hide others if they’re implied. E.g., COMM 1000 is hidden when COMM 2000 is added since it’s already required. If a prereq is missing, manually add it in the description."
              className="create-course-more-info-btn-icon"
            />

            <form
              className="create-course-form"
              onSubmit={(e) => handleCreateCourse(e)}
            >
              <label htmlFor="create-course-code">Enter course code</label>
              <input
                id="create-course-code"
                type="text"
                value={createCourseBody?.course_code}
                onChange={(e) =>
                  setCreateCourseBody((prev) => {
                    return {
                      ...prev,
                      course_code: e.target.value,
                    };
                  })
                }
              />
              <label htmlFor="create-course-name">Enter course name</label>
              <input
                id="create-course-name"
                type="text"
                value={createCourseBody?.course_name}
                onChange={(e) =>
                  setCreateCourseBody((prev) => {
                    return {
                      ...prev,
                      course_name: e.target.value,
                    };
                  })
                }
              />
              <label htmlFor="create-course-desc">
                Enter course description
              </label>
              <textarea
                id="create-course-desc"
                value={createCourseBody?.course_description}
                onChange={(e) =>
                  setCreateCourseBody((prev) => {
                    return {
                      ...prev,
                      course_description: e.target.value,
                    };
                  })
                }
              />
              <label htmlFor="create-course-credits">
                Enter course credits
              </label>
              <select
                id="create-course-credits"
                value={createCourseBody?.course_credits}
                onChange={(e) =>
                  setCreateCourseBody((prev) => {
                    return {
                      ...prev,
                      course_credits: parseInt(e.target.value),
                    };
                  })
                }
              >
                <option value=""></option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
              {user?.department === "Communication" && (
                <>
                  <label htmlFor="is-concentration-course-select">
                    Concentration course?
                  </label>
                  <select
                    id="is-concentration-course-select"
                    value={courseIsConcentration}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      setCreateCourseBody((prev) => {
                        const newBody = { ...prev };

                        if (selectedValue === "Yes") {
                          newBody.isConcentrationCourse = true;
                        } else {
                          delete newBody.isConcentrationCourse;
                        }

                        return newBody;
                      });
                      setCourseIsConcentration(e.target.value);
                      setSelectedConcentration("");
                      setSelectedConcentrationArea("");
                    }}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </>
              )}
              {user?.department === "Communication" &&
              courseIsConcentration === "Yes" ? (
                <>
                  <label htmlFor="concentration-select">Concentration</label>
                  <select
                    id="concentration-select"
                    value={selectedConcentration}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      setCreateCourseBody((prev) => {
                        const newBody = { ...prev };

                        if (selectedValue !== "") {
                          newBody.concentration = selectedValue;
                        } else {
                          delete newBody.concentration;
                        }

                        return newBody;
                      });
                      setSelectedConcentration(e.target.value);
                      setSelectedConcentrationArea("");
                    }}
                  >
                    <option value=""></option>
                    <option value="Interpersonal and Intercultural Communication">
                      Interpersonal and Intercultural Communication
                    </option>
                    <option value="Professional and Organizational Communication">
                      Professional and Organizational Communication
                    </option>
                    <option value="Visual and Media Studies">
                      Visual and Media Studies
                    </option>
                  </select>

                  <label htmlFor="concentration-area-select">
                    Concentration area
                  </label>
                  <select
                    id="concentration-area-select"
                    value={selectedConcentrationArea}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      setCreateCourseBody((prev) => {
                        const newBody = { ...prev };

                        if (selectedValue !== "") {
                          newBody.concentration_area = selectedValue;
                        } else {
                          delete newBody.concentration_area;
                        }

                        return newBody;
                      });
                      setSelectedConcentrationArea(e.target.value);
                    }}
                  >
                    <option value=""></option>
                    {validConcentrationAreas[selectedConcentration]?.map(
                      (concentration, idx) => (
                        <option key={idx} value={concentration}>
                          {concentration}
                        </option>
                      )
                    )}
                  </select>
                </>
              ) : null}

              {createCourseBody.course_prerequisites &&
              createCourseBody.course_prerequisites.length > 0 ? (
                <>
                  <label htmlFor="create-course-prerequisites-ctr">
                    Prerequisites
                  </label>
                  <div
                    id="create-course-prerequisites-ctr"
                    className="create-course-prerequisites-ctr"
                  >
                    {createCourseBody.course_prerequisites.map((course) => (
                      <p key={course} className="course-prerequisite">
                        {course}
                        <IoIosClose
                          className="remove-prerequisite-icon"
                          onClick={() =>
                            handleRemovingPrereqFromCreateCourse(course)
                          }
                        />
                      </p>
                    ))}
                  </div>
                </>
              ) : null}

              {user?.department === "Communication" ? (
                courseIsConcentration === "No" ? (
                  <>
                    <label htmlFor="create-course-add-prereqs">
                      Add prerequisites?
                    </label>
                    <select
                      className="create-course-add-prereqs"
                      id="create-course-add-prereqs"
                      onChange={(e) => setNewCoursePrerequisite(e.target.value)}
                      value={newCoursePrerequisite}
                    >
                      <option value=""></option>
                      {availablePrereqs?.length > 0 &&
                        availablePrereqs.map((prereq, idx) => (
                          <option key={idx} value={prereq}>
                            {prereq}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      disabled={!newCoursePrerequisite}
                      onClick={handleAddingPrereqToCreateCourse}
                      className="create-course-add-prereq-btn"
                    >
                      <MdPlaylistAdd />
                    </button>
                  </>
                ) : null
              ) : (
                <>
                  <label htmlFor="create-course-add-prereqs">
                    Add prerequisites?
                  </label>
                  <select
                    className="create-course-add-prereqs"
                    id="create-course-add-prereqs"
                    onChange={(e) => setNewCoursePrerequisite(e.target.value)}
                    value={newCoursePrerequisite}
                  >
                    <option value=""></option>
                    {availablePrereqs?.length > 0 &&
                      availablePrereqs.map((prereq, idx) => (
                        <option key={idx} value={prereq}>
                          {prereq}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!newCoursePrerequisite}
                    onClick={handleAddingPrereqToCreateCourse}
                    className="create-course-add-prereq-btn"
                  >
                    <MdPlaylistAdd />
                  </button>
                </>
              )}

              {createCourseError && (
                <div className="error">{createCourseError}</div>
              )}

              <button type="submit" className="create-course-btn">
                <MdPlaylistAdd className="confirm-create-course-icon" />
                Create
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCourses;
