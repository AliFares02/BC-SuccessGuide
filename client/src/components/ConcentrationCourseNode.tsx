import "@xyflow/react/dist/style.css";

type CourseThumbnail = {
  course_code: string;
  course_description: string;
  status?: "taken" | "in-progress";
};

type CourseNodeData = CourseThumbnail & {
  onClick: () => void;
};

function ConcentrationCourseNode({
  id,
  data,
}: {
  id: string;
  data: CourseNodeData;
}) {
  const { onClick } = data;

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
    </div>
  );
}

export default ConcentrationCourseNode;
