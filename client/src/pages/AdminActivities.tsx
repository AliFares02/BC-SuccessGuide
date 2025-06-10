import { API_BASE_URL } from "../api/config";
import axios from "axios";
import React, { useEffect, useState } from "react";
import useAuthContext from "../hooks/useAuthContext";
import { IoAddCircle } from "react-icons/io5";
import { Tooltip } from "react-tooltip";
import {
  MdCancel,
  MdDeleteForever,
  MdPlaylistAdd,
  MdAddLink,
  MdLinkOff,
} from "react-icons/md";
import { toast } from "react-toastify";
import { CgSpinner } from "react-icons/cg";

interface Activity {
  _id: string;
  activity_category: string;
  activity_department: string;
  activity_description: string;
  activity_info_links?: string[];
  activity_semester: string;
  activity_year: string;
  engagedStudentCount: number;
}

type Student = {
  _id: string;
  name: string;
  email: string;
};

type ActivityCategoryIdx =
  | "College Life"
  | "Expand Your Horizons"
  | "Pathway to Success";

type CreateActivityBody = {
  activity_category: string;
  activity_description: string;
  activity_priority: number;
  activity_info_links?: string[];
  activity_semester: string;
  activity_year: string;
};

type UpdatedActivityBody = {
  _id?: string;
  activity_category?: string;
  activity_department?: string;
  activity_description?: string;
  activity_priority?: number;
  activity_info_links?: string[];
  activity_semester?: string;
  activity_year?: string;
  engagedStudentCount?: number;
};

type InactiveStudent = {
  name: string;
  email: string;
  gpa: number;
};
function AdminActivities() {
  const [parsedActivities, setParsedActivities] = useState<{
    [key: string]: Activity[];
  }>({});
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [createActivityOverlay, setCreateActivityOverlay] = useState(false);
  const [createActivityBody, setCreateActivityBody] =
    useState<CreateActivityBody>({
      activity_category: "",
      activity_description: "",
      activity_priority: 2,
      activity_info_links: [],
      activity_semester: "",
      activity_year: "",
    });
  const [newActivityInfoLink, setNewActivityInfoLink] = useState("");
  const [activityActiveStudents, setActivityActiveStudents] = useState<
    Student[]
  >([]);
  const [inactiveStudents, setInactiveStudents] = useState<InactiveStudent[]>(
    []
  );
  const [percentOfInactiveStudents, setPercentOfInactiveStudents] = useState(0);
  const [updatedActivityBody, setUpdatedActivityBody] =
    useState<UpdatedActivityBody | null>(null);
  const [createActivityError, setCreateActivityError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState<
    "activity details" | "active students"
  >("activity details");
  const [deleteActivityPrompt, setDeleteActivityPrompt] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maxTableRows, setMaxTableRows] = useState(0);
  const { user } = useAuthContext();

  useEffect(() => {
    if (user) {
      getAllActivities();
      getListOfInactiveSemesterStudents();
    }
  }, []);

  useEffect(() => {
    if (selectedActivity) setUpdatedActivityBody(selectedActivity);
  }, [selectedActivity]);

  useEffect(() => {
    if (parsedActivities)
      setMaxTableRows(
        Math.max(
          parsedActivities["College Life"]?.length,
          parsedActivities["Expand Your Horizons"]?.length,
          parsedActivities["Pathway to Success"]?.length
        )
      );
  }, [parsedActivities]);

  function parseActivities(activities: Activity[]) {
    const parsedActivities = {
      "College Life": [] as Activity[],
      "Expand Your Horizons": [] as Activity[],
      "Pathway to Success": [] as Activity[],
    };
    activities.forEach((activity) => {
      parsedActivities[activity.activity_category as ActivityCategoryIdx].push(
        activity
      );
    });

    setParsedActivities(parsedActivities);

    setMaxTableRows(
      Math.max(
        parsedActivities["College Life"].length,
        parsedActivities["Expand Your Horizons"].length,
        parsedActivities["Pathway to Success"].length
      )
    );
  }

  async function getAllActivities() {
    setLoadingActivities(true);
    axios
      .get(`${API_BASE_URL}/api/admin/activities`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) => {
        console.log("activities", response);
        parseActivities(response.data.activities);
        setLoadingActivities(false);
      })
      .catch((error) => console.error(error));
    setLoadingActivities(false);
  }

  async function getActivityActiveStudents() {
    setLoading(true);
    const activeStudentsFromLS = localStorage.getItem(
      "activity_active_students"
    );
    if (activeStudentsFromLS !== null) {
      setActivityActiveStudents(JSON.parse(activeStudentsFromLS));
      setLoading(false);
    } else {
      axios
        .get(
          `${API_BASE_URL}/api/admin/activity/${selectedActivity?._id}/active-students`,
          {
            headers: {
              Authorization: `Bearer ${user?.access}`,
            },
          }
        )
        .then((response) => {
          localStorage.setItem(
            "activity_active_students",
            JSON.stringify(response.data.activeStudents)
          );
          setActivityActiveStudents(response.data.activeStudents);
          setLoading(false);
        })
        .catch((error) => {});
    }
  }

  function handleCreateActivity(e: React.FormEvent<HTMLFormElement>) {
    setCreateActivityError(null);
    e.preventDefault();
    axios
      .post(
        `${API_BASE_URL}/api/activities/create-activity`,
        {
          ...createActivityBody,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        const newActivity = response.data.activity;
        const category = response.data.activity.activity_category;
        setParsedActivities((prev) => {
          const categoryWithNewActivity = [...prev[category], newActivity];

          return {
            ...prev,
            [category]: categoryWithNewActivity,
          };
        });
        setCreateActivityOverlay(false);
        toast.success(response.data.msg);
        setCreateActivityError(null);
        setCreateActivityBody({
          activity_category: "",
          activity_description: "",
          activity_priority: 2,
          activity_info_links: [],
          activity_semester: "",
          activity_year: "",
        });
      })
      .catch((error) => {
        setCreateActivityError(error.response.data.msg);
      });
  }

  async function handleActivityUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (updatedActivityBody) {
      const { engagedStudentCount, ...activityBodyExcludingStdntCt } =
        updatedActivityBody;
      axios
        .patch(
          `${API_BASE_URL}/api/activities/update-activity/${activityBodyExcludingStdntCt._id}`,
          activityBodyExcludingStdntCt,
          {
            headers: {
              Authorization: `Bearer ${user?.access}`,
            },
          }
        )
        .then((response) => {
          const upToDateActivityCategory =
            response.data.activity.activity_category;
          const activityId = response.data.activity._id;
          setParsedActivities((prev) => {
            if (selectedActivity?.activity_category) {
              if (
                selectedActivity.activity_category !== upToDateActivityCategory
              ) {
                const removedFromOldCategory = prev[
                  selectedActivity.activity_category
                ].filter((activity) => activity._id !== activityId);
                const addedToNewCategory = [
                  ...prev[upToDateActivityCategory],

                  response.data.activity,
                ];
                return {
                  ...prev,
                  [selectedActivity.activity_category]: removedFromOldCategory,
                  [upToDateActivityCategory]: addedToNewCategory,
                };
              }
            }
            const addedToNewCategory = prev[upToDateActivityCategory]?.map(
              (activity) =>
                activity._id === activityId ? response.data.activity : activity
            );

            return {
              ...prev,
              [upToDateActivityCategory]: addedToNewCategory,
            };
          });
          toast.success(response.data.msg);
          setSelectedActivity(null);
          setUpdatedActivityBody(null);
          setNewActivityInfoLink("");
        })
        .catch((error) => toast.error(error.response.data.msg));
    }
  }

  async function handleDeleteActivity() {
    axios
      .delete(
        `${API_BASE_URL}/api/activities/delete-activity/${selectedActivity?._id}`,
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        const removedActivityId = response.data.activityId;
        setParsedActivities((prev) => {
          if (selectedActivity?.activity_category) {
            const categoryWithoutActivity = prev[
              selectedActivity?.activity_category
            ].filter((activity) => activity._id !== removedActivityId);
            return {
              ...prev,
              [selectedActivity.activity_category]: categoryWithoutActivity,
            };
          }
          return prev;
        });
        localStorage.removeItem("activity_active_students");
        setSelectedActivity(null);
        setSelectedCategory("activity details");
        setActivityActiveStudents([]);
        setDeleteActivityPrompt(false);
        toast.success(response.data.msg);
      })
      .catch((error) => {});
  }

  async function getListOfInactiveSemesterStudents() {
    axios
      .get(`${API_BASE_URL}/api/admin/semester-inactive-students`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) => {
        setPercentOfInactiveStudents(
          response.data.lowEngagementStudentsPercent
        );
        setInactiveStudents(response.data.studentsWithLowEngagement);
      })
      .catch((error) => {});
  }

  return (
    <div className="admin-activities-container">
      <h1 className="page-title">Activities</h1>
      <div className="admin-activities-subcontainer">
        <div className="admin-activities-table-wrapper">
          <table className="admin-activities-table">
            <thead>
              <tr>
                <th>College Life</th>
                <th>Expand Your Horizons</th>
                <th>Pathway to Success</th>
              </tr>
            </thead>
            <tbody>
              {loadingActivities ? (
                <tr>
                  <td>
                    <div style={{ height: "100%", width: "100%" }}>
                      <CgSpinner className="loading-activities-spinner spinner" />
                    </div>
                  </td>
                </tr>
              ) : (
                Array.from({ length: maxTableRows })?.map((_, i) => (
                  <tr key={i}>
                    <td
                      onClick={() => {
                        setSelectedActivity(
                          parsedActivities["College Life"][i]
                        );
                      }}
                    >
                      {parsedActivities["College Life"][i]
                        ?.activity_description && (
                        <p className="admin-activity-description">
                          {
                            parsedActivities["College Life"][i]
                              ?.activity_description
                          }
                        </p>
                      )}
                    </td>
                    <td
                      onClick={() => {
                        setSelectedActivity(
                          parsedActivities["Expand Your Horizons"][i]
                        );
                      }}
                    >
                      {parsedActivities["Expand Your Horizons"][i]
                        ?.activity_description && (
                        <p className="admin-activity-description">
                          {
                            parsedActivities["Expand Your Horizons"][i]
                              ?.activity_description
                          }
                        </p>
                      )}
                    </td>
                    <td
                      onClick={() => {
                        setSelectedActivity(
                          parsedActivities["Pathway to Success"][i]
                        );
                      }}
                    >
                      {parsedActivities["Pathway to Success"][i]
                        ?.activity_description && (
                        <p className="admin-activity-description">
                          {
                            parsedActivities["Pathway to Success"][i]
                              ?.activity_description
                          }
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {selectedActivity && (
            <div
              className="selected-admin-activity-overlay-wrapper"
              onMouseDown={(e) => {
                if (
                  !(e.target as HTMLElement).closest(
                    ".selected-admin-activity-overlay"
                  )
                ) {
                  localStorage.removeItem("activity_active_students");
                  setSelectedActivity(null);
                  setSelectedCategory("activity details");
                  setActivityActiveStudents([]);
                  setDeleteActivityPrompt(false);
                  setNewActivityInfoLink("");
                }
              }}
            >
              <div
                className="selected-admin-activity-overlay"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="selected-activity-tabs-wrapper">
                  <div className="tabs">
                    <label
                      className={`tab ${
                        selectedCategory === "activity details"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedCategory("activity details");
                        setDeleteActivityPrompt(false);
                      }}
                    >
                      Activity details
                    </label>
                    <label
                      className={`tab ${
                        selectedCategory === "active students" ? "selected" : ""
                      }`}
                      onClick={() => {
                        getActivityActiveStudents();
                        setSelectedCategory("active students");
                        setDeleteActivityPrompt(false);
                      }}
                    >
                      Active students
                    </label>
                  </div>

                  <div className="selected-activity-tab-categories">
                    {selectedCategory === "activity details" ? (
                      updatedActivityBody && (
                        <form
                          className="update-activity-form"
                          onSubmit={(e) => handleActivityUpdate(e)}
                        >
                          <label htmlFor="overlay-activity-category">
                            Category
                          </label>
                          <select
                            id="overlay-activity-category"
                            value={updatedActivityBody?.activity_category}
                            onChange={(e) =>
                              setUpdatedActivityBody((prev) => {
                                return {
                                  ...prev,
                                  activity_category: e.target.value,
                                };
                              })
                            }
                          >
                            <option value=""></option>
                            <option value="College Life">College Life</option>
                            <option value="Expand Your Horizons">
                              Expand Your Horizons
                            </option>
                            <option value="Pathway to Success">
                              Pathway to Success
                            </option>
                          </select>
                          <label htmlFor="overlay-activity-desc">
                            Description
                          </label>
                          <textarea
                            id="overlay-activity-desc"
                            value={updatedActivityBody?.activity_description}
                            onChange={(e) =>
                              setUpdatedActivityBody((prev) => {
                                return {
                                  ...prev,
                                  activity_description: e.target.value,
                                };
                              })
                            }
                          />
                          <label htmlFor="overlay-activity-priority">
                            Priority
                          </label>
                          <select
                            id="overlay-activity-priority"
                            value={updatedActivityBody.activity_priority}
                            onChange={(e) =>
                              setUpdatedActivityBody((prev) => {
                                return {
                                  ...prev,
                                  activity_priority: parseInt(e.target.value),
                                };
                              })
                            }
                            aria-label="Select priority for activity"
                          >
                            <option value="1">1 - High</option>
                            <option value="2">2 - Low</option>
                          </select>

                          {updatedActivityBody.activity_info_links &&
                          updatedActivityBody.activity_info_links.length > 0 ? (
                            <>
                              <label htmlFor="activity-info-links-ctr">
                                Info links
                              </label>
                              <div
                                id="activity-info-links-ctr"
                                className="activity-info-links-ctr"
                              >
                                {updatedActivityBody.activity_info_links?.map(
                                  (link, idx) => (
                                    <p key={idx} className="activity-info-link">
                                      <a href={link} target="_blank">
                                        {link}
                                      </a>
                                      <MdLinkOff
                                        className="remove-link-icon"
                                        onClick={() =>
                                          setUpdatedActivityBody((prev) => {
                                            const newInfoLinks =
                                              prev?.activity_info_links?.filter(
                                                (_, i) => i !== idx
                                              );
                                            return {
                                              ...prev,
                                              activity_info_links: newInfoLinks,
                                            };
                                          })
                                        }
                                      />
                                    </p>
                                  )
                                )}
                              </div>
                            </>
                          ) : null}
                          <label htmlFor="">Add links</label>
                          <input
                            id="overlay-activity-add-info-links"
                            type="text"
                            className="overlay-activity-add-info-links"
                            value={newActivityInfoLink}
                            onChange={(e) =>
                              setNewActivityInfoLink(e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="add-links-btn"
                            disabled={!newActivityInfoLink}
                          >
                            <MdAddLink
                              onClick={() => {
                                setUpdatedActivityBody((prev) => {
                                  return {
                                    ...prev,
                                    activity_info_links: [
                                      ...(prev?.activity_info_links ?? []),
                                      newActivityInfoLink,
                                    ],
                                  };
                                });
                                setNewActivityInfoLink("");
                              }}
                            />
                          </button>
                          <label htmlFor="overlay-activity-semester">
                            Semester
                          </label>
                          <select
                            id="overlay-activity-semester"
                            className="overlay-activity-semester"
                            value={updatedActivityBody?.activity_semester}
                            onChange={(e) =>
                              setUpdatedActivityBody((prev) => {
                                return {
                                  ...prev,
                                  activity_semester: e.target.value,
                                };
                              })
                            }
                            aria-label="Select semester for activity"
                          >
                            <option value=""></option>
                            <option value="Fall">Fall</option>
                            <option value="Spring">Spring</option>
                          </select>
                          <label htmlFor="overlay-activity-year">Year</label>
                          <select
                            className="overlay-activity-year"
                            id="overlay-activity-year"
                            value={updatedActivityBody?.activity_year}
                            onChange={(e) =>
                              setUpdatedActivityBody((prev) => {
                                return {
                                  ...prev,
                                  activity_year: e.target.value,
                                };
                              })
                            }
                            aria-label="Select year for activity"
                          >
                            <option value=""></option>
                            <option value="First">First</option>
                            <option value="Second">Second</option>
                            <option value="Third">Third</option>
                            <option value="Fourth">Fourth</option>
                          </select>
                          <p className="overlay-active-students-ct">
                            Total active students:{" "}
                            {selectedActivity.engagedStudentCount | 0}
                          </p>
                          <button
                            type="submit"
                            className="save-activity-changes"
                            disabled={
                              JSON.stringify(selectedActivity) ===
                              JSON.stringify(updatedActivityBody)
                            }
                          >
                            Save changes
                          </button>
                        </form>
                      )
                    ) : selectedCategory === "active students" ? (
                      loading ? (
                        <CgSpinner className="loading-active-students-spinner spinner" />
                      ) : (
                        <ul>
                          {activityActiveStudents &&
                          activityActiveStudents.length > 0 ? (
                            activityActiveStudents?.map((student) => (
                              <li key={student._id}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <p style={{ margin: "0.35rem 0" }}>
                                    {student.name}
                                  </p>
                                  <p style={{ margin: "0.35rem 0" }}>
                                    {student.email}
                                  </p>
                                </div>
                              </li>
                            ))
                          ) : (
                            <li>No students active in this activity</li>
                          )}
                        </ul>
                      )
                    ) : null}
                  </div>
                </div>
                {deleteActivityPrompt ? (
                  <div className="delete-activity-prompt-wrapper">
                    <p>Are you sure you want to delete this activity?</p>
                    <button
                      className="confirm-del-activity"
                      onClick={handleDeleteActivity}
                    >
                      Yes
                    </button>
                    <button
                      className="deny-del-activity"
                      onClick={() => setDeleteActivityPrompt(false)}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    className="delete-activity-btn"
                    onClick={() => setDeleteActivityPrompt(true)}
                  >
                    <MdDeleteForever className="delete-activity-icon" />
                    Delete activity
                  </button>
                )}
                <MdCancel
                  className="exit-student-overlay-icon"
                  onClick={() => {
                    setSelectedActivity(null);
                    setSelectedCategory("activity details");
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <p className="section-sub-title">
          {percentOfInactiveStudents}% of your students have engaged in fewer
          than 25% of this semester's activities. See below.
        </p>
        <div className="inactive-students-table-wrapper">
          <table className="inactive-students-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>GPA</th>
              </tr>
            </thead>
            <tbody>
              {inactiveStudents?.length > 0 &&
                inactiveStudents?.map((inactiveStudent, idx) => (
                  <tr key={idx}>
                    <td>
                      <p>{inactiveStudent.name}</p>
                    </td>
                    <td>
                      <p>{inactiveStudent.email}</p>
                    </td>
                    <td>
                      <p>
                        {inactiveStudent?.gpa > 0 ? inactiveStudent.gpa : "N/A"}
                      </p>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {createActivityOverlay && (
        <div
          className="create-activity-overlay-wrapper"
          onMouseDown={(e) => {
            if (
              !(e.target as HTMLElement).closest(".create-activity-overlay")
            ) {
              setCreateActivityOverlay(false);
              setCreateActivityError(null);
              setCreateActivityBody({
                activity_category: "",
                activity_description: "",
                activity_priority: 2,
                activity_info_links: [],
                activity_semester: "",
                activity_year: "",
              });
              setNewActivityInfoLink("");
            }
          }}
        >
          <div
            className="create-activity-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              className="create-activity-form"
              onSubmit={(e) => handleCreateActivity(e)}
            >
              <label htmlFor="create-activity-category">
                Select activity category
              </label>
              <select
                id="create-activity-category"
                value={createActivityBody?.activity_category}
                onChange={(e) =>
                  setCreateActivityBody((prev) => {
                    return {
                      ...prev,
                      activity_category: e.target.value,
                    };
                  })
                }
              >
                <option value=""></option>
                <option value="College Life">College Life</option>
                <option value="Expand Your Horizons">
                  Expand Your Horizons
                </option>
                <option value="Pathway to Success">Pathway to Success</option>
              </select>
              <label htmlFor="create-activity-desc">
                Enter activity description
              </label>
              <textarea
                id="create-activity-desc"
                value={createActivityBody?.activity_description}
                onChange={(e) =>
                  setCreateActivityBody((prev) => {
                    return {
                      ...prev,
                      activity_description: e.target.value,
                    };
                  })
                }
              />
              <label htmlFor="">Select activity priority</label>
              <select
                id="create-activity-priority"
                value={createActivityBody.activity_priority}
                onChange={(e) =>
                  setCreateActivityBody((prev) => {
                    return {
                      ...prev,
                      activity_priority: parseInt(e.target.value),
                    };
                  })
                }
              >
                <option value="1">1 - High</option>
                <option value="2">2 - Low</option>
              </select>
              {createActivityBody.activity_info_links &&
              createActivityBody.activity_info_links.length > 0 ? (
                <>
                  <label htmlFor="activity-info-links-ctr">Info links</label>
                  <div
                    id="activity-info-links-ctr"
                    className="activity-info-links-ctr"
                  >
                    {createActivityBody.activity_info_links?.map(
                      (link, idx) => (
                        <p key={idx} className="activity-info-link">
                          <a href={link} target="_blank">
                            {link}
                          </a>
                          <MdLinkOff
                            className="remove-link-icon"
                            onClick={() =>
                              setCreateActivityBody((prev) => {
                                const newInfoLinks =
                                  prev?.activity_info_links?.filter(
                                    (_, i) => i !== idx
                                  );
                                return {
                                  ...prev,
                                  activity_info_links: newInfoLinks,
                                };
                              })
                            }
                          />
                        </p>
                      )
                    )}
                  </div>
                </>
              ) : null}

              <label htmlFor="">Enter optional activity info links</label>
              <input
                id="overlay-activity-add-info-links"
                type="text"
                className="overlay-activity-add-info-links"
                value={newActivityInfoLink}
                onChange={(e) => setNewActivityInfoLink(e.target.value)}
              />
              <button
                type="button"
                className="add-links-btn"
                disabled={!newActivityInfoLink}
              >
                <MdAddLink
                  onClick={() => {
                    setCreateActivityBody((prev) => {
                      return {
                        ...prev,
                        activity_info_links: [
                          ...(prev?.activity_info_links ?? []),
                          newActivityInfoLink,
                        ],
                      };
                    });
                    setNewActivityInfoLink("");
                  }}
                />
              </button>
              <label htmlFor="create-activity-semester">
                Select activity semester
              </label>
              <select
                id="create-activity-semester"
                value={createActivityBody?.activity_semester}
                onChange={(e) =>
                  setCreateActivityBody((prev) => {
                    return {
                      ...prev,
                      activity_semester: e.target.value,
                    };
                  })
                }
              >
                <option value=""></option>
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
              </select>

              <label htmlFor="create-activity-year">Select activity year</label>
              <select
                id="create-activity-year"
                value={createActivityBody?.activity_year}
                onChange={(e) =>
                  setCreateActivityBody((prev) => {
                    return {
                      ...prev,
                      activity_year: e.target.value,
                    };
                  })
                }
              >
                <option value=""></option>
                <option value="First">First</option>
                <option value="Second">Second</option>
                <option value="Third">Third</option>
                <option value="Fourth">Fourth</option>
              </select>
              {createActivityError && (
                <div className="error">{createActivityError}</div>
              )}

              <button type="submit" className="create-course-btn">
                <MdPlaylistAdd className="confirm-create-course-icon" /> Create
              </button>
            </form>
          </div>
        </div>
      )}
      <Tooltip id="create-activity" place="top" />
      <IoAddCircle
        data-tooltip-id="create-activity"
        data-tooltip-content="Create new activity"
        className="create-activity-icon"
        onClick={() => setCreateActivityOverlay(true)}
      />
    </div>
  );
}

export default AdminActivities;
