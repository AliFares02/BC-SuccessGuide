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

type Course = {
  concentrationCourse: {
    course_code: string;
    course_credits: string;
    course_department: string;
    course_description: string;
    course_name: string;
    concentration: string;
    concentration_area: string;
  };

  grade?: string;
  semesterTaken?: string;
  status?: "taken" | "in-progress";
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
  concentrationFlowchartCourses: Course[];
}) {
  const [optimisticUIFlowChartCourses, setOptimisticUIFlowChartCourses] =
    useState<Course[]>(concentrationFlowchartCourses);
  const [selectedCourseNode, setSelectedCourseNode] = useState<Course | null>(
    null
  );
  const [selectedConcentration, setSelectedConcentration] = useState(
    "Interpersonal and Intercultural Communication"
  );
  const [selectedConcentrationArea, setSelectedConcentrationArea] =
    useState("Culture");
  const { user } = useAuthContext();

  useEffect(() => {
    setOptimisticUIFlowChartCourses(concentrationFlowchartCourses);
  }, [concentrationFlowchartCourses]);

  useEffect(() => {
    handleConcentrationCourseShow();
  }, []);

  function handleNodeClick(course: Course): any {
    setSelectedCourseNode(course);
  }

  const positionedCourses = optimisticUIFlowChartCourses.map((course, idx) => {
    const col = idx % columns;
    const row = Math.floor(idx / columns);

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
    axios
      .post(
        "http://localhost:5000/api/users/current-courses/add",
        { courseCode },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        //response.data.msg -> for alert
        const updatedUICourses = optimisticUIFlowChartCourses.map((course) => {
          if (
            course.concentrationCourse.course_code === response.data.courseCode
          ) {
            return {
              ...course,
              status: "in-progress" as "in-progress",
            };
          }
          return course;
        });
        setOptimisticUIFlowChartCourses(updatedUICourses);
        setSelectedCourseNode(null);
        toast.success(response.data.msg);
      })
      .catch((error) => toast.error(error.response.data.msg));
  }
  async function removeCurrentCourse(courseCode: string) {
    axios
      .delete(
        `http://localhost:5000/api/users/current-courses/remove/${courseCode}`,
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        const updatedUICourses = optimisticUIFlowChartCourses.map((course) => {
          if (
            course.concentrationCourse.course_code === response.data.courseCode
          ) {
            return {
              ...course,
              status: undefined,
            };
          }
          return course;
        });
        setOptimisticUIFlowChartCourses(updatedUICourses);
        setSelectedCourseNode(null);
        toast.success(response.data.msg);
      })
      .catch((error) => toast.error(error.response.data.msg));
  }

  function handleConcentrationCourseShow() {
    const coursesToShow = concentrationFlowchartCourses.filter(
      (course) =>
        course.concentrationCourse.concentration === selectedConcentration &&
        course.concentrationCourse.concentration_area ===
          selectedConcentrationArea
    );
    setOptimisticUIFlowChartCourses(coursesToShow);
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
          <button
            disabled={
              selectedConcentrationArea === "" || selectedConcentration === ""
            }
            onClick={handleConcentrationCourseShow}
          >
            Show
          </button>
        </div>
      )}
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
              {selectedCourseNode.concentrationCourse.course_code} -{" "}
              {selectedCourseNode.concentrationCourse.course_name}
            </p>
            <div className="flowchart-course-overlay-contents">
              <p className="course-description">
                {selectedCourseNode.concentrationCourse.course_description}
              </p>
              <div className="course-credits">
                Credits: {selectedCourseNode.concentrationCourse.course_credits}
              </div>
              <div className="course-department">
                Department:{" "}
                {selectedCourseNode.concentrationCourse.course_department}
              </div>
              {selectedCourseNode.status === "in-progress" ? (
                <button
                  className="remove-from-courses-btn"
                  onClick={() =>
                    removeCurrentCourse(
                      selectedCourseNode.concentrationCourse.course_code
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
                      selectedCourseNode.concentrationCourse.course_code
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
