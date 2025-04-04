import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  hashed_password: {
    type: String,
    required: true,
  },
  role: {},
  past_courses: {
    type: [String],
  },
  current_courses: {
    type: [String],
  },
  activities: [
    {
      activityId: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
      status: {
        type: String,
        enum: ["In progress", "Completed"],
        default: "In progress",
      },
      comment: { type: String },
      completedAt: { type: Date },
    },
  ],
});

export default mongoose.model("User", userSchema);
