import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  hashed_password: {
    type: String,
    required: true,
  },
  role: { type: String, enum: ["student", "admin"], default: "student" },
  department: {
    type: String,
    enum: [
      "Communication",
      "Communication Sciences and Disorders",
      "Africana Studies",
    ],
    required: true,
  },
  gpa: {
    type: Number,
    min: 0.0,
    max: 4.0,
  },
  past_courses: [
    {
      courseCode: { type: String, required: true },
      grade: {
        type: String,
        enum: [
          "A+",
          "A",
          "A-",
          "B+",
          "B",
          "B-",
          "C+",
          "C",
          "C-",
          "D+",
          "D",
          "D-",
          "F",
        ],
        maxlength: 2,
        required: true,
      },
      semester: { type: String, required: true },
    },
  ],
  current_courses: [
    {
      courseCode: { type: String, required: true },
      semester: { type: String, required: true },
    },
  ],
  activities: [
    {
      activityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
        required: true,
      },
      status: {
        type: String,
        enum: ["In progress", "Completed"],
        default: "In progress",
      },
      comment: { type: String },
      completedAt: { type: Date },
      startedAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model("User", userSchema);
