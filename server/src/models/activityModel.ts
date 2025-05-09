import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  activity_description: {
    type: String,
    required: true,
  },
  activity_category: {
    type: String,
    enum: ["College Life", "Expand Your Horizons", "Pathway to Success"],
    required: true,
  },
  activity_semester: {
    type: String,
    required: true,
  },
  activity_year: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Activity", activitySchema);
