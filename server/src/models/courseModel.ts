import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  course_code: {
    type: String,
    required: true,
  },
  course_name: {
    type: String,
    required: true,
  },
  course_description: {
    type: String,
    required: true,
  },
  course_credits: {
    type: Number,
    required: true,
    min: 0,
  },
  course_difficulty: {
    type: String,
  },
  course_department: {
    type: String,
  },
  course_prerequisites: {
    type: [String],
    default: [],
  },
});

export default mongoose.model("Course", courseSchema);
