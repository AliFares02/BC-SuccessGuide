import mongoose from "mongoose";

const validConcentrationAreas: Record<string, string[]> = {
  "Interpersonal and Intercultural Communication": [
    "Culture",
    "Society",
    "Family",
    "Gender",
  ],
  "Professional and Organizational Communication": [
    "Organizational",
    "Communication and Presentation Skills",
    "Groups and Teams",
    "Specialization",
  ],
  "Visual and Media Studies": ["Culture", "Media", "History", "Theory"],
} as const;

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
  concentration: {
    type: String,
    enum: Object.keys(validConcentrationAreas),
    default: null,
    required: function (this: any) {
      return !!this.isConcentrationCourse;
    },
  },

  concentration_area: {
    type: String,
    default: null,
    required: function (this: any) {
      return !!this.isConcentrationCourse;
    },
    validate: {
      validator: function (this: any, value: string | null) {
        if (!this.isConcentrationCourse) return true;
        if (!this.concentration || !value) return false;

        const concentration = this
          .concentration as keyof typeof validConcentrationAreas;
        return validConcentrationAreas[concentration]?.includes(value);
      },
      message: (props: any) =>
        `"${props.value}" is not a valid area for concentration "${props.instance.concentration}".`,
    },
  },
  isConcentrationCourse: {
    type: Boolean,
    default: false,
  },
  course_prerequisites: {
    type: [String],
    default: [],
  },
});

export default mongoose.model("Course", courseSchema);
