"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: function () {
            return this.role === "student";
        },
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
    year: {
        type: String,
        enum: ["First", "Second", "Third", "Fourth"],
        required: function () {
            return this.role === "student";
        },
        default: function () {
            return this.role === "student" ? "First" : undefined;
        },
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
                    "P/CR",
                    "N/A",
                ],
                maxlength: 4,
                required: function () {
                    return this.status === "taken";
                },
            },
            comment: { type: String },
            is_internship_req_and_req_met: {
                type: Boolean,
                default: function () {
                    var _a;
                    return (this.courseCode === "COMM 4100" ||
                        this.courseCode === "COMM 4000") &&
                        ((_a = this.ownerDocument()) === null || _a === void 0 ? void 0 : _a.department) === "Communication"
                        ? false
                        : undefined;
                },
            },
        },
    ],
    activities: [
        {
            activityId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
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
    afst_chosen_additional_major: {
        type: String,
        default: undefined,
    },
    afst_chosen_additional_major_courses: {
        type: [
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
                        "P/CR",
                        "N/A",
                    ],
                    maxlength: 4,
                    required: true,
                },
                semester_completed: {
                    type: String,
                    required: true,
                },
                credits: {
                    type: Number,
                    required: true,
                },
            },
        ],
        default: undefined,
    },
    afst_chosen_additional_major_credits_completed: {
        type: Boolean,
        default: undefined,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
});
exports.default = mongoose_1.default.model("User", userSchema);
