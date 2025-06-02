import { Handle, Position, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type CourseThumbnail = {
  course_code: string;
  course_description: string;
  status?: "taken" | "in-progress";
};

type CourseNodeData = CourseThumbnail & {
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
        data.status === "taken"
          ? "completed"
          : data.status === "in-progress"
          ? "in-progress"
          : ""
      }`}
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
