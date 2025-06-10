import { API_BASE_URL } from "../api/config";
import { Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  MdCancel,
  MdOutlinePlaylistAdd,
  MdOutlinePlaylistRemove,
  MdInfo,
} from "react-icons/md";
import { toast } from "react-toastify";
import useAuthContext from "../hooks/useAuthContext";
import ConcentrationCourseNode from "./ConcentrationCourseNode";
import { Tooltip } from "react-tooltip";

interface BaseCourse {
  grade?: string;
  semesterTaken?: string;
  status?: "taken" | "in-progress";
}

type AfstCourse = BaseCourse & {
  deptCourse: {
    course_code: string;
    course_credits: string;
    course_department: string;
    course_description: string;
    course_name: string;
    isAfstIntroductory: boolean;
    afstGroup: string;
    isAfstSeminar: boolean;
  };
};
type Course = BaseCourse & {
  concentrationCourse: {
    course_code: string;
    course_credits: string;
    course_department: string;
    course_description: string;
    course_name: string;
    concentration?: string;
    concentration_area?: string;
  };
};

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

const gridSpacingX = 200;
const gridSpacingY = 100;
const columns = 4;

function ConcentrationFlowChart({
  concentrationFlowchartCourses,
}: {
  concentrationFlowchartCourses: Course[] | AfstCourse[];
}) {
  const [optimisticUIFlowChartCourses, setOptimisticUIFlowChartCourses] =
    useState<(Course | AfstCourse)[]>([]);
  const [selectedCourseNode, setSelectedCourseNode] = useState<
    Course | AfstCourse | null
  >(null);
  const [selectedConcentration, setSelectedConcentration] = useState(
    "Interpersonal and Intercultural Communication"
  );
  const [selectedConcentrationArea, setSelectedConcentrationArea] =
    useState("Culture");

  const [selectedAFSTGroup, setSelectedAFSTGroup] = useState<
    string | "Introductory" | "a" | "b" | "c" | "Seminar/Independent study"
  >("Introductory");
  const { user } = useAuthContext();

  useEffect(() => {
    setOptimisticUIFlowChartCourses(concentrationFlowchartCourses);
  }, [concentrationFlowchartCourses]);

  useEffect(() => {
    if (!user) {
      setOptimisticUIFlowChartCourses(concentrationFlowchartCourses);
      return;
    }

    if (user.department === "Communication") {
      if (selectedConcentration && selectedConcentrationArea) {
        const filtered = concentrationFlowchartCourses.filter(
          (course): course is Course =>
            "concentrationCourse" in course &&
            course.concentrationCourse.concentration ===
              selectedConcentration &&
            course.concentrationCourse.concentration_area ===
              selectedConcentrationArea
        );
        setOptimisticUIFlowChartCourses(filtered);
      } else {
        setOptimisticUIFlowChartCourses([]);
      }
    } else if (user.department === "Africana Studies") {
      if (selectedAFSTGroup) {
        let filterType:
          | ""
          | "isAfstIntroductory"
          | "afstGroup"
          | "isAfstSeminar" = "";
        let filter: any = null;

        switch (selectedAFSTGroup) {
          case "Introductory":
            filterType = "isAfstIntroductory";
            filter = true;
            break;
          case "a":
          case "b":
          case "c":
            filterType = "afstGroup";
            filter = selectedAFSTGroup;
            break;
          case "Seminar/Independent study":
            filterType = "isAfstSeminar";
            filter = true;
            break;
          default:
            setOptimisticUIFlowChartCourses([]);
            return;
        }

        const filtered = concentrationFlowchartCourses.filter(
          (course): course is AfstCourse =>
            "deptCourse" in course && course.deptCourse[filterType] === filter
        );
        setOptimisticUIFlowChartCourses(filtered);
      } else {
        setOptimisticUIFlowChartCourses([]);
      }
    } else {
      setOptimisticUIFlowChartCourses(concentrationFlowchartCourses);
    }
  }, [
    user,
    concentrationFlowchartCourses,
    selectedConcentration,
    selectedConcentrationArea,
    selectedAFSTGroup,
  ]);

  function isAfstCourse(course: Course | AfstCourse): course is AfstCourse {
    return "deptCourse" in course;
  }

  function handleNodeClick(course: Course | AfstCourse): void {
    setSelectedCourseNode(course);
  }

  const positionedCourses = optimisticUIFlowChartCourses?.map((course, idx) => {
    const col = idx % columns;
    const row = Math.floor(idx / columns);

    if (isAfstCourse(course)) {
      return {
        id: course.deptCourse.course_code,
        data: {
          course_code: course.deptCourse.course_code,
          course_description: course.deptCourse.course_description,
          ...(course.status && { status: course.status }),
          onClick: () => handleNodeClick(course),
        },
        type: "custom",
        position: { x: col * gridSpacingX, y: row * gridSpacingY },
      };
    }

    return {
      id: course.concentrationCourse.course_code,
      data: {
        course_code: course.concentrationCourse.course_code,
        course_description: course.concentrationCourse.course_description,
        ...(course.status && { status: course.status }),
        onClick: () => handleNodeClick(course),
      },
      type: "custom",
      position: { x: col * gridSpacingX, y: row * gridSpacingY },
    };
  });

  async function addCurrentCourse(courseCode: string) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/users/current-courses/add`,
        { courseCode },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      );

      const updatedUICourses = optimisticUIFlowChartCourses?.map((course) => {
        if (
          "concentrationCourse" in course &&
          course.concentrationCourse.course_code === response.data.courseCode
        ) {
          return { ...course, status: "in-progress" as const };
        } else if (
          "deptCourse" in course &&
          course.deptCourse.course_code === response.data.courseCode
        ) {
          return { ...course, status: "in-progress" as const };
        }
        return course;
      });
      setOptimisticUIFlowChartCourses(updatedUICourses);
      setSelectedCourseNode(null);
      toast.success(response.data.msg);
    } catch (error: any) {
      toast.error(error?.response?.data?.msg || "Failed to add course");
    }
  }

  async function removeCurrentCourse(courseCode: string) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/users/current-courses/remove/${courseCode}`,
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      );

      const updatedUICourses = optimisticUIFlowChartCourses?.map((course) => {
        if (
          "concentrationCourse" in course &&
          course.concentrationCourse.course_code === response.data.courseCode
        ) {
          return { ...course, status: undefined };
        } else if (
          "deptCourse" in course &&
          course.deptCourse.course_code === response.data.courseCode
        ) {
          return { ...course, status: undefined };
        }
        return course;
      });
      setOptimisticUIFlowChartCourses(updatedUICourses);
      setSelectedCourseNode(null);
      toast.success(response.data.msg);
    } catch (error: any) {
      toast.error(error?.response?.data?.msg || "Failed to remove course");
    }
  }

  return (
    <div className="concentration-flowchart-wrapper">
      {user?.department === "Communication" && (
        <div className="concentration-flowchart-options-wrapper">
          <label htmlFor="concentration-select">Select Concentration</label>
          <select
            id="concentration-select"
            value={selectedConcentration}
            onChange={(e) => {
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

          <label htmlFor="concentration-area-select">Concentration area</label>
          <select
            id="concentration-area-select"
            value={selectedConcentrationArea}
            onChange={(e) => setSelectedConcentrationArea(e.target.value)}
            disabled={!selectedConcentration}
          >
            <option value=""></option>
            {selectedConcentration &&
              validConcentrationAreas[selectedConcentration]?.map(
                (concentration, idx) => (
                  <option key={idx} value={concentration}>
                    {concentration}
                  </option>
                )
              )}
          </select>
        </div>
      )}
      {user?.department === "Africana Studies" && (
        <div className="concentration-flowchart-options-wrapper">
          <label htmlFor="afst-group-select">Select Group</label>
          <select
            id="afst-group-select"
            value={selectedAFSTGroup}
            onChange={(e) => {
              setSelectedAFSTGroup(e.target.value);
            }}
          >
            <option value=""></option>
            <option value="Introductory">Introductory</option>
            <option value="a">History and political science</option>
            <option value="b">Literature, culture, and the arts</option>
            <option value="c">Society and the economy</option>
            <option value="Seminar/Independent study">
              Seminar/Independent study
            </option>
          </select>
        </div>
      )}
      {user?.department === "Communication" && (
        <>
          <Tooltip
            id="concentration-more-info-icon"
            place="top"
            style={{ zIndex: "1000", whiteSpace: "normal", maxWidth: "250px" }}
          />
          <MdInfo
            data-tooltip-id="concentration-more-info-icon"
            data-tooltip-content="Select one concentration and area to view courses. You must complete one course per area within your chosen concentration."
            className="more-info-btn-icon"
          />
        </>
      )}
      {user?.department === "Africana Studies" && (
        <>
          <Tooltip
            id="concentration-more-info-icon"
            place="top"
            style={{ zIndex: "1000", whiteSpace: "normal", maxWidth: "250px" }}
          />
          <MdInfo
            data-tooltip-id="concentration-more-info-icon"
            data-tooltip-content="Take 2 Intro courses, 12 credits from one group, at least 2 courses from other groups, and one seminar/independent study."
            className="more-info-btn-icon"
          />
        </>
      )}

      <ReactFlow
        nodes={positionedCourses}
        fitView
        nodeTypes={{ custom: ConcentrationCourseNode }}
      >
        <Controls showInteractive={false} />
      </ReactFlow>
      {selectedCourseNode && (
        <div
          className="flowchart-course-overlay-wrapper"
          onClick={() => setSelectedCourseNode(null)}
        >
          <div
            className="flowchart-course-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <MdCancel
              className="cancel-flowchart-course-overlay-icon"
              onClick={() => setSelectedCourseNode(null)}
            />
            <p className="course-title">
              {"concentrationCourse" in selectedCourseNode
                ? `${selectedCourseNode.concentrationCourse.course_code} - ${selectedCourseNode.concentrationCourse.course_name}`
                : `${selectedCourseNode.deptCourse.course_code} - ${selectedCourseNode.deptCourse.course_name}`}
            </p>
            <div className="flowchart-course-overlay-contents">
              <p className="course-description">
                {"concentrationCourse" in selectedCourseNode
                  ? selectedCourseNode.concentrationCourse.course_description
                  : selectedCourseNode.deptCourse.course_description}
              </p>
              <div className="course-credits">
                Credits:{" "}
                {"concentrationCourse" in selectedCourseNode
                  ? selectedCourseNode.concentrationCourse.course_credits
                  : selectedCourseNode.deptCourse.course_credits}
              </div>
              <div className="course-department">
                Department:{" "}
                {"concentrationCourse" in selectedCourseNode
                  ? selectedCourseNode.concentrationCourse.course_department
                  : selectedCourseNode.deptCourse.course_department}
              </div>
              {selectedCourseNode.status === "in-progress" ? (
                <button
                  className="remove-from-courses-btn"
                  onClick={() =>
                    removeCurrentCourse(
                      "concentrationCourse" in selectedCourseNode
                        ? selectedCourseNode.concentrationCourse.course_code
                        : selectedCourseNode.deptCourse.course_code
                    )
                  }
                >
                  <MdOutlinePlaylistRemove className="remove-from-courses-icon" />
                  Remove from Current Courses
                </button>
              ) : selectedCourseNode.status !== "taken" ? (
                <button
                  className="add-to-courses-btn"
                  onClick={() =>
                    addCurrentCourse(
                      "concentrationCourse" in selectedCourseNode
                        ? selectedCourseNode.concentrationCourse.course_code
                        : selectedCourseNode.deptCourse.course_code
                    )
                  }
                >
                  <MdOutlinePlaylistAdd className="add-to-courses-icon" />
                  Add to Current Courses
                </button>
              ) : selectedCourseNode.status === "taken" ? (
                <div className="flowchart-course-semester-taken">
                  Completed during: {selectedCourseNode.semesterTaken}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConcentrationFlowChart;
