import { API_BASE_URL } from "../api/config";
import { Controls, Edge, Node, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import dagre from "dagre";
import { useEffect, useState } from "react";
import {
  MdCancel,
  MdInfo,
  MdOutlinePlaylistAdd,
  MdOutlinePlaylistRemove,
} from "react-icons/md";
import { toast } from "react-toastify";
import { Tooltip } from "react-tooltip";
import useAuthContext from "../hooks/useAuthContext";
import CourseNode from "./CourseNode";

type DeptCourse = {
  deptCourse: {
    course_code: string;
    course_credits: string;
    course_department: string;
    course_description: string;
    course_name: string;
    course_prerequisites: string[];
  };
  grade?: string;
  semesterTaken?: string;
  status?: "taken" | "in-progress";
};

const nodeWidth = 155;
const nodeHeight = 105;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB" });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes?.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });
};

function FlowChart({ flowchartCourses }: { flowchartCourses: DeptCourse[] }) {
  const [optimisticUIFlowChartCourses, setOptimisticUIFlowChartCourses] =
    useState<DeptCourse[]>(flowchartCourses);
  const [selectedCourseNode, setSelectedCourseNode] =
    useState<DeptCourse | null>(null);
  const { user } = useAuthContext();
  const handleNodeClick = (nodeData: DeptCourse) => {
    setSelectedCourseNode(nodeData);
  };

  useEffect(() => {
    setOptimisticUIFlowChartCourses(flowchartCourses);
  }, [flowchartCourses]);

  const nodes: Node[] = optimisticUIFlowChartCourses?.map((course) => ({
    id: course.deptCourse.course_code,
    data: {
      course_code: course.deptCourse.course_code,
      course_description: course.deptCourse.course_description,
      ...(course.status && { status: course.status }),
      onClick: () => handleNodeClick(course),
    },
    type: "custom",
    position: { x: 0, y: 0 },
  }));

  const edges: Edge[] = optimisticUIFlowChartCourses?.flatMap((course) => {
    const targetId = course.deptCourse.course_code;
    return course.deptCourse.course_prerequisites?.map((prereq) => ({
      id: `e-${prereq}-${targetId}`,
      source: prereq,
      target: targetId,
      type: "default",
      style: { stroke: "#818181" },
    }));
  });

  const layoutedNodes = getLayoutedElements(nodes, edges);
  async function addCurrentCourse(courseCode: string) {
    axios
      .post(
        `${API_BASE_URL}/api/users/current-courses/add`,
        { courseCode },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        const updatedUICourses = optimisticUIFlowChartCourses?.map((course) => {
          if (course.deptCourse.course_code === response.data.courseCode) {
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
        `${API_BASE_URL}/api/users/current-courses/remove/${courseCode}`,
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        const updatedUICourses = optimisticUIFlowChartCourses?.map((course) => {
          if (course.deptCourse.course_code === response.data.courseCode) {
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

  return (
    <div className="core-flowchart-wrapper">
      <Tooltip
        id="core-more-info-icon"
        place="top"
        style={{ zIndex: "700", whiteSpace: "normal", maxWidth: "250px" }}
      />
      <MdInfo
        data-tooltip-id="core-more-info-icon"
        data-tooltip-content="Click a course to learn more about it or add/remove it from your current courses."
        className="more-info-btn-icon"
      />
      <ReactFlow
        nodes={layoutedNodes}
        edges={edges}
        fitView
        nodeTypes={{ custom: CourseNode }}
      >
        <Controls showInteractive={false} />
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
                {selectedCourseNode.deptCourse.course_code} -{" "}
                {selectedCourseNode.deptCourse.course_name}
              </p>
              <div className="flowchart-course-overlay-contents">
                <p className="course-description">
                  {selectedCourseNode.deptCourse.course_description}
                </p>
                <div className="course-credits">
                  Credits: {selectedCourseNode.deptCourse.course_credits}
                </div>
                <div className="course-department">
                  Department: {selectedCourseNode.deptCourse.course_department}
                </div>
                {selectedCourseNode.status === "in-progress" ? (
                  <button
                    className="remove-from-courses-btn"
                    onClick={() =>
                      removeCurrentCourse(
                        selectedCourseNode.deptCourse.course_code
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
                        selectedCourseNode.deptCourse.course_code
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
      </ReactFlow>
    </div>
  );
}

export default FlowChart;
