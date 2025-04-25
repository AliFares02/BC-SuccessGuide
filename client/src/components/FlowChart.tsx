import { Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import CourseNode from "./CourseNode";
import React, { useState } from "react";

type Course = {
  course_code: string;
  course_credits: string;
  course_department: string;
  course_description: string;
  course_difficulty: string;
  course_name: string;
  course_prerequisites: string[];
};

function FlowChart({ flowchartCourses }: { flowchartCourses: Course[] }) {
  flowchartCourses.map((flowchartCourse, idx) => {
    console.log("A course from the flowchart", flowchartCourse);
  });
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
  console.log("flowchartCourseNodes...", flowchartCourseNodes);

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
          <div className="flowchart-course-overlay">
            {selectedCourseNode.course_description}
          </div>
        )}
      </ReactFlow>
    </div>
  );
}

export default FlowChart;
