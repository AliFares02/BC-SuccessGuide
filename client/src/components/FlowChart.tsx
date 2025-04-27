import { Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import CourseNode from "./CourseNode";
import React, { useState } from "react";
import { MdCancel, MdOutlinePlaylistAdd } from "react-icons/md";

type Course = {
  course_code: string;
  course_credits: string;
  course_department: string;
  course_description: string;
  course_name: string;
  course_prerequisites: string[];
};

function FlowChart({ flowchartCourses }: { flowchartCourses: Course[] }) {
  // flowchartCourses.map((flowchartCourse, idx) => {
  //   console.log("A course from the flowchart", flowchartCourse);
  // });
  const [selectedCourseNode, setSelectedCourseNode] = useState<Course | null>(
    null
  );
  const handleNodeClick = (nodeData: Course) => {
    setSelectedCourseNode(nodeData);
  };
  let startX = 0;
  let startY = 0;
  const flowchartCourseNodes = flowchartCourses.map((flowchartCourse, idx) => {
    return {
      id: String(idx + 1),
      position: { x: (startX += 100), y: (startY += 100) },
      data: {
        course_code: flowchartCourse.course_code,
        course_description: flowchartCourse.course_description,
        onClick: () => handleNodeClick(flowchartCourse),
      },
      type: "custom",
    };
  });
  // console.log("flowchartCourseNodes...", flowchartCourseNodes);

  const initialEdges = [
    { type: "straight", id: "e1-2", source: "1", target: "2" },
    { type: "straight", id: "e1-3", source: "1", target: "3" },
    { type: "straight", id: "e1-4", source: "1", target: "4" },
  ];
  // console.log("selected node", selectedNode);

  return (
    <div style={{ height: "75dvh", width: "85%" }}>
      <ReactFlow
        nodes={flowchartCourseNodes}
        edges={initialEdges}
        fitView
        nodeTypes={{ custom: CourseNode }}
      >
        <Controls />
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
                {selectedCourseNode.course_code} -{" "}
                {selectedCourseNode.course_name}
              </p>
              <div className="flowchart-course-overlay-contents">
                <p className="course-description">
                  {selectedCourseNode.course_description}
                </p>
                <div className="course-credits">
                  Credits: {selectedCourseNode.course_credits}
                </div>
                <div className="course-department">
                  Department: {selectedCourseNode.course_department}
                </div>
                <button className="add-to-courses-btn">
                  <MdOutlinePlaylistAdd className="add-to-courses-icon" />
                  Add to Current Courses
                </button>
              </div>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
}

export default FlowChart;
