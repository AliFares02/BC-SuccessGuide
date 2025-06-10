"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivitiesBySemester = getActivitiesBySemester;
exports.getAllActivitiesForStudent = getAllActivitiesForStudent;
exports.createActivity = createActivity;
exports.getActivity = getActivity;
exports.updateActivity = updateActivity;
exports.deleteActivity = deleteActivity;
const activityModel_1 = __importDefault(require("../models/activityModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const getCurrentSemester_1 = __importDefault(require("../utils/getCurrentSemester"));
function getActivitiesBySemester(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const semester = req.params.semester;
        try {
            const activities = yield activityModel_1.default.find({
                activity_semester: semester,
            });
            if (!activities || activities.length === 0) {
                return res
                    .status(404)
                    .json({ msg: "No milestone activites for this semester" });
            }
            return res.status(200).json({ activities });
        }
        catch (error) {
            res.status(500).json({ msg: "Server Error", error });
        }
    });
}
function getAllActivitiesForStudent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const studentId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { department } = req.user;
        const currentSemester = (0, getCurrentSemester_1.default)().split(" ")[0];
        const { studentYr } = req.params;
        try {
            const allActivitiesForSemester = yield activityModel_1.default.find({
                activity_semester: currentSemester,
                activity_department: department,
                activity_year: studentYr,
            });
            if (!allActivitiesForSemester) {
                return res.status(404).json({ msg: "No activities for this semester" });
            }
            // return an array of the students activities(includes both completed and in progress activities)
            const studentActivities = yield userModel_1.default
                .findById(studentId)
                .select("activities");
            const studentActivitiesArray = studentActivities === null || studentActivities === void 0 ? void 0 : studentActivities.activities;
            if (!studentActivities) {
                return res.status(404).json({
                    msg: "Can't find activities for this student as they do not exist",
                });
            }
            // match the completed/in progress activities with the allactivities array based on activityid to get a filtered array that has all activities with in progress and complete ones marked accordingly
            const studentActivityIdsAndStatus = studentActivitiesArray === null || studentActivitiesArray === void 0 ? void 0 : studentActivitiesArray.map((activity) => {
                var _a;
                return ({
                    activityId: (_a = activity.activityId) === null || _a === void 0 ? void 0 : _a.toString(),
                    comment: activity.comment,
                    status: activity.status,
                });
            });
            let numOfSemActivitiesCompleted = 0;
            const combinedActivites = allActivitiesForSemester.map((activity) => {
                const matchedActivity = studentActivityIdsAndStatus === null || studentActivityIdsAndStatus === void 0 ? void 0 : studentActivityIdsAndStatus.find((studentActivity) => studentActivity.activityId === activity._id.toString());
                if (matchedActivity) {
                    if (matchedActivity.status === "completed") {
                        numOfSemActivitiesCompleted++;
                    }
                    return {
                        activity,
                        comment: matchedActivity.comment,
                        status: matchedActivity.status,
                    };
                }
                else {
                    return {
                        activity,
                    };
                }
            });
            res.status(200).json({ combinedActivites, numOfSemActivitiesCompleted });
        }
        catch (error) {
            res.status(500).json({ msg: "Server error", error: error });
        }
    });
}
function createActivity(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { activity_description, activity_category, activity_semester, activity_year, } = req.body;
        if (!(activity_description === null || activity_description === void 0 ? void 0 : activity_description.trim()) ||
            !(activity_category === null || activity_category === void 0 ? void 0 : activity_category.trim()) ||
            !(activity_semester === null || activity_semester === void 0 ? void 0 : activity_semester.trim()) ||
            !(activity_year === null || activity_year === void 0 ? void 0 : activity_year.trim()))
            return res.status(400).json({ msg: "Missing activity fields" });
        const { department } = req.user;
        try {
            const activity = yield activityModel_1.default.create(Object.assign(Object.assign({}, req.body), { activity_department: department, activity_description: activity_description.trim() }));
            return res.status(200).json({ msg: "Activity created", activity });
        }
        catch (error) {
            return res.status(400).json({ msg: "Error creating activity", error });
        }
    });
}
function getActivity(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const activityId = req.params.activityId;
        try {
            const activity = yield activityModel_1.default.findById(activityId);
            if (!activity) {
                return res.status(404).json({ msg: "Activity does not exist" });
            }
            return res.status(200).json({ activity });
        }
        catch (error) {
            return res.status(500).json({ msg: "Server error", error });
        }
    });
}
function updateActivity(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const activityId = req.params.activityId;
        const activityUpdates = req.body;
        try {
            const activity = yield activityModel_1.default.findByIdAndUpdate(activityId, activityUpdates, { new: true, runValidators: true });
            if (!activity) {
                return res.status(404).json({ msg: "Activity not found" });
            }
            return res.status(200).json({ msg: "Activity updated", activity });
        }
        catch (error) {
            return res.status(500).json({ msg: "Server error", error });
        }
    });
}
function deleteActivity(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const activityId = req.params.activityId;
        try {
            const activity = yield activityModel_1.default.findByIdAndDelete(activityId);
            if (!activity) {
                return res.status(404).json({ msg: "Activity not found" });
            }
            yield userModel_1.default.updateMany({}, { $pull: { activities: { activityId } } });
            return res
                .status(200)
                .json({ msg: "Activity deleted and references removed", activityId });
        }
        catch (error) {
            return res.status(500).json({ msg: "Server error", error });
        }
    });
}
