import { useReactFlow, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
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

type CourseNodeData = Course & {
  onClick: () => void;
};

function CourseNode({ id, data }: { id: string; data: CourseNodeData }) {
  const { getEdges } = useReactFlow();
  const { onClick } = data;

  const edges = getEdges();
  const hasIncomingEdge = edges.some((edge) => edge.target === id);
  const hasOutgoingEdge = edges.some((edge) => edge.source === id);
  return (
    <div
      className={`course-node ${
        data.course_code === "CS101" ? "completed" : ""
      }`}
      // change data.course_code === "CS101" to check a completed attribute that you will add to the users courses flattened(combine past & current course att. into single courses att) courses attribute
      onClick={onClick}
    >
      <strong>{data.course_code}</strong>
      <div className="course-node-desc">{data.course_description}</div>
      {hasIncomingEdge && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: "rgb(136, 35, 70)" }}
        />
      )}

      {hasOutgoingEdge && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: "rgb(136, 35, 70)" }}
        />
      )}
    </div>
  );
}

export default CourseNode;
