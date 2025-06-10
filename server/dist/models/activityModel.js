"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const activitySchema = new mongoose_1.default.Schema({
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
exports.default = mongoose_1.default.model("Activity", activitySchema);
