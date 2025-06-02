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
  activity_department: {
    type: String,
    enum: [
      "Communication",
      "Communication Sciences and Disorders",
      "Africana Studies",
    ],
    required: true,
  },
  activity_priority: {
    type: Number,
    enum: [1, 2],
    required: true,
  },
  activity_semester: {
    type: String,
    enum: ["Fall", "Spring"],
    required: true,
  },
  activity_year: {
    type: String,
    enum: ["First", "Second", "Third", "Fourth"],
    required: true,
  },
  activity_info_links: {
    type: [String],
  },
});

export default mongoose.model("Activity", activitySchema);
