import { API_BASE_URL } from "../api/config";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  MdCancel,
  MdDeleteForever,
  MdOutlineComment,
  MdNavigateNext,
  MdNavigateBefore,
} from "react-icons/md";
import { FaSort } from "react-icons/fa";
import useAuthContext from "../hooks/useAuthContext";

type Student = {
  activities: {
    activityId: {
      activity_description: string;
      _id: string;
    };
    comment: string;
    startedAt: string;
    status: "in-progress" | "completed";
    completedAt?: string;
  }[];
  concentration?: string;
  courses: {
    concentration?: string;
    courseCode: string;
    grade: string;
    status: "taken" | "in-progress";
    semester: string;
  }[];
  pastActivities: {
    activityId: {
      activity_description: string;
      _id: string;
    };
    comment: string;
    startedAt: string;
    status: "completed";
    completedAt?: string;
  }[];
  currentActivities: {
    activityId: {
      activity_description: string;
      _id: string;
    };
    comment: string;
    startedAt: string;
    status: "in-progress";
    completedAt?: string;
  }[];
  pastCourses: {
    courseCode: string;
    grade: string;
    status: "taken";
    semester: string;
  }[];
  currentCourses: {
    courseCode: string;
    grade: string;
    status: "in-progress";
    semester: string;
  }[];
  department: string;
  email: string;
  gpa: number;
  name: string;
  year: string;
  _id: string;
};

type ParsedStudent = {
  pastActivities: {
    activityId: {
      activity_description: string;
      _id: string;
    };
    comment: string;
    startedAt: string;
    status: "completed";
    completedAt?: string;
  }[];
  currentActivities: {
    activityId: {
      activity_description: string;
      _id: string;
    };
    comment: string;
    startedAt: string;
    status: "in-progress";
    completedAt?: string;
  }[];
  pastCourses: {
    courseCode: string;
    grade: string;
    status: "taken";
    comment: string;
    semester: string;
  }[];
  currentCourses: {
    courseCode: string;
    grade: string;
    status: "in-progress";
    semester: string;
  }[];
  concentration?: string;
  concentrationCourses?: {
    concentration: string;
    courseCode: string;
    grade: string;
    status: "taken";
    comment: string;
    semester: string;
  }[];
  department: string;
  email: string;
  gpa: number;
  name: string;
  year: string;
  _id: string;
};

function AdminDashboard() {
  const { user } = useAuthContext();
  const [allStudents, setAllStudents] = useState<ParsedStudent[]>([]);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(0);
  const [sortValue, setSortValue] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [averageStudentGPA, setAverageStudentGPA] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<ParsedStudent | null>(
    null
  );
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    | "current courses"
    | "past courses"
    | "concentration courses"
    | "current activities"
    | "past activities"
  >("current courses");
  const [deleteStudentPrompt, setDeleteStudentPrompt] = useState(false);

  useEffect(() => {
    if (user && user.role === "admin") {
      getAllStudents(1, "name", "asc");
      getAvgStudentGPA();
    }
  }, []);

  function parseStudents(students: Student[]) {
    const parsedStudents = students?.map((student) => {
      const pastActivities = student.activities.filter(
        (activity) => activity.status === "completed"
      ) as ParsedStudent["pastActivities"];
      const currentActivities = student.activities.filter(
        (activity) => activity.status === "in-progress"
      ) as ParsedStudent["currentActivities"];

      const pastCourses = student.courses.filter(
        (course) => course.status === "taken" && !course.concentration
      ) as ParsedStudent["pastCourses"];
      const currentCourses = student.courses.filter(
        (course) => course.status === "in-progress"
      ) as ParsedStudent["currentCourses"];

      // parsing comm student concentration courses
      let concentrationCourses: ParsedStudent["concentrationCourses"] = [];
      if (student.concentration) {
        concentrationCourses = student.courses.filter(
          (course) => course.concentration
        ) as ParsedStudent["concentrationCourses"];
      }

      const { activities, courses, concentration, ...restOfStudentFields } =
        student;
      return {
        ...restOfStudentFields,
        pastActivities: pastActivities,
        currentActivities: currentActivities,
        pastCourses: pastCourses,
        currentCourses: currentCourses,
        ...(concentration && { concentration }),
        ...(concentrationCourses &&
          concentrationCourses.length > 0 && { concentrationCourses }),
      };
    });
    setAllStudents(parsedStudents);
  }

  async function getAllStudents(page: number, sortBy: string, order: string) {
    axios
      .get(
        `${API_BASE_URL}/api/admin/students/?page=${page}&sortBy=${sortBy}&order=${order}`,
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        setMaxPage(response.data.totalPages);
        parseStudents(response.data.students);
      })
      .catch((error) => {});
  }

  async function handleDeleteStudent() {
    axios
      .delete(`${API_BASE_URL}/api/users/delete-user/${selectedStudent?._id}`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) => {
        const removedStudent = response.data.id;
        setAllStudents((prev) =>
          [...prev].filter((student) => student._id !== removedStudent)
        );
        setSelectedStudent(null);
        setSelectedCategory("current courses");
        setDeleteStudentPrompt(false);
      })
      .catch((error) => {});
  }

  async function getAvgStudentGPA() {
    axios
      .get(`${API_BASE_URL}/api/admin/average-student-gpa`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) => setAverageStudentGPA(response.data.averageGPA))
      .catch((error) => {});
  }
  return (
    <div className="admin-dashboard-container">
      <h1 className="page-title">Dashboard</h1>
      <div className="admin-dashboard-subcontainer">
        <div className="admin-dashboard-content-container">
          <p className="section-sub-title">My Students</p>
          <div className="students-table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th>
                    <p>
                      Name{" "}
                      {
                        <FaSort
                          className="sort-icon"
                          onClick={() => {
                            getAllStudents(page, "name", order);
                            setSortValue("name");
                            setOrder((prev) =>
                              prev === "asc" ? "desc" : "asc"
                            );
                          }}
                        />
                      }
                    </p>
                  </th>
                  <th>
                    <p>
                      Email{" "}
                      {
                        <FaSort
                          className="sort-icon"
                          onClick={() => {
                            getAllStudents(page, "email", order);
                            setSortValue("email");
                            setOrder((prev) =>
                              prev === "asc" ? "desc" : "asc"
                            );
                          }}
                        />
                      }
                    </p>
                  </th>
                  <th>
                    <p>
                      GPA{" "}
                      {
                        <FaSort
                          className="sort-icon"
                          onClick={() => {
                            getAllStudents(page, "gpa", order);
                            setSortValue("gpa");
                            setOrder((prev) =>
                              prev === "asc" ? "desc" : "asc"
                            );
                          }}
                        />
                      }
                    </p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {allStudents &&
                  allStudents?.map((student) => (
                    <tr
                      key={student._id}
                      onClick={() => {
                        setSelectedStudent(student);
                      }}
                    >
                      <td>
                        <p>{student.name}</p>
                      </td>
                      <td>
                        <p>{student.email}</p>
                      </td>
                      <td>
                        <p>{student.gpa > 0 ? student.gpa : "N/A"}</p>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {selectedStudent && (
              <div
                className="selected-student-overlay-wrapper"
                onMouseDown={(e) => {
                  if (
                    !(e.target as HTMLElement).closest(
                      ".selected-student-overlay"
                    )
                  ) {
                    setSelectedComment(null);
                    setSelectedStudent(null);
                    setSelectedCategory("current courses");
                    setDeleteStudentPrompt(false);
                  }
                }}
              >
                <div
                  className="selected-student-overlay"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="student-overlay-student-name">
                    {selectedStudent.name} - {selectedStudent.year} year
                  </p>
                  <div className="selected-student-tabs-wrapper">
                    <div className="tabs">
                      <label
                        className={`tab ${
                          selectedCategory === "current courses"
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedComment(null);
                          setSelectedCategory("current courses");
                          setDeleteStudentPrompt(false);
                        }}
                      >
                        Current courses
                      </label>
                      <label
                        className={`tab ${
                          selectedCategory === "past courses" ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedComment(null);
                          setSelectedCategory("past courses");
                          setDeleteStudentPrompt(false);
                        }}
                      >
                        Completed courses
                      </label>

                      {selectedStudent.concentration ? (
                        <>
                          <label
                            className={`tab ${
                              selectedCategory === "concentration courses"
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedComment(null);
                              setSelectedCategory("concentration courses");
                              setDeleteStudentPrompt(false);
                            }}
                          >
                            Concentration courses
                          </label>
                        </>
                      ) : null}

                      <label
                        className={`tab ${
                          selectedCategory === "current activities"
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedComment(null);
                          setSelectedCategory("current activities");
                          setDeleteStudentPrompt(false);
                        }}
                      >
                        Current activities
                      </label>
                      <label
                        className={`tab ${
                          selectedCategory === "past activities"
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedComment(null);
                          setSelectedCategory("past activities");
                          setDeleteStudentPrompt(false);
                        }}
                      >
                        Completed activities
                      </label>
                    </div>

                    <div className="selected-student-tab-categories">
                      <ul>
                        {selectedCategory === "current courses" ? (
                          selectedStudent.currentCourses?.length > 0 ? (
                            selectedStudent.currentCourses?.map((course) => (
                              <li key={course.courseCode}>
                                &#8640; {course.courseCode}
                              </li>
                            ))
                          ) : (
                            <li>No current courses found</li>
                          )
                        ) : selectedCategory === "past courses" ? (
                          selectedStudent.pastCourses.length > 0 ? (
                            selectedStudent.pastCourses?.map((course) => (
                              <li key={course.courseCode}>
                                <div className="admin-student-li-item-wrapper">
                                  &#8640; {course.courseCode}
                                  {course.comment && (
                                    <MdOutlineComment
                                      onClick={() =>
                                        setSelectedComment(course.comment)
                                      }
                                    />
                                  )}
                                  <span className="dots"></span>
                                  <p style={{ margin: "0 .5rem 0 auto" }}>
                                    {course.grade}
                                  </p>
                                </div>
                              </li>
                            ))
                          ) : (
                            <li>No completed courses found</li>
                          )
                        ) : selectedCategory === "concentration courses" ? (
                          selectedStudent.concentrationCourses &&
                          selectedStudent.concentrationCourses.length > 0 ? (
                            <>
                              <p
                                style={{
                                  margin: "0 0 .75rem 0",
                                  textAlign: "center",
                                }}
                              >
                                Concentration:{" "}
                                <span style={{ fontWeight: "600" }}>
                                  {selectedStudent.concentration}
                                </span>
                              </p>
                              {selectedStudent.concentrationCourses?.map(
                                (course) => (
                                  <li key={course.courseCode}>
                                    <div className="admin-student-li-item-wrapper">
                                      &#8640; {course.courseCode}
                                      {course.comment && (
                                        <MdOutlineComment
                                          onClick={() =>
                                            setSelectedComment(course.comment)
                                          }
                                        />
                                      )}
                                      <span className="dots"></span>
                                      <p style={{ margin: "0 .5rem 0 auto" }}>
                                        {course.grade}
                                      </p>
                                    </div>
                                  </li>
                                )
                              )}
                            </>
                          ) : (
                            <li>No completed courses found</li>
                          )
                        ) : selectedCategory === "current activities" ? (
                          selectedStudent?.currentActivities?.length > 0 ? (
                            selectedStudent.currentActivities?.map(
                              (activity) => (
                                <li key={activity.activityId?._id}>
                                  <div className="admin-student-li-item-wrapper">
                                    &#8640;{" "}
                                    {activity.activityId?.activity_description}
                                    {activity.comment && (
                                      <MdOutlineComment
                                        onClick={() =>
                                          setSelectedComment(activity.comment)
                                        }
                                      />
                                    )}
                                  </div>
                                </li>
                              )
                            )
                          ) : (
                            <li>No current activities found</li>
                          )
                        ) : selectedCategory === "past activities" ? (
                          selectedStudent.pastActivities.length > 0 ? (
                            selectedStudent.pastActivities?.map((activity) => (
                              <li key={activity.activityId?._id}>
                                <div className="admin-student-li-item-wrapper">
                                  &#8640;{" "}
                                  {activity.activityId?.activity_description}
                                  {activity.comment && (
                                    <MdOutlineComment
                                      onClick={() =>
                                        setSelectedComment(activity.comment)
                                      }
                                    />
                                  )}
                                </div>
                              </li>
                            ))
                          ) : (
                            <li>No completed activities found</li>
                          )
                        ) : null}
                        {selectedComment && (
                          <div
                            className="selected-comment-overlay-wrapper"
                            onMouseDown={(e) => {
                              if (
                                !(e.target as HTMLElement).closest(
                                  ".selected-comment-overlay"
                                )
                              ) {
                                setSelectedComment(null);
                              }
                            }}
                          >
                            <div className="selected-comment-overlay">
                              <textarea
                                readOnly={true}
                                value={selectedComment}
                              />
                            </div>
                          </div>
                        )}
                      </ul>
                    </div>
                  </div>

                  {deleteStudentPrompt ? (
                    <div className="delete-student-prompt-wrapper">
                      <p>
                        Are you sure you want to delete{" "}
                        <span>{selectedStudent.name}?</span>
                      </p>
                      <button
                        className="confirm-del-student"
                        onClick={handleDeleteStudent}
                      >
                        Yes
                      </button>
                      <button
                        className="deny-del-student"
                        onClick={() => setDeleteStudentPrompt(false)}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className="delete-student-btn"
                      onClick={() => setDeleteStudentPrompt(true)}
                    >
                      <MdDeleteForever className="remove-student-icon" />
                      Delete student
                    </button>
                  )}
                  <MdCancel
                    className="exit-student-overlay-icon"
                    onClick={() => {
                      setSelectedComment(null);
                      setSelectedStudent(null);
                      setSelectedCategory("current courses");
                      setDeleteStudentPrompt(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="admin-student-table-pagination-icons-wrapper">
            <button
              disabled={page === 1}
              onClick={() => {
                getAllStudents(page - 1, sortValue, order);
                setPage((prev) => prev - 1);
              }}
            >
              <MdNavigateBefore />
            </button>
            <button
              disabled={page === maxPage || page > maxPage}
              onClick={() => {
                getAllStudents(page + 1, sortValue, order);
                setPage((prev) => prev + 1);
              }}
            >
              <MdNavigateNext />
            </button>
          </div>
          <div className="average-gpa-container">
            <label htmlFor="average-gpa">Average GPA</label>
            <p id="average-gpa" className="average-gpa">
              {averageStudentGPA > 0 ? averageStudentGPA : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
