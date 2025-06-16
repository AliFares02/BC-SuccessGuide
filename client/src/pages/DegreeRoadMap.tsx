import { API_BASE_URL } from "../api/config";
import axios from "axios";
import { useEffect, useState } from "react";
import { FcHighPriority, FcLowPriority } from "react-icons/fc";
import { HiMiniMinus } from "react-icons/hi2";
import {
  MdOutlineEditNote,
  MdOutlinePlaylistAdd,
  MdOutlinePlaylistAddCheck,
  MdOutlinePlaylistRemove,
} from "react-icons/md";
import { RiExternalLinkLine } from "react-icons/ri";
import { toast } from "react-toastify";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import useAuthContext from "../hooks/useAuthContext";
import { getCurrentSemesterWithYear } from "../utils/getCurrentSemesterWithYear";
import alumniDestination from "../utils/alumniDestination.json";
import organizations from "../utils/organizations.json";
import useLogout from "../hooks/useLogout";

function DegreeRoadMap() {
  const { user, tkFetchLoading } = useAuthContext();
  const { logout } = useLogout();
  const currentSemesterWYr = getCurrentSemesterWithYear();
  const [studentYr, setStudentYr] = useState("");
  const [parsedActivities, setParsedActivities] = useState<{
    [key: string]: Activity[];
  }>({});
  const [maxTableRows, setMaxTableRows] = useState(0);
  const [selectedNoteComment, setSelectedNoteComment] = useState<{
    activityCategory: ActivityCategoryIdx;
    activityId: string;
    comment?: string;
  } | null>(null);
  const [newNoteBody, setNewNoteBody] = useState<{
    activityCategory: ActivityCategoryIdx;
    activityId: string;
    comment?: string;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [numOfActivitiesCompleted, setNumOfActivitiesCompleted] = useState(0);
  const [numOfTotalActivities, setNumOfTotalActivities] = useState(0);

  const department = user?.department as keyof typeof organizations;
  const categories = Object.keys(organizations[department]);

  const selectedCategoryName = categories[
    selectedCategory
  ] as keyof (typeof organizations)[typeof department];
  const items = organizations[department][selectedCategoryName] as string[];

  useEffect(() => {
    if (!tkFetchLoading && user?.access) {
      getStudentYear();
    }
  }, []);

  useEffect(() => {
    if (studentYr) {
      getActivities();
    }
  }, [studentYr]);

  useEffect(() => {
    if (selectedNoteComment) {
      setNewNoteBody(selectedNoteComment);
    }
  }, [selectedNoteComment]);

  async function getStudentYear() {
    axios
      .get(`${API_BASE_URL}/api/users/account/year`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) => {
        setStudentYr(response.data.studentYear);
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

  interface Activity {
    activity: {
      activity_category: string;
      activity_description: string;
      activity_priority: number;
      activity_info_links: string[];
      activity_semester: string;
      activity_year: string;
      _id: string;
    };
    comment?: string;
    status?: "completed" | "in-progress" | undefined;
  }

  type ActivityCategoryIdx =
    | "College Life"
    | "Expand Your Horizons"
    | "Pathway to Success";

  function parseActivities(activities: Activity[]) {
    setNumOfTotalActivities(activities.length);
    const parsedActivities = {
      "College Life": [] as Activity[],
      "Expand Your Horizons": [] as Activity[],
      "Pathway to Success": [] as Activity[],
    };
    activities.forEach((activity) => {
      parsedActivities[
        activity.activity.activity_category as ActivityCategoryIdx
      ].push(activity);
    });
    Object.values(parsedActivities)?.map((activityArr) => {
      return activityArr.sort(
        (activityA, activityB) =>
          activityA.activity.activity_priority -
          activityB.activity.activity_priority
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

  async function getActivities() {
    axios
      .get(`${API_BASE_URL}/api/activities/student-activities/${studentYr}`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) => {
        setNumOfActivitiesCompleted(response.data.numOfSemActivitiesCompleted);
        parseActivities(response.data.combinedActivites);
      })
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

  async function handleUpdateActivity(
    modificationType: string,
    activityId: string,
    activityCategory: ActivityCategoryIdx
  ) {
    switch (modificationType) {
      case "save":
        axios
          .patch(
            `${API_BASE_URL}/api/users/student-activities/update-activity/${activityId}`,
            {
              modificationType: "save",
              comment: newNoteBody?.comment,
            },
            {
              headers: {
                Authorization: `Bearer ${user?.access}`,
              },
            }
          )
          .then((response) => {
            setParsedActivities((prev) => {
              const updatedParsedActivities = prev[activityCategory]?.map(
                (activity) =>
                  activity.activity._id === activityId
                    ? { ...activity, comment: response.data.activity.comment }
                    : activity
              );

              return {
                ...prev,
                [activityCategory]: updatedParsedActivities,
              };
            });
            setNewNoteBody((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                comment: response.data.activity.comment,
              };
            });
            toast.success(response.data.msg);
            setSelectedNoteComment(null);
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
            `${API_BASE_URL}/api/users/student-activities/update-activity/${activityId}`,
            {
              modificationType: "delete",
            },
            {
              headers: {
                Authorization: `Bearer ${user?.access}`,
              },
            }
          )
          .then((response) => {
            setParsedActivities((prev) => {
              const updatedParsedActivities = prev[activityCategory]?.map(
                (activity) =>
                  activity.activity._id === activityId
                    ? { ...activity, comment: undefined }
                    : activity
              );

              return {
                ...prev,
                [activityCategory]: updatedParsedActivities,
              };
            });
            setNewNoteBody((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                comment: undefined,
              };
            });
            toast.success(response.data.msg);
            setSelectedNoteComment(null);
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
      case "status-complete":
        axios
          .patch(
            `${API_BASE_URL}/api/users/student-activities/update-activity/${activityId}`,
            {
              modificationType: "status-complete",
            },
            {
              headers: {
                Authorization: `Bearer ${user?.access}`,
              },
            }
          )
          .then((response) => {
            setParsedActivities((prev) => {
              const updatedParsedActivities = prev[activityCategory]?.map(
                (activity) =>
                  activity.activity._id === activityId
                    ? { ...activity, status: "completed" as const }
                    : activity
              );

              return {
                ...prev,
                [activityCategory]: updatedParsedActivities,
              };
            });
            setNumOfActivitiesCompleted((prev) => prev + 1);
            toast.success(response.data.msg);
            setSelectedNoteComment(null);
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
      default:
    }
  }

  async function handleAddActivity(
    activityCategory: ActivityCategoryIdx,
    activityId: string
  ) {
    axios
      .post(
        `${API_BASE_URL}/api/users/student-activities/add-activity/${activityId}`,
        {
          status: "in-progress",
        },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        setParsedActivities((prev) => {
          const updatedParsedActivities = prev[activityCategory]?.map(
            (activity) =>
              activity.activity._id === activityId
                ? { ...activity, status: "in-progress" as const }
                : activity
          );

          return {
            ...prev,
            [activityCategory]: updatedParsedActivities,
          };
        });
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

  async function handleDeleteActivity(
    activityCategory: ActivityCategoryIdx,
    activityId: string
  ) {
    axios
      .delete(
        `${API_BASE_URL}/api/users/student-activities/delete-activity/${activityId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        setParsedActivities((prev) => {
          const updatedParsedActivities = prev[activityCategory]?.map(
            (activity) =>
              activity.activity._id === activityId
                ? { ...activity, status: undefined, comment: undefined }
                : activity
          );

          return {
            ...prev,
            [activityCategory]: updatedParsedActivities,
          };
        });
        setNumOfActivitiesCompleted((prev) => prev - 1);
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
  return (
    <div className="degree-roadmap-container">
      <h1 className="page-title">Degree RoadMap</h1>
      <div className="degree-roadmap-subcontainer">
        <p className="page-sub-title" style={{ margin: ".5rem auto 0 auto" }}>
          {currentSemesterWYr} Activities
        </p>
        <div className="semester-activities-table-wrapper">
          <table className="semester-activities-table">
            <thead>
              <tr>
                <th>College Life</th>
                <th>Expand Your Horizons</th>
                <th>Pathway to Success</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxTableRows })?.map((_, i) => (
                <tr key={i}>
                  <td>
                    <div className="activity-td-wrapper">
                      <div className="activity-prio-and-status-wrapper">
                        {parsedActivities["College Life"][i]?.activity
                          ?.activity_description &&
                          (parsedActivities["College Life"][i]?.activity
                            .activity_priority == 1 ? (
                            <>
                              <Tooltip
                                id="high-college-life-activity-priority"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <FcHighPriority
                                data-tooltip-id="high-college-life-activity-priority"
                                data-tooltip-content="High priority"
                                className="priority-icon"
                              />
                            </>
                          ) : (
                            <>
                              <Tooltip
                                id="low-college-life-activity-priority"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <FcLowPriority
                                data-tooltip-id="low-college-life-activity-priority"
                                data-tooltip-content="Low priority"
                                className="priority-icon"
                              />
                            </>
                          ))}
                        {parsedActivities["College Life"][i]?.status ===
                        "completed" ? (
                          <strong className="activity-completed-medal">
                            🎖️
                          </strong>
                        ) : null}
                      </div>

                      <div className="activity-description-wrapper">
                        {parsedActivities["College Life"][i]?.activity
                          ?.activity_description && (
                          <p className="activity-description">
                            {
                              parsedActivities["College Life"][i]?.activity
                                ?.activity_description
                            }
                          </p>
                        )}
                      </div>
                      {parsedActivities["College Life"][i]?.activity
                        .activity_info_links &&
                      parsedActivities["College Life"][i]?.activity
                        .activity_info_links.length > 0 ? (
                        <div>
                          {parsedActivities["College Life"][
                            i
                          ]?.activity.activity_info_links?.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target={"_blank"}
                              style={{ textDecoration: "none" }}
                            >
                              <RiExternalLinkLine
                                style={{
                                  fontSize: "1.1rem",
                                  color: "rgb(136, 35, 70)",
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {parsedActivities["College Life"][i]?.activity
                        ?.activity_description ? (
                        <div className="activity-tools">
                          {parsedActivities["College Life"][i]?.status ===
                          undefined ? (
                            <>
                              <Tooltip
                                id="mark-in-progress-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistAdd
                                data-tooltip-id="mark-in-progress-activity"
                                data-tooltip-content="Mark as in progress"
                                className="activity-tool-icon add-inprog-activity-icon"
                                onClick={() =>
                                  handleAddActivity(
                                    "College Life",
                                    parsedActivities["College Life"][i]
                                      ?.activity._id
                                  )
                                }
                              />
                            </>
                          ) : parsedActivities["College Life"][i]?.status ===
                            "in-progress" ? (
                            <>
                              <Tooltip
                                id="mark-complete-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistAddCheck
                                data-tooltip-id="mark-complete-activity"
                                data-tooltip-content="Mark as completed"
                                className="activity-tool-icon add-activity-icon"
                                onClick={() =>
                                  handleUpdateActivity(
                                    "status-complete",
                                    parsedActivities["College Life"][i]
                                      ?.activity._id,
                                    "College Life"
                                  )
                                }
                              />
                              <Tooltip
                                id="undo-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistRemove
                                data-tooltip-id="undo-activity"
                                data-tooltip-content="Undo activity"
                                className="activity-tool-icon remove-activity-icon"
                                onClick={() =>
                                  handleDeleteActivity(
                                    "College Life",
                                    parsedActivities["College Life"][i]
                                      ?.activity._id
                                  )
                                }
                              />
                              <Tooltip
                                id="edit-activity-comment"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlineEditNote
                                data-tooltip-id="edit-activity-comment"
                                data-tooltip-content="Edit activity comment"
                                className="activity-tool-icon edit-note"
                                onClick={() =>
                                  setSelectedNoteComment({
                                    activityCategory: "College Life",
                                    activityId:
                                      parsedActivities["College Life"][i]
                                        ?.activity?._id,
                                    comment:
                                      parsedActivities["College Life"][i]
                                        ?.comment,
                                  })
                                }
                              />
                            </>
                          ) : (
                            <>
                              <Tooltip
                                id="undo-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistRemove
                                data-tooltip-id="undo-activity"
                                data-tooltip-content="Undo activity"
                                className="activity-tool-icon remove-activity-icon"
                                onClick={() =>
                                  handleDeleteActivity(
                                    "College Life",
                                    parsedActivities["College Life"][i]
                                      ?.activity._id
                                  )
                                }
                              />{" "}
                              <Tooltip
                                id="edit-activity-comment"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlineEditNote
                                data-tooltip-id="edit-activity-comment"
                                data-tooltip-content="Edit activity comment"
                                className="activity-tool-icon edit-note"
                                onClick={() =>
                                  setSelectedNoteComment({
                                    activityCategory: "College Life",
                                    activityId:
                                      parsedActivities["College Life"][i]
                                        ?.activity?._id,
                                    comment:
                                      parsedActivities["College Life"][i]
                                        ?.comment,
                                  })
                                }
                              />
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div className="activity-td-wrapper">
                      <div className="activity-prio-and-status-wrapper">
                        {parsedActivities["Expand Your Horizons"][i]?.activity
                          ?.activity_description &&
                          (parsedActivities["Expand Your Horizons"][i]?.activity
                            .activity_priority == 1 ? (
                            <>
                              <Tooltip
                                id="high-expand-horizons-activity-priority"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <FcHighPriority
                                data-tooltip-id="high-expand-horizons-activity-priority"
                                data-tooltip-content="High priority"
                                className="priority-icon"
                              />
                            </>
                          ) : (
                            <>
                              <Tooltip
                                id="low-expand-horizons-activity-priority"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <FcLowPriority
                                data-tooltip-id="low-expand-horizons-activity-priority"
                                data-tooltip-content="Low priority"
                                className="priority-icon"
                              />
                            </>
                          ))}
                        {parsedActivities["Expand Your Horizons"][i]?.status ===
                        "completed" ? (
                          <strong className="activity-completed-medal">
                            🎖️
                          </strong>
                        ) : null}
                      </div>

                      <div className="activity-description-wrapper">
                        {parsedActivities["Expand Your Horizons"][i]?.activity
                          ?.activity_description && (
                          <p className="activity-description">
                            {
                              parsedActivities["Expand Your Horizons"][i]
                                ?.activity?.activity_description
                            }
                          </p>
                        )}
                      </div>
                      {parsedActivities["Expand Your Horizons"][i]?.activity
                        .activity_info_links &&
                      parsedActivities["Expand Your Horizons"][i]?.activity
                        .activity_info_links.length > 0 ? (
                        <div>
                          {parsedActivities["Expand Your Horizons"][
                            i
                          ]?.activity.activity_info_links?.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target={"_blank"}
                              style={{ textDecoration: "none" }}
                            >
                              <RiExternalLinkLine
                                style={{
                                  fontSize: "1.1rem",
                                  color: "rgb(136, 35, 70)",
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {parsedActivities["Expand Your Horizons"][i]?.activity
                        ?.activity_description ? (
                        <div className="activity-tools">
                          {parsedActivities["Expand Your Horizons"][i]
                            ?.status === undefined ? (
                            <>
                              <Tooltip
                                id="mark-in-progress-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistAdd
                                data-tooltip-id="mark-in-progress-activity"
                                data-tooltip-content="Mark as in progress"
                                className="activity-tool-icon add-inprog-activity-icon"
                                onClick={() =>
                                  handleAddActivity(
                                    "Expand Your Horizons",
                                    parsedActivities["Expand Your Horizons"][i]
                                      ?.activity._id
                                  )
                                }
                              />
                            </>
                          ) : parsedActivities["Expand Your Horizons"][i]
                              ?.status === "in-progress" ? (
                            <>
                              <Tooltip
                                id="mark-complete-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistAddCheck
                                data-tooltip-id="mark-complete-activity"
                                data-tooltip-content="Mark as completed"
                                className="activity-tool-icon add-activity-icon"
                                onClick={() =>
                                  handleUpdateActivity(
                                    "status-complete",
                                    parsedActivities["Expand Your Horizons"][i]
                                      ?.activity._id,
                                    "Expand Your Horizons"
                                  )
                                }
                              />
                              <Tooltip
                                id="undo-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistRemove
                                data-tooltip-id="undo-activity"
                                data-tooltip-content="Undo activity"
                                className="activity-tool-icon remove-activity-icon"
                                onClick={() =>
                                  handleDeleteActivity(
                                    "Expand Your Horizons",
                                    parsedActivities["Expand Your Horizons"][i]
                                      ?.activity._id
                                  )
                                }
                              />
                              <Tooltip
                                id="edit-activity-comment"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlineEditNote
                                data-tooltip-id="edit-activity-comment"
                                data-tooltip-content="Edit activity comment"
                                className="activity-tool-icon edit-note"
                                onClick={() =>
                                  setSelectedNoteComment({
                                    activityCategory: "Expand Your Horizons",
                                    activityId:
                                      parsedActivities["Expand Your Horizons"][
                                        i
                                      ]?.activity?._id,
                                    comment:
                                      parsedActivities["Expand Your Horizons"][
                                        i
                                      ]?.comment,
                                  })
                                }
                              />
                            </>
                          ) : (
                            <>
                              <Tooltip
                                id="undo-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistRemove
                                data-tooltip-id="undo-activity"
                                data-tooltip-content="Undo activity"
                                className="activity-tool-icon remove-activity-icon"
                                onClick={() =>
                                  handleDeleteActivity(
                                    "Expand Your Horizons",
                                    parsedActivities["Expand Your Horizons"][i]
                                      ?.activity._id
                                  )
                                }
                              />{" "}
                              <Tooltip
                                id="edit-activity-comment"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlineEditNote
                                data-tooltip-id="edit-activity-comment"
                                data-tooltip-content="Edit activity comment"
                                className="activity-tool-icon edit-note"
                                onClick={() =>
                                  setSelectedNoteComment({
                                    activityCategory: "Expand Your Horizons",
                                    activityId:
                                      parsedActivities["Expand Your Horizons"][
                                        i
                                      ]?.activity?._id,
                                    comment:
                                      parsedActivities["Expand Your Horizons"][
                                        i
                                      ]?.comment,
                                  })
                                }
                              />
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div className="activity-td-wrapper">
                      <div className="activity-prio-and-status-wrapper">
                        {parsedActivities["Pathway to Success"][i]?.activity
                          ?.activity_description &&
                          (parsedActivities["Pathway to Success"][i]?.activity
                            .activity_priority == 1 ? (
                            <>
                              <Tooltip
                                id="high-pathway-activity-priority"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <FcHighPriority
                                data-tooltip-id="high-pathway-activity-priority"
                                data-tooltip-content="High priority"
                                className="priority-icon"
                              />
                            </>
                          ) : (
                            <>
                              <Tooltip
                                id="low-pathway-activity-priority"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <FcLowPriority
                                data-tooltip-id="low-pathway-activity-priority"
                                data-tooltip-content="Low priority"
                                className="priority-icon"
                              />
                            </>
                          ))}
                        {parsedActivities["Pathway to Success"][i]?.status ===
                        "completed" ? (
                          <strong className="activity-completed-medal">
                            🎖️
                          </strong>
                        ) : null}
                      </div>

                      <div className="activity-description-wrapper">
                        {parsedActivities["Pathway to Success"][i]?.activity
                          ?.activity_description && (
                          <p className="activity-description">
                            {
                              parsedActivities["Pathway to Success"][i]
                                ?.activity?.activity_description
                            }
                          </p>
                        )}
                      </div>
                      {parsedActivities["Pathway to Success"][i]?.activity
                        .activity_info_links &&
                      parsedActivities["Pathway to Success"][i]?.activity
                        .activity_info_links.length > 0 ? (
                        <div>
                          {parsedActivities["Pathway to Success"][
                            i
                          ]?.activity.activity_info_links?.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target={"_blank"}
                              style={{ textDecoration: "none" }}
                            >
                              <RiExternalLinkLine
                                style={{
                                  fontSize: "1.1rem",
                                  color: "rgb(136, 35, 70)",
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {parsedActivities["Pathway to Success"][i]?.activity
                        ?.activity_description ? (
                        <div className="activity-tools">
                          {parsedActivities["Pathway to Success"][i]?.status ===
                          undefined ? (
                            <>
                              <Tooltip
                                id="mark-in-progress-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistAdd
                                data-tooltip-id="mark-in-progress-activity"
                                data-tooltip-content="Mark as in progress"
                                className="activity-tool-icon add-inprog-activity-icon"
                                onClick={() =>
                                  handleAddActivity(
                                    "Pathway to Success",
                                    parsedActivities["Pathway to Success"][i]
                                      ?.activity._id
                                  )
                                }
                              />
                            </>
                          ) : parsedActivities["Pathway to Success"][i]
                              ?.status === "in-progress" ? (
                            <>
                              <Tooltip
                                id="mark-complete-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistAddCheck
                                data-tooltip-id="mark-complete-activity"
                                data-tooltip-content="Mark as completed"
                                className="activity-tool-icon add-activity-icon"
                                onClick={() =>
                                  handleUpdateActivity(
                                    "status-complete",
                                    parsedActivities["Pathway to Success"][i]
                                      ?.activity._id,
                                    "Pathway to Success"
                                  )
                                }
                              />
                              <Tooltip
                                id="undo-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistRemove
                                data-tooltip-id="undo-activity"
                                data-tooltip-content="Undo activity"
                                className="activity-tool-icon remove-activity-icon"
                                onClick={() =>
                                  handleDeleteActivity(
                                    "Pathway to Success",
                                    parsedActivities["Pathway to Success"][i]
                                      ?.activity._id
                                  )
                                }
                              />
                              <Tooltip
                                id="edit-activity-comment"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlineEditNote
                                data-tooltip-id="edit-activity-comment"
                                data-tooltip-content="Edit activity comment"
                                className="activity-tool-icon edit-note"
                                onClick={() =>
                                  setSelectedNoteComment({
                                    activityCategory: "Pathway to Success",
                                    activityId:
                                      parsedActivities["Pathway to Success"][i]
                                        ?.activity?._id,
                                    comment:
                                      parsedActivities["Pathway to Success"][i]
                                        ?.comment,
                                  })
                                }
                              />
                            </>
                          ) : (
                            <>
                              <Tooltip
                                id="undo-activity"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlinePlaylistRemove
                                data-tooltip-id="undo-activity"
                                data-tooltip-content="Undo activity"
                                className="activity-tool-icon remove-activity-icon"
                                onClick={() =>
                                  handleDeleteActivity(
                                    "Pathway to Success",
                                    parsedActivities["Pathway to Success"][i]
                                      ?.activity._id
                                  )
                                }
                              />{" "}
                              <Tooltip
                                id="edit-activity-comment"
                                place="top"
                                style={{ zIndex: "10" }}
                              />
                              <MdOutlineEditNote
                                data-tooltip-id="edit-activity-comment"
                                data-tooltip-content="Edit activity comment"
                                className="activity-tool-icon edit-note"
                                onClick={() =>
                                  setSelectedNoteComment({
                                    activityCategory: "Pathway to Success",
                                    activityId:
                                      parsedActivities["Pathway to Success"][i]
                                        ?.activity?._id,
                                    comment:
                                      parsedActivities["Pathway to Success"][i]
                                        ?.comment,
                                  })
                                }
                              />
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedNoteComment && (
            <div
              className="note-overlay-wrapper"
              onMouseDown={(e) => {
                if (!(e.target as HTMLElement).closest(".note-overlay")) {
                  setSelectedNoteComment(null);
                }
              }}
            >
              <div
                className="note-overlay"
                onClick={(e) => e.stopPropagation()}
              >
                <HiMiniMinus
                  className="minimize-note-icon"
                  onClick={() => setSelectedNoteComment(null)}
                />
                <p className="note-title">Activity comment</p>
                <textarea
                  value={newNoteBody?.comment ?? ""}
                  onChange={(e) =>
                    setNewNoteBody({
                      activityCategory: selectedNoteComment.activityCategory,
                      activityId: selectedNoteComment.activityId!,
                      comment: e.target.value,
                    })
                  }
                >
                  {selectedNoteComment.comment}
                </textarea>
                <div className="btn-wrapper">
                  <button
                    disabled={
                      JSON.stringify(selectedNoteComment) ===
                        JSON.stringify(newNoteBody) ||
                      !newNoteBody?.comment?.trim()
                    }
                    className="save-note-btn"
                    onClick={() =>
                      handleUpdateActivity(
                        "save",
                        selectedNoteComment.activityId,
                        selectedNoteComment.activityCategory
                      )
                    }
                  >
                    Save
                  </button>
                  <button
                    className="delete-note-btn"
                    onClick={() =>
                      handleUpdateActivity(
                        "delete",
                        selectedNoteComment.activityId,
                        selectedNoteComment.activityCategory
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
        <div className="activity-progress-tracker">
          {numOfTotalActivities > 0 &&
          numOfActivitiesCompleted === numOfTotalActivities ? (
            <>
              <label htmlFor="activities-completed">
                All semester activities completed!
              </label>
              <strong className="activities-completed-medal">🎖️</strong>
            </>
          ) : (
            <>
              <label htmlFor="activities-completed">
                Semester activities completed
              </label>
              <p id="activities-completed" className="activities-completed">
                {numOfActivitiesCompleted}/{numOfTotalActivities}
              </p>
            </>
          )}
        </div>
        <div className="alumni-destination-container">
          <h2 className="page-sub-title">
            Alumni Destinations: Careers & Grad programs
          </h2>
          <div className="alumni-sub-container">
            <div>
              <p className="section-sub-title">Careers</p>
              <ul>
                {alumniDestination &&
                  alumniDestination[
                    user?.department as keyof typeof alumniDestination
                  ]?.careers?.map((career, idx) => <li key={idx}>{career}</li>)}
              </ul>
            </div>

            <div>
              <p className="section-sub-title">Graduate Programs</p>
              <ul>
                {alumniDestination &&
                  alumniDestination[
                    user?.department as keyof typeof alumniDestination
                  ]?.graduatePrograms?.map((prog, idx) => (
                    <li key={idx}>{prog}</li>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="organizations-container">
          <h2 className="page-sub-title">What you can do with your degree</h2>
          <p className="section-sub-title">Organizations you can join</p>
          <div className="tabs-wrapper">
            <div className="tabs">
              {categories?.map((category, idx) => (
                <label
                  key={idx}
                  className={`tab ${
                    selectedCategory === idx ? "selected" : ""
                  }`}
                  onClick={() => setSelectedCategory(idx)}
                >
                  {category}
                </label>
              ))}
            </div>
            <div className="tab-categories">
              <ul>
                {items && items.length > 0 ? (
                  items?.map((item, idx) => <li key={idx}>&#8640; {item}</li>)
                ) : (
                  <li>No items available</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DegreeRoadMap;
