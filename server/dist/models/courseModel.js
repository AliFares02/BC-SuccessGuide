"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const validConcentrationAreas = {
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
};
const courseSchema = new mongoose_1.default.Schema({
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
    concentration: {
        type: String,
        enum: Object.keys(validConcentrationAreas),
        default: null,
        required: function () {
            return !!this.isConcentrationCourse;
        },
    },
    concentration_area: {
        type: String,
        default: null,
        required: function () {
            return !!this.isConcentrationCourse;
        },
        validate: {
            validator: function (value) {
                var _a;
                if (!this.isConcentrationCourse)
                    return true;
                if (!this.concentration || !value)
                    return false;
                const concentration = this
                    .concentration;
                return (_a = validConcentrationAreas[concentration]) === null || _a === void 0 ? void 0 : _a.includes(value);
            },
            message: (props) => `"${props.value}" is not a valid area for concentration "${props.instance.concentration}".`,
        },
    },
    isConcentrationCourse: {
        type: Boolean,
        default: false,
    },
    isAfstIntroductory: {
        type: Boolean,
        default: function () {
            return (this.course_department === "Africana Studies" &&
                Number(this.course_code.split(" ")[1]) >= 1001 &&
                Number(this.course_code.split(" ")[1]) <= 1099);
        },
    },
    afstGroup: {
        type: String,
        enum: ["a", "b", "c", null],
        default: function () {
            if (this.course_department !== "Africana Studies")
                return null;
            const courseNum = Number(this.course_code.split(" ")[1]);
            if (courseNum >= 3100 && courseNum <= 3199)
                return "a";
            if (courseNum >= 3200 && courseNum <= 3299)
                return "b";
            if (courseNum >= 3300 && courseNum <= 4399)
                return "c";
            return null;
        },
    },
    isAfstSeminar: {
        type: Boolean,
        default: function () {
            if (this.course_department === "Africana Studies") {
                const num = Number(this.course_code.split(" ")[1]);
                return num >= 4405 && num <= 5404;
            }
            return false;
        },
    },
});
exports.default = mongoose_1.default.model("Course", courseSchema);
