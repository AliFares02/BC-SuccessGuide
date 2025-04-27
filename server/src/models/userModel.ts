import mongoose, { Document, Types } from "mongoose";

interface User extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  hashed_password: string;
  role: "student" | "admin";
  department:
    | "Communication"
    | "Communication Sciences and Disorders"
    | "Africana Studies";
  gpa?: number;
  courses?: {
    courseCode: string;
    semester: string;
    status: "taken" | "in-progress";
    grade?:
      | "A+"
      | "A"
      | "A-"
      | "B+"
      | "B"
      | "B-"
      | "C+"
      | "C"
      | "C-"
      | "D+"
      | "D"
      | "D-"
      | "F";
  }[];
  activities?: {
    activityId: mongoose.Types.ObjectId;
    status: "in-progress" | "completed";
    comment?: string;
    completedAt?: Date;
    startedAt?: Date;
  }[];
}

const userSchema = new mongoose.Schema<User>({
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
  courses: [
    {
      courseCode: { type: String, requried: true },
      semester: { type: String, required: true },
      status: {
        type: String,
        enum: ["taken", "in-progress"],
        required: true,
      },
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
        required: function (this: { status: string }) {
          return this.status === "taken";
        },
      },
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
        enum: ["in-progress", "completed"],
        default: "in-progress",
      },
      comment: { type: String },
      completedAt: { type: Date },
      startedAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model<User>("User", userSchema);
