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
exports.signUp = signUp;
exports.login = login;
exports.getStudentYear = getStudentYear;
exports.getStudentAccount = getStudentAccount;
exports.updateStudentAccount = updateStudentAccount;
exports.deleteUser = deleteUser;
exports.requestPasswordReset = requestPasswordReset;
exports.resetPassword = resetPassword;
exports.getFlowChartCourses = getFlowChartCourses;
exports.getConcentrationCourses = getConcentrationCourses;
exports.addActivitiesToStudent = addActivitiesToStudent;
exports.updateStudentActivity = updateStudentActivity;
exports.deleteStudentActivity = deleteStudentActivity;
exports.getStudentActivities = getStudentActivities;
exports.getStudentAcademicTracker = getStudentAcademicTracker;
exports.addPastCourse = addPastCourse;
exports.addCurrentCourse = addCurrentCourse;
exports.editPastCourseSemesterTaken = editPastCourseSemesterTaken;
exports.removeCurrentCourse = removeCurrentCourse;
exports.removePastCourse = removePastCourse;
exports.getPastCourses = getPastCourses;
exports.getCurrentCourses = getCurrentCourses;
exports.editCourseComment = editCourseComment;
exports.getIncompleteCourses = getIncompleteCourses;
exports.getDesiredGPA = getDesiredGPA;
exports.getGPAEstimator = getGPAEstimator;
exports.getAFSTChosenMajor = getAFSTChosenMajor;
exports.createAFSTChosenAddMajor = createAFSTChosenAddMajor;
exports.updateAFSTChosenAddMajor = updateAFSTChosenAddMajor;
exports.getAFSTAdditionalCourses = getAFSTAdditionalCourses;
exports.createAFSTAddCourse = createAFSTAddCourse;
exports.deleteAFSTAddCourse = deleteAFSTAddCourse;
const mongoose_1 = __importDefault(require("mongoose"));
const activityModel_1 = __importDefault(require("../models/activityModel"));
const courseModel_1 = __importDefault(require("../models/courseModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const validator_1 = __importDefault(require("validator"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const crypto_1 = __importDefault(require("crypto"));
const getCurrentSemester_1 = __importDefault(require("../utils/getCurrentSemester"));
const sendResetEmail_1 = __importDefault(require("../utils/sendResetEmail"));
function createToken(_id, email, role, department) {
    const secret = process.env.JWT_SECRET;
    return jsonwebtoken_1.default.sign({ _id, email, role, department }, secret, {
        expiresIn: "1d",
    });
}
// public endpoint
function signUp(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, email, password, department } = req.body;
        if (!name || !email || !password || !department)
            return res.status(401).json({ msg: "Missing credentials" });
        if (!name.trim() || !email.trim() || !password.trim() || !department)
            return res.status(401).json({ msg: "Missing credentials" });
        if (!validator_1.default.isEmail(email.trim()))
            return res.status(401).json({ msg: "Invalid email" });
        if (!validator_1.default.isStrongPassword(password))
            return res.status(401).json({ msg: "Invalid password" });
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        try {
            const userExists = yield userModel_1.default.findOne({ email: trimmedEmail });
            if (userExists)
                return res.status(409).json({ msg: "Email already in use" });
            const salt = yield bcrypt_1.default.genSalt(10);
            const hash = yield bcrypt_1.default.hash(password, salt);
            const user = yield userModel_1.default.create({
                name: trimmedName,
                email: trimmedEmail,
                hashed_password: hash,
                department,
            });
            const token = createToken(user._id.toString(), user.email, user.role, user.department);
            return res.status(200).json({
                msg: "User created",
                name: user.name,
                email: user.email,
                department: user.department,
                access_token: token,
            });
        }
        catch (error) {
            return res.status(500).json({ msg: "Error creating user", error: error });
        }
    });
}
// public endpoint
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const credentials = req.body;
        if (!credentials || !credentials)
            return res.status(401).json({ msg: "Missing credentials" });
        if (!credentials.email.trim() || !credentials.password.trim())
            return res.status(401).json({ msg: "Missing credentials" });
        const trimmedEmail = credentials.email.trim();
        try {
            const user = yield userModel_1.default.findOne({
                email: trimmedEmail,
                role: "student",
            });
            if (!user)
                return res.status(404).json({ msg: "Invalid credentials" });
            const matchingPassword = yield bcrypt_1.default.compare(credentials.password, user.hashed_password);
            if (!matchingPassword)
                return res.status(401).json({ msg: "Invalid credentials" });
            const token = createToken(user._id.toString(), user.email, user.role, user.department);
            return res.status(200).json({
                msg: "Login successful",
                name: user.name,
                email: user.email,
                department: user.department,
                access_token: token,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error logging in, please try again later", error: error });
        }
    });
}
function getStudentYear(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id } = req.user;
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(404).json({ msg: "Invalid student" });
            return res.status(200).json({ studentYear: student.year });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error retrieving student year, please try again later",
                error: error,
            });
        }
    });
}
function getStudentAccount(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id } = req.user;
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(404).json({ msg: "Invalid student" });
            const studentAcct = {
                name: student.name,
                email: student.email,
                department: student.department,
                year: student.year,
            };
            return res.status(200).json(studentAcct);
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error retrieving student account, please try again later",
                error: error,
            });
        }
    });
}
function updateStudentAccount(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const { _id, department } = req.user;
        const { updatedStudentAcctInfo } = req.body;
        const parsedUpdates = {};
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(400).json({ msg: "Invalid student" });
            if ((_a = updatedStudentAcctInfo === null || updatedStudentAcctInfo === void 0 ? void 0 : updatedStudentAcctInfo.name) === null || _a === void 0 ? void 0 : _a.trim()) {
                parsedUpdates.name = updatedStudentAcctInfo.name.trim();
            }
            if ((_b = updatedStudentAcctInfo === null || updatedStudentAcctInfo === void 0 ? void 0 : updatedStudentAcctInfo.email) === null || _b === void 0 ? void 0 : _b.trim()) {
                if (!validator_1.default.isEmail(updatedStudentAcctInfo.email.trim())) {
                    return res.status(401).json("Invalid email");
                }
                parsedUpdates.email = updatedStudentAcctInfo.email.trim();
            }
            if ((updatedStudentAcctInfo === null || updatedStudentAcctInfo === void 0 ? void 0 : updatedStudentAcctInfo.department) &&
                (updatedStudentAcctInfo === null || updatedStudentAcctInfo === void 0 ? void 0 : updatedStudentAcctInfo.department) !== department) {
                parsedUpdates.department = updatedStudentAcctInfo.department;
                student.courses = [];
            }
            if ((updatedStudentAcctInfo === null || updatedStudentAcctInfo === void 0 ? void 0 : updatedStudentAcctInfo.year) &&
                (updatedStudentAcctInfo === null || updatedStudentAcctInfo === void 0 ? void 0 : updatedStudentAcctInfo.year) !== student.year) {
                parsedUpdates.year = updatedStudentAcctInfo.year;
            }
            if ((_c = updatedStudentAcctInfo === null || updatedStudentAcctInfo === void 0 ? void 0 : updatedStudentAcctInfo.password) === null || _c === void 0 ? void 0 : _c.trim()) {
                const samePassword = yield bcrypt_1.default.compare(updatedStudentAcctInfo.password.trim(), student.hashed_password);
                if (samePassword) {
                    return res.status(400).json({
                        msg: "New password must be different from the current password.",
                    });
                }
                if (!validator_1.default.isStrongPassword(updatedStudentAcctInfo.password.trim())) {
                    return res.status(401).json({ msg: "Invalid password" });
                }
                const salt = yield bcrypt_1.default.genSalt(10);
                const hash = yield bcrypt_1.default.hash(updatedStudentAcctInfo.password.trim(), salt);
                parsedUpdates.hashed_password = hash;
            }
            student.set(parsedUpdates);
            yield student.save();
            const { name, email, department: updatedDepartment, year, } = student.toObject();
            return res.status(200).json({
                msg: "Student account updated",
                student: { name, email, department: updatedDepartment, year },
            });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error updating student account, please try again later",
                error: error,
            });
        }
    });
}
function deleteUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userToDel = req.params.id;
        const { _id, role } = req.user;
        const isAdmin = role === "admin";
        const delSelf = _id.toString() === userToDel;
        if (!isAdmin && !delSelf) {
            return res.status(403).json({ msg: "Unauthorized access" });
        }
        try {
            yield userModel_1.default.findByIdAndDelete(userToDel);
            return res.status(200).json({ msg: "User deleted", id: userToDel });
        }
        catch (error) {
            return res.status(500).json({ msg: "Error deleting user" });
        }
    });
}
function requestPasswordReset(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email } = req.body;
        try {
            const user = yield userModel_1.default.findOne({ email: email });
            if (!user)
                return res
                    .status(404)
                    .json({ msg: "Email does not exist in our database" });
            const rawToken = crypto_1.default.randomBytes(32).toString("hex");
            const hashedToken = crypto_1.default
                .createHash("sha256")
                .update(rawToken)
                .digest("hex");
            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 15);
            yield user.save();
            const resetURL = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
            yield (0, sendResetEmail_1.default)(user.email, resetURL);
            return res.status(200).json({ msg: "Reset email sent" });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error sending reset link, please try again later",
                error: error,
            });
        }
    });
}
function resetPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { token } = req.params;
        const { newPassword } = req.body;
        try {
            const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
            const user = yield userModel_1.default.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: new Date() },
            });
            if (!user)
                return res
                    .status(400)
                    .json({ msg: "Invalid or expired password reset token" });
            const salt = yield bcrypt_1.default.genSalt(10);
            const hash = yield bcrypt_1.default.hash(newPassword.trim(), salt);
            user.hashed_password = hash;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            yield user.save();
            return res.status(200).json({ msg: "Password reset successfully" });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error resetting password", error: error });
        }
    });
}
// student endpoints
function getFlowChartCourses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        // fetch student courses, then fetch all department courses and right join them so matching courses are joined
        try {
            const studentCourses = yield userModel_1.default.findById(_id).select("courses");
            if (!studentCourses)
                return res.status(404).json({ msg: "Invalid student" });
            const studentCourseArr = studentCourses.courses;
            const deptCourses = yield courseModel_1.default
                .find({ course_department: department, isConcentrationCourse: false })
                .lean();
            const studentAndDeptCoursesJoined = deptCourses.map((deptCourse) => {
                const matchingCourse = studentCourseArr === null || studentCourseArr === void 0 ? void 0 : studentCourseArr.find((course) => course.courseCode === deptCourse.course_code);
                if (matchingCourse) {
                    return {
                        deptCourse,
                        status: matchingCourse.status,
                        grade: matchingCourse.grade,
                        semesterTaken: matchingCourse.semester,
                    };
                }
                return { deptCourse };
            });
            return res.status(200).json({ studentAndDeptCoursesJoined });
        }
        catch (error) {
            return res.status(500).json({ msg: "Server error", error: error });
        }
    });
}
function getConcentrationCourses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        if (department !== "Communication")
            return res.status(403).json({ msg: "Invalid department" });
        try {
            const studentCourses = yield userModel_1.default.findById(_id).select("courses");
            if (!studentCourses)
                return res.status(404).json({ msg: "Invalid student" });
            const studentCoursesArr = studentCourses.courses;
            const concentrationCourses = yield courseModel_1.default
                .find({
                course_department: department,
                concentration: { $exists: true, $ne: null },
            })
                .lean();
            const studentAndConCoursesJoined = concentrationCourses.map((concentrationCourse) => {
                const matchingCourse = studentCoursesArr === null || studentCoursesArr === void 0 ? void 0 : studentCoursesArr.find((course) => course.courseCode === concentrationCourse.course_code);
                if (matchingCourse) {
                    return {
                        concentrationCourse,
                        status: matchingCourse.status,
                        grade: matchingCourse.grade,
                        semesterTaken: matchingCourse.semester,
                    };
                }
                return {
                    concentrationCourse,
                };
            });
            return res.status(200).json({ studentAndConCoursesJoined });
        }
        catch (error) {
            return res.status(500).json({ msg: "Server error", error: error });
        }
    });
}
function addActivitiesToStudent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { _id } = req.user;
        const { activityId } = req.params;
        try {
            const student = yield userModel_1.default.findById(_id);
            const activity = yield activityModel_1.default.findById(activityId);
            if (!student)
                return res.status(404).json({ msg: "Invalid student" });
            if (!activity)
                return res.status(404).json({ msg: "Invalid activity" });
            // check if activity already exists in students activities before adding it
            const activityExists = (_a = student.activities) === null || _a === void 0 ? void 0 : _a.find((activity) => activity.activityId.toString() === activityId);
            if (activityExists)
                return res
                    .status(409)
                    .json({ msg: "Activity already exists in students activity list" });
            (_b = student.activities) === null || _b === void 0 ? void 0 : _b.push({
                activityId: new mongoose_1.default.Types.ObjectId(activityId),
                status: "in-progress",
            });
            yield student.save();
            return res.status(200).json({
                msg: "Activity added to student's activities",
                activityId,
            });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error adding activity, please try again later",
                error: error,
            });
        }
    });
}
function updateStudentActivity(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id } = req.user;
        const { activityId } = req.params;
        const { comment, modificationType, } = req.body;
        try {
            const student = yield userModel_1.default.findById(_id).select("activities");
            if (!student)
                return res.status(404).json({ msg: "Invalid student" });
            const studentActivities = student.activities;
            const activity = studentActivities === null || studentActivities === void 0 ? void 0 : studentActivities.find((activity) => activity.activityId.toString() === activityId);
            if (!activity)
                return res
                    .status(404)
                    .json({ error: "Activity not found in student activities" });
            switch (modificationType) {
                case "save":
                    activity.comment = comment.trim();
                    break;
                case "delete":
                    activity.comment = undefined;
                    break;
                case "status-complete":
                    activity.status = "completed";
                    break;
                default:
            }
            yield student.save();
            return res.status(200).json({ msg: "Activity updated", activity });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error updating activity, please try again later",
                error: error,
            });
        }
    });
}
function deleteStudentActivity(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { _id } = req.user;
        const { activityId } = req.params;
        try {
            const student = yield userModel_1.default.findById(_id).select("activities");
            if (!student)
                return res.status(404).json({ msg: "Invalid student" });
            const activity = (_a = student.activities) === null || _a === void 0 ? void 0 : _a.find((activity) => activity.activityId.toString() === activityId);
            if (!activity)
                return res
                    .status(404)
                    .json({ error: "Activity does not exist in student activities" });
            student.activities = (_b = student.activities) === null || _b === void 0 ? void 0 : _b.filter((activity) => activity.activityId.toString() !== activityId);
            yield student.save();
            return res
                .status(200)
                .json({ msg: "Activity deleted", activityId: activity.activityId });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error deleting activity, please try again later",
                error: error,
            });
        }
    });
}
function getStudentActivities(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id } = req.user;
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(404).json({
                    msg: "Can't retrieve student activities because student does not exist",
                });
            const studentActivities = yield userModel_1.default
                .findById(_id)
                .select("activities")
                .populate("activities.activityId");
            return res.status(200).json({ activities: studentActivities === null || studentActivities === void 0 ? void 0 : studentActivities.activities });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error retrieving student activities, please try again later",
                error: error,
            });
        }
    });
}
function getStudentAcademicTracker(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { _id } = req.user;
        try {
            const student = yield userModel_1.default
                .findById(_id)
                .populate("activities.activityId");
            if (!student)
                return res.status(404).json({ msg: "Student not found" });
            const studentCurrentCourses = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.filter((course) => course.status === "in-progress");
            return res
                .status(200)
                .json({ studentCurrentCourses, activities: student.activities });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error retrieving student academic tracker, please try again later",
                error: error,
            });
        }
    });
}
function addPastCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const { _id, department } = req.user;
        // get the course object from the database, attatch the student details(which should only contain things like course grade), then add it to students past courses instead of what your doing now.
        const courseCode = req.params.courseCode;
        const studentsCourseDetails = req.body;
        // dont use coursecode from params just use it from req body or vic versa, no need to grab it from both, if you decide to grab it from both you must make sure the body code and param code match first
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(404).json({
                    msg: "Can't add course because student does not exist",
                });
            const course = yield courseModel_1.default.findOne({ course_code: courseCode });
            if (!course)
                return res.status(404).json({
                    msg: "Can't add course because course does not exist",
                });
            // check if course already exists in student past courses
            const courseAlrTaken = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((course) => {
                return (course.courseCode === courseCode.toString() && course.status === "taken");
            });
            const courseAlrInProg = (_b = student.courses) === null || _b === void 0 ? void 0 : _b.find((course) => {
                return (course.courseCode === courseCode.toString() &&
                    course.status === "in-progress");
            });
            if (courseAlrTaken)
                return res.status(409).json({
                    msg: "Course already taken before",
                });
            // if it is already in progress, then change the course from "in-progress" to "taken"
            let returnedCourse;
            if (courseAlrInProg) {
                const courseIdx = (_c = student.courses) === null || _c === void 0 ? void 0 : _c.findIndex((course) => course.courseCode === courseCode.toString());
                if (courseIdx !== undefined && courseIdx !== -1) {
                    // handle comm student adding internship course
                    if (department === "Communication") {
                        if (courseCode === "COMM 4000" || courseCode === "COMM 4100") {
                            const otherCourseCode = courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000";
                            const internshipReqMet = (_d = student.courses) === null || _d === void 0 ? void 0 : _d.find((course) => {
                                course.courseCode === otherCourseCode &&
                                    course.status === "taken" &&
                                    course.is_internship_req_and_req_met;
                            });
                            if (internshipReqMet) {
                                return res
                                    .status(400)
                                    .json({ msg: "You've already met the internship requirement" });
                            }
                            else {
                                student.courses[courseIdx].status = "taken";
                                student.courses[courseIdx].grade =
                                    studentsCourseDetails.grade;
                                student.courses[courseIdx].is_internship_req_and_req_met = true;
                                (_e = student.courses) === null || _e === void 0 ? void 0 : _e.push({
                                    courseCode: courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000",
                                    status: "taken",
                                    grade: "N/A",
                                    semester: "N/A",
                                    is_internship_req_and_req_met: false,
                                });
                                returnedCourse = {
                                    courseCode: student.courses[courseIdx].courseCode,
                                    status: "taken",
                                    grade: studentsCourseDetails.grade,
                                    semester: student.courses[courseIdx].semester,
                                };
                            }
                        }
                        else {
                            student.courses[courseIdx].status = "taken";
                            student.courses[courseIdx].grade =
                                studentsCourseDetails.grade;
                            returnedCourse = {
                                courseCode: student.courses[courseIdx].courseCode,
                                status: "taken",
                                grade: studentsCourseDetails.grade,
                                semester: student.courses[courseIdx].semester,
                            };
                        }
                    }
                    else {
                        student.courses[courseIdx].status = "taken";
                        student.courses[courseIdx].grade =
                            studentsCourseDetails.grade;
                        returnedCourse = {
                            courseCode: student.courses[courseIdx].courseCode,
                            status: "taken",
                            grade: studentsCourseDetails.grade,
                            semester: student.courses[courseIdx].semester,
                        };
                    }
                }
            }
            else {
                // else check if course prerequisites have been met
                if (course.course_prerequisites &&
                    course.course_prerequisites.length > 0) {
                    const missingPrerequisites = course.course_prerequisites.filter((coursePrerequisite) => {
                        var _a;
                        const preReqMatch = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === coursePrerequisite &&
                            course.status === "taken");
                        return !preReqMatch;
                    });
                    if (missingPrerequisites.length > 0) {
                        return res
                            .status(400)
                            .json({ msg: `Missing prerequisite(s): ${missingPrerequisites}` });
                    }
                }
                // then add the course as a "taken" course
                (_f = student.courses) === null || _f === void 0 ? void 0 : _f.push({
                    courseCode,
                    semester: studentsCourseDetails.semester,
                    status: "taken",
                    grade: studentsCourseDetails.grade,
                });
                returnedCourse = {
                    courseCode,
                    status: "taken",
                    grade: studentsCourseDetails.grade,
                    semester: studentsCourseDetails.semester,
                };
            }
            // update students gpa acordingly for new course & grade
            const studentGPA = student.gpa ? student.gpa : 0;
            let studentTotalCredits = 0;
            const allDeptCourses = yield courseModel_1.default
                .find({ course_department: department })
                .lean();
            allDeptCourses.map((deptCourse) => {
                var _a;
                const matchingTakenCourse = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === deptCourse.course_code &&
                    course.status === "taken");
                // calculate students total credits
                if (studentsCourseDetails.grade !== "P/CR" &&
                    studentsCourseDetails.grade !== "N/A") {
                    if (matchingTakenCourse)
                        studentTotalCredits += deptCourse.course_credits;
                }
            });
            if (student.gpa !== undefined) {
                if (studentsCourseDetails.grade !== undefined &&
                    studentsCourseDetails.grade !== "P/CR" &&
                    studentsCourseDetails.grade !== "N/A") {
                    student.gpa = parseFloat(((studentGPA * (studentTotalCredits - course.course_credits) +
                        gradeToQualityPoint[studentsCourseDetails.grade] *
                            course.course_credits) /
                        studentTotalCredits).toFixed(2));
                }
            }
            else if (studentsCourseDetails.grade !== undefined &&
                studentsCourseDetails.grade !== "P/CR" &&
                studentsCourseDetails.grade !== "N/A") {
                student.gpa = gradeToQualityPoint[studentsCourseDetails.grade];
            }
            yield student.save();
            return res.status(200).json({
                msg: "Course added to past courses",
                gpa: student.gpa,
                returnedCourse,
            });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error adding course to student's past courses",
                error: error,
            });
        }
    });
}
function addCurrentCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const currentSemester = (0, getCurrentSemester_1.default)();
        const { _id, department } = req.user;
        // get the course object from the database, attatch the student details(which should only contain things like course grade), then add it to students current courses instead of what your doing now.
        const { courseCode } = req.body;
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(404).json({
                    msg: "Can't add course because student does not exist",
                });
            const course = yield courseModel_1.default.findOne({ course_code: courseCode });
            if (!course)
                return res.status(404).json({
                    msg: "Can't add course because course does not exist",
                });
            // check if course already exists in student taken courses
            const courseAlrTaken = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === courseCode.toString() && course.status === "taken");
            const courseAlrInProg = (_b = student.courses) === null || _b === void 0 ? void 0 : _b.find((course) => course.courseCode === courseCode.toString() &&
                course.status === "in-progress");
            if (courseAlrTaken || courseAlrInProg)
                return res.status(409).json({
                    msg: "Course previously taken or currently in-progress",
                });
            // check if course prerequisites have been met
            if (course.course_prerequisites && course.course_prerequisites.length > 0) {
                const missingPrerequisites = course.course_prerequisites.filter((coursePrerequisite) => {
                    var _a;
                    const preReqMatch = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === coursePrerequisite &&
                        course.status === "taken");
                    return !preReqMatch;
                });
                if (missingPrerequisites.length > 0) {
                    return res.status(400).json({
                        msg: `Missing prerequisite(s): ${missingPrerequisites.join(", ")}`,
                    });
                }
            }
            // handle comm student adding internship course
            if (department === "Communication") {
                if (courseCode === "COMM 4000" || courseCode === "COMM 4100") {
                    const otherCourseCode = courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000";
                    const internshipReqInProg = (_c = student.courses) === null || _c === void 0 ? void 0 : _c.find((course) => course.courseCode === otherCourseCode &&
                        course.status === "in-progress");
                    if (internshipReqInProg) {
                        return res
                            .status(400)
                            .json({ msg: "Internship requirement already in progress" });
                    }
                }
            }
            // handle user adding concentration course. *Relevant to Comm department
            // user cant add a concentration course from a different concentration than the one they are/already taken a course in
            if (department === "Communication" && course.isConcentrationCourse) {
                let numOfConcCoursesTaken = 0;
                const allConcentrationCourses = yield courseModel_1.default
                    .find({ course_department: department, isConcentrationCourse: true })
                    .lean();
                const studentConcentrationCourses = allConcentrationCourses.filter((course) => {
                    var _a;
                    const matchingCourse = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((studentCourse) => studentCourse.courseCode === course.course_code);
                    if (matchingCourse && matchingCourse.status === "taken") {
                        numOfConcCoursesTaken++;
                    }
                    return matchingCourse;
                });
                if (numOfConcCoursesTaken == 4) {
                    return res.status(400).json({
                        msg: "You've already completed the 4 concentration courses requirement",
                    });
                }
                for (const studentCourse of studentConcentrationCourses) {
                    if (studentCourse.concentration !== course.concentration) {
                        return res.status(400).json({
                            msg: "Course(s) from a different concentration are currently or already taken, remove them if you would like to change concentration",
                        });
                    }
                    if (studentCourse.concentration_area === course.concentration_area) {
                        return res.status(400).json({
                            msg: "You can only take one course per area in this concentration",
                        });
                    }
                }
            }
            (_d = student.courses) === null || _d === void 0 ? void 0 : _d.push({
                courseCode,
                semester: currentSemester,
                status: "in-progress",
            });
            yield student.save();
            return res.status(200).json({
                msg: "Course added to current courses",
                courseCode,
            });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error adding course to student's current courses",
                error: error,
            });
        }
    });
}
function editPastCourseSemesterTaken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const { _id, department } = req.user;
        const { courseCode } = req.params;
        const { isAfstAdditionalCredCourse, newSemester } = req.body;
        if (isAfstAdditionalCredCourse && department !== "Africana Studies") {
            return res
                .status(400)
                .json({ msg: "You must be an AFST student to edit this course" });
        }
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(404).json({
                    msg: "Can't edit course semester because student does not exist",
                });
            if (isAfstAdditionalCredCourse) {
                const courseExists = (_a = student.afst_chosen_additional_major_courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === courseCode);
                if (!courseExists)
                    return res.status(404).json({ msg: "Course not found" });
                if (courseExists.semester_completed === newSemester)
                    return res.status(400).json({ msg: "New semester must be different" });
                student.afst_chosen_additional_major_courses =
                    (_b = student.afst_chosen_additional_major_courses) === null || _b === void 0 ? void 0 : _b.map((course) => {
                        if (course.courseCode === courseCode) {
                            return Object.assign(Object.assign({}, course), { semester_completed: newSemester });
                        }
                        return course;
                    });
                yield student.save();
                const updatedCourse = (_c = student.afst_chosen_additional_major_courses) === null || _c === void 0 ? void 0 : _c.find((course) => course.courseCode === courseCode);
                return res.status(200).json({
                    msg: "Course semester updated",
                    updatedSemester: updatedCourse === null || updatedCourse === void 0 ? void 0 : updatedCourse.semester_completed,
                    isAfstAddCredCourse: true,
                    courseCode: updatedCourse === null || updatedCourse === void 0 ? void 0 : updatedCourse.courseCode,
                });
            }
            const courseExists = (_d = student.courses) === null || _d === void 0 ? void 0 : _d.find((course) => course.courseCode === courseCode);
            if (!courseExists)
                return res.status(404).json({ msg: "Course not found" });
            if (courseExists.semester === newSemester)
                return res.status(400).json({ msg: "New semester must be different" });
            student.courses = (_e = student.courses) === null || _e === void 0 ? void 0 : _e.map((course) => {
                if (course.courseCode === courseCode && course.status === "taken") {
                    return Object.assign(Object.assign({}, course), { semester: newSemester });
                }
                return course;
            });
            yield student.save();
            const updatedCourse = (_f = student.courses) === null || _f === void 0 ? void 0 : _f.find((course) => course.courseCode === courseCode);
            return res.status(200).json({
                msg: "Course semester updated",
                updatedSemester: updatedCourse === null || updatedCourse === void 0 ? void 0 : updatedCourse.semester,
                courseCode: updatedCourse === null || updatedCourse === void 0 ? void 0 : updatedCourse.courseCode,
            });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error updating course semester",
                error: error,
            });
        }
    });
}
function removeCurrentCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const { _id, department } = req.user;
        const { courseCode } = req.params;
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(404).json({
                    msg: "Can't remove course because student does not exist",
                });
            const currCourseFound = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === courseCode && course.status === "in-progress");
            if (!currCourseFound)
                return res
                    .status(404)
                    .json({ msg: "Course not found in student's current courses" });
            student.courses = (_b = student.courses) === null || _b === void 0 ? void 0 : _b.filter((course) => course.courseCode !== courseCode);
            if (department === "Communication") {
                if (courseCode === "COMM 4000" || courseCode === "COMM 4100") {
                    const otherCourseCode = courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000";
                    const internshipReqCourse = (_c = student.courses) === null || _c === void 0 ? void 0 : _c.find((course) => course.courseCode === otherCourseCode && course.status === "taken");
                    if (internshipReqCourse) {
                        student.courses = (_d = student.courses) === null || _d === void 0 ? void 0 : _d.filter((course) => course.courseCode !== otherCourseCode);
                    }
                }
            }
            yield student.save();
            return res.status(200).json({
                msg: "Course removed from student's current courses",
                courseCode,
            });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error removing current course",
                error: error,
            });
        }
    });
}
function removePastCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const { _id, department } = req.user;
        const { courseCode } = req.params;
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(404).json({
                    msg: "Can't remove course because student does not exist",
                });
            const pastCourseFound = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === courseCode && course.status === "taken");
            if (!pastCourseFound)
                return res
                    .status(404)
                    .json({ msg: "Course not found in student's past courses" });
            const allDeptCourses = yield courseModel_1.default
                .find({ course_department: department })
                .lean();
            // Remove the course
            // Before removing the course check if the user has any courses taken that this course is a prereq for and if so prompt them to remove those courses before they can remove this course
            const course = yield courseModel_1.default.findOne({ course_code: courseCode });
            if (course) {
                const dependentCourseCodes = allDeptCourses
                    .filter((deptCourse) => {
                    var _a;
                    return deptCourse.course_prerequisites.includes(courseCode) &&
                        ((_a = student.courses) === null || _a === void 0 ? void 0 : _a.some((course) => course.courseCode === deptCourse.course_code &&
                            (course.status === "taken" || course.status === "in-progress")));
                })
                    .map((course) => course.course_code);
                if (dependentCourseCodes.length > 0) {
                    return res.status(400).json({
                        msg: `Cannot remove course. It is a prerequisite for: ${dependentCourseCodes.join(", ")}. Remove them first`,
                    });
                }
            }
            student.courses = (_b = student.courses) === null || _b === void 0 ? void 0 : _b.filter((course) => course.courseCode !== courseCode);
            if (department === "Communication") {
                if (courseCode === "COMM 4000" || courseCode === "COMM 4100") {
                    const otherCourseCode = courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000";
                    const internshipReqCourse = (_c = student.courses) === null || _c === void 0 ? void 0 : _c.find((course) => course.courseCode === otherCourseCode && course.status === "taken");
                    if (internshipReqCourse) {
                        student.courses = (_d = student.courses) === null || _d === void 0 ? void 0 : _d.filter((course) => course.courseCode !== otherCourseCode);
                    }
                }
            }
            // Recalculate GPA from remaining courses
            let totalQualityPoints = 0;
            let totalCredits = 0;
            for (const course of (_e = student.courses) !== null && _e !== void 0 ? _e : []) {
                if (course.status === "taken" &&
                    course.grade &&
                    course.grade !== "P/CR" &&
                    course.grade !== "N/A") {
                    const deptCourse = allDeptCourses.find((c) => c.course_code === course.courseCode);
                    if (!deptCourse)
                        continue;
                    const courseCredits = deptCourse.course_credits;
                    const gradeValue = gradeToQualityPoint[course.grade];
                    if (gradeValue !== undefined) {
                        totalCredits += courseCredits;
                        totalQualityPoints += gradeValue * courseCredits;
                    }
                }
            }
            student.gpa =
                totalCredits > 0
                    ? parseFloat((totalQualityPoints / totalCredits).toFixed(2))
                    : 0;
            yield student.save();
            return res.status(200).json({
                msg: "Course removed from student's past courses",
                courseCode,
                gpa: student.gpa,
            });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error removing past course",
                error: error,
            });
        }
    });
}
function getPastCourses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { _id, department } = req.user;
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(404).json({
                    msg: "Can't retrieve student courses because student does not exist",
                });
            const studentPastCourses = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.filter((course) => course.status === "taken");
            if (department === "Communication") {
                const commStudentPastCourses = studentPastCourses === null || studentPastCourses === void 0 ? void 0 : studentPastCourses.filter((course) => {
                    const isInternshipCourse = course.courseCode === "COMM 4000" ||
                        course.courseCode === "COMM 4100";
                    if (isInternshipCourse &&
                        course.is_internship_req_and_req_met === false) {
                        return false;
                    }
                    return true;
                });
                return res
                    .status(200)
                    .json({ past_courses: commStudentPastCourses, gpa: student.gpa });
            }
            return res
                .status(200)
                .json({ past_courses: studentPastCourses, gpa: student.gpa });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error retrieving student's past courses",
                error: error,
            });
        }
    });
}
function getCurrentCourses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { _id } = req.user;
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(404).json({
                    msg: "Can't retrieve student courses because student does not exist",
                });
            const studentCurrCourses = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.filter((course) => course.status === "in-progress");
            return res.status(200).json({ current_courses: studentCurrCourses });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error retrieving student's current courses",
                error: error,
            });
        }
    });
}
function editCourseComment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id } = req.user;
        const { courseCode } = req.params;
        const { comment } = req.body;
        try {
            const updatedStudent = yield userModel_1.default.findOneAndUpdate({ _id, "courses.courseCode": courseCode }, { $set: { "courses.$.comment": comment } }, { new: true, projection: { courses: 1 } });
            if (!updatedStudent || !updatedStudent.courses) {
                return res.status(404).json({ msg: "Course not found" });
            }
            const updatedCourse = updatedStudent === null || updatedStudent === void 0 ? void 0 : updatedStudent.courses.find((course) => course.courseCode === courseCode);
            return res.status(200).json({
                msg: "Course comment updated successfully",
                courseCode: updatedCourse === null || updatedCourse === void 0 ? void 0 : updatedCourse.courseCode,
                status: updatedCourse === null || updatedCourse === void 0 ? void 0 : updatedCourse.status,
                comment: updatedCourse.comment,
            });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error editing course comment",
                error: error,
            });
        }
    });
}
function getIncompleteCourses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { _id, department } = req.user;
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res.status(404).json({
                    msg: "Can't return incomplete courses because student is invalid",
                });
            const allDeptCourses = yield courseModel_1.default
                .find({ course_department: department, isConcentrationCourse: false })
                .lean();
            if (department === "Africana Studies") {
                const studentCourses = student.courses || [];
                // Step 1: Introductory Courses (1001–1099)
                const introCourses = allDeptCourses.filter((course) => course.isAfstIntroductory);
                // Step 2–3: Group A/B/C Courses
                const groupA = allDeptCourses.filter((course) => course.afstGroup === "a");
                const groupB = allDeptCourses.filter((course) => course.afstGroup === "b");
                const groupC = allDeptCourses.filter((course) => course.afstGroup === "c");
                const groupMap = { a: groupA, b: groupB, c: groupC };
                // Determine which group the student has the most taken/in-progress courses in
                const groupCounts = { a: 0, b: 0, c: 0 };
                for (const group of ["a", "b", "c"]) {
                    groupCounts[group] = groupMap[group].filter((c) => studentCourses.some((sc) => sc.courseCode === c.course_code &&
                        ["taken", "in-progress"].includes(sc.status))).length;
                }
                const primaryGroup = Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0][0];
                // Other groups (the two not chosen)
                const otherGroups = ["a", "b", "c"].filter((g) => g !== primaryGroup);
                // Step 4: Seminar/Independent Study (4405–5404)
                const seminarCourses = allDeptCourses.filter((course) => course.isAfstSeminar);
                // Build the list of incomplete courses
                const isIncomplete = (course) => {
                    const match = studentCourses.find((sc) => sc.courseCode === course.course_code);
                    return !match || match.status === "in-progress";
                };
                const inCompleteCourses = [
                    // 2 Intro
                    ...introCourses
                        .filter(isIncomplete)
                        .slice(0, 2)
                        .map((c) => ({
                        courseCode: c.course_code,
                    })),
                    // 12 credits from primary group (assume 3 credits/course, so 4 courses)
                    ...groupMap[primaryGroup]
                        .filter(isIncomplete)
                        .slice(0, 4)
                        .map((c) => ({ courseCode: c.course_code })),
                    // 1 course from each other group (total of 2)
                    ...otherGroups.flatMap((g) => groupMap[g]
                        .filter(isIncomplete)
                        .slice(0, 1)
                        .map((c) => ({ courseCode: c.course_code }))),
                    // 1 seminar/independent study
                    ...seminarCourses
                        .filter(isIncomplete)
                        .slice(0, 1)
                        .map((c) => ({ courseCode: c.course_code })),
                ];
                return res.status(200).json({ inCompleteCourses });
            }
            if (department === "Communication") {
                const allDeptCoursesWithConcentrationCourses = yield courseModel_1.default
                    .find({ course_department: department })
                    .lean();
                const concCourses = allDeptCoursesWithConcentrationCourses.filter((c) => c.isConcentrationCourse);
                // Find first taken or in-progress concentration course
                const selectedCourse = concCourses.find((c) => {
                    var _a;
                    return (_a = student.courses) === null || _a === void 0 ? void 0 : _a.some((s) => s.courseCode === c.course_code &&
                        ["taken", "in-progress"].includes(s.status));
                });
                // Determine concentration: student's or random
                const selectedConcentration = selectedCourse
                    ? selectedCourse.concentration
                    : [...new Set(concCourses.map((c) => c.concentration))][Math.floor(Math.random() *
                        new Set(concCourses.map((c) => c.concentration)).size)];
                // Filter and group courses in the selected concentration
                const groupedByArea = {};
                for (const c of concCourses.filter((c) => c.concentration === selectedConcentration)) {
                    if (!groupedByArea[c.concentration_area])
                        groupedByArea[c.concentration_area] = [];
                    groupedByArea[c.concentration_area].push(c);
                }
                // Randomly pick one course code per area
                const randomCodes = Object.values(groupedByArea).map((area) => area[Math.floor(Math.random() * area.length)].course_code);
                // Handle in-progress separately
                const inProgress = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((s) => concCourses.some((c) => c.course_code === s.courseCode && s.status === "in-progress"));
                // Final result: course codes only
                const recommendedCourseCodes = inProgress
                    ? [
                        inProgress.courseCode,
                        ...randomCodes.filter((code) => {
                            var _a, _b;
                            return (_b = groupedByArea[((_a = concCourses.find((c) => c.course_code === inProgress.courseCode)) === null || _a === void 0 ? void 0 : _a.concentration_area) || ""]) === null || _b === void 0 ? void 0 : _b.every((c) => c.course_code !== code);
                        }),
                    ]
                    : selectedCourse
                        ? randomCodes.filter((code) => {
                            var _a;
                            return (_a = groupedByArea[selectedCourse.concentration_area]) === null || _a === void 0 ? void 0 : _a.every((c) => c.course_code !== code);
                        })
                        : randomCodes;
                const inCompleteCourses = [
                    ...allDeptCourses
                        .filter((deptCourse) => {
                        var _a;
                        const matchingCourse = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === deptCourse.course_code);
                        return !matchingCourse || matchingCourse.status === "in-progress";
                    })
                        .map((incompleteCourse) => ({
                        courseCode: incompleteCourse.course_code,
                    })),
                    ...recommendedCourseCodes.map((code) => ({ courseCode: code })),
                ];
                return res.status(200).json({ inCompleteCourses });
            }
            const inCompleteCourses = allDeptCourses
                .filter((deptCourse) => {
                var _a;
                const matchingCourse = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === deptCourse.course_code);
                return !matchingCourse || matchingCourse.status === "in-progress";
            })
                .map((incompleteCourse) => ({
                courseCode: incompleteCourse.course_code,
            }));
            return res.status(200).json({ inCompleteCourses });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error retrieving student's incomplete courses",
                error: error,
            });
        }
    });
}
// for getDesiredGPA() purpose
const gradeToQualityPoint = {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    "D-": 0.7,
    F: 0.0,
    "P/CR": null,
    "N/A": null,
};
function getDesiredGPA(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        const { desiredGPA } = req.body;
        if (parseFloat(desiredGPA) < 0 || parseFloat(desiredGPA) > 4)
            return res
                .status(400)
                .json({ msg: "Desired gpa must be between 0 and 4.0" });
        try {
            const student = yield userModel_1.default.findById(_id).select("courses");
            if (!student)
                return res.status(404).json({ msg: "Student does not exist" });
            const studentCourses = student.courses;
            const allDeptCourses = yield courseModel_1.default
                .find({ course_department: department, isConcentrationCourse: false })
                .lean();
            const inCompleteCourses = allDeptCourses.filter((deptCourse) => {
                const matchingCourse = studentCourses === null || studentCourses === void 0 ? void 0 : studentCourses.find((course) => course.courseCode === deptCourse.course_code);
                return !matchingCourse || matchingCourse.status === "in-progress";
            });
            // *calculate lowest & highest possible gpa and check if desired gpa falls within that range*
            let totalStudentsQP = 0;
            let totalStudentCreds = 0;
            let totalIncompleteLowerBoundQP = 0;
            let totalIncompleteLowerBoundCreds = 0;
            let totalIncompleteUpperBoundQP = 0;
            let totalIncompleteUpperBoundCreds = 0;
            // for including concentration credits for comm students
            if (department === "Communication") {
                let numOfConcCoursesTaken = 0;
                const allConcentrationCourses = yield courseModel_1.default
                    .find({ course_department: department, isConcentrationCourse: true })
                    .lean();
                allConcentrationCourses.forEach((course) => {
                    var _a;
                    const concCourseTaken = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((studentCourse) => studentCourse.courseCode === course.course_code &&
                        studentCourse.status === "taken");
                    if (concCourseTaken && concCourseTaken.grade !== undefined) {
                        numOfConcCoursesTaken++;
                        // Only include in GPA if not P/CR
                        if (concCourseTaken.grade !== "P/CR") {
                            const qualityPoint = gradeToQualityPoint[concCourseTaken.grade];
                            if (qualityPoint !== null) {
                                const currCourseQP = 3 * qualityPoint;
                                totalStudentsQP += currCourseQP;
                                totalStudentCreds += 3;
                            }
                        }
                    }
                });
                let numOfIncompleteConcCourses = 4 - numOfConcCoursesTaken;
                totalIncompleteLowerBoundCreds += numOfIncompleteConcCourses * 3;
                totalIncompleteUpperBoundQP += numOfIncompleteConcCourses * 3 * 4.0;
                totalIncompleteUpperBoundCreds += numOfIncompleteConcCourses * 3;
            }
            // for including different course group credits for afst students
            if (department === "Africana Studies") {
                const allAFSTCourses = yield courseModel_1.default
                    .find({ course_department: department })
                    .lean();
                const introCourses = allAFSTCourses.filter((course) => course.isAfstIntroductory);
                const seminarCourses = allAFSTCourses.filter((course) => course.isAfstSeminar);
                // Build groups
                const groupA = allAFSTCourses.filter((course) => course.afstGroup === "a");
                const groupB = allAFSTCourses.filter((course) => course.afstGroup === "b");
                const groupC = allAFSTCourses.filter((course) => course.afstGroup === "c");
                const groupMap = { a: groupA, b: groupB, c: groupC };
                const groupCounts = { a: 0, b: 0, c: 0 };
                for (const groupKey of ["a", "b", "c"]) {
                    groupCounts[groupKey] = groupMap[groupKey].filter((course) => studentCourses === null || studentCourses === void 0 ? void 0 : studentCourses.some((studentCourse) => studentCourse.courseCode === course.course_code &&
                        studentCourse.status === "taken" &&
                        studentCourse.grade !== "P/CR" &&
                        studentCourse.grade !== "N/A")).length;
                }
                const primaryGroup = Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0][0];
                const otherGroups = ["a", "b", "c"].filter((g) => g !== primaryGroup);
                introCourses.forEach((course) => {
                    const studentCourse = studentCourses === null || studentCourses === void 0 ? void 0 : studentCourses.find((studentCourse) => studentCourse.courseCode === course.course_code &&
                        studentCourse.status === "taken" &&
                        studentCourse.grade !== "P/CR" &&
                        studentCourse.grade !== "N/A");
                    if (studentCourse && studentCourse.grade) {
                        const qp = gradeToQualityPoint[studentCourse.grade];
                        if (qp !== null) {
                            totalStudentsQP += course.course_credits * qp;
                            totalStudentCreds += course.course_credits;
                        }
                    }
                });
                // 1. Primary Group Courses (12 credits = 4 courses)
                let numPrimaryTaken = 0;
                groupMap[primaryGroup].forEach((course) => {
                    const studentCourse = studentCourses === null || studentCourses === void 0 ? void 0 : studentCourses.find((studentCourse) => studentCourse.courseCode === course.course_code &&
                        studentCourse.status === "taken" &&
                        studentCourse.grade !== "P/CR" &&
                        studentCourse.grade !== "N/A");
                    if (studentCourse && studentCourse.grade) {
                        const qp = gradeToQualityPoint[studentCourse.grade];
                        if (qp !== null) {
                            totalStudentsQP += course.course_credits * qp;
                            totalStudentCreds += course.course_credits;
                        }
                        numPrimaryTaken++;
                    }
                });
                const numIncompletePrimary = 4 - numPrimaryTaken;
                totalIncompleteLowerBoundCreds += numIncompletePrimary * 3;
                totalIncompleteUpperBoundQP += numIncompletePrimary * 3 * 4.0;
                totalIncompleteUpperBoundCreds += numIncompletePrimary * 3;
                // 2. One course from each of the two other groups
                otherGroups.forEach((groupKey) => {
                    const course = groupMap[groupKey].find((course) => studentCourses === null || studentCourses === void 0 ? void 0 : studentCourses.some((sc) => sc.courseCode === course.course_code &&
                        sc.status === "taken" &&
                        sc.grade !== "P/CR" &&
                        sc.grade !== "N/A"));
                    if (course) {
                        const studentCourse = studentCourses === null || studentCourses === void 0 ? void 0 : studentCourses.find((sc) => sc.courseCode === course.course_code);
                        if (studentCourse && studentCourse.grade !== undefined) {
                            const qp = gradeToQualityPoint[studentCourse.grade];
                            if (qp !== null) {
                                totalStudentsQP += course.course_credits * qp;
                                totalStudentCreds += course.course_credits;
                            }
                        }
                    }
                    else {
                        totalIncompleteLowerBoundCreds += 3;
                        totalIncompleteUpperBoundQP += 3 * 4.0;
                        totalIncompleteUpperBoundCreds += 3;
                    }
                });
                // 3. Seminar or Writing-Intensive
                const seminarTaken = seminarCourses.find((course) => studentCourses === null || studentCourses === void 0 ? void 0 : studentCourses.some((sc) => sc.courseCode === course.course_code &&
                    sc.status === "taken" &&
                    sc.grade !== "P/CR" &&
                    sc.grade !== "N/A"));
                if (seminarTaken) {
                    const studentCourse = studentCourses === null || studentCourses === void 0 ? void 0 : studentCourses.find((sc) => sc.courseCode === seminarTaken.course_code);
                    if (studentCourse && studentCourse.grade !== undefined) {
                        const qp = gradeToQualityPoint[studentCourse.grade];
                        if (qp !== null) {
                            totalStudentsQP += seminarTaken.course_credits * qp;
                            totalStudentCreds += seminarTaken.course_credits;
                        }
                    }
                }
                else {
                    totalIncompleteLowerBoundCreds += 3;
                    totalIncompleteUpperBoundQP += 3 * 4.0;
                    totalIncompleteUpperBoundCreds += 3;
                }
                const lowerBoundGpa = ((totalStudentsQP + totalIncompleteLowerBoundQP) /
                    (totalStudentCreds + totalIncompleteLowerBoundCreds)).toFixed(2);
                const upperBoundGpa = ((totalStudentsQP + totalIncompleteUpperBoundQP) /
                    (totalStudentCreds + totalIncompleteUpperBoundCreds)).toFixed(2);
                if (desiredGPA < lowerBoundGpa || desiredGPA > upperBoundGpa)
                    return res.status(200).json({
                        msg: "Desired GPA is outside the possible range.",
                        desiredGPA,
                        lowerBoundGpa,
                        upperBoundGpa,
                    });
                return res.status(200).json({ msg: "Your desired gpa is achievable" });
            }
            // join dept courses with student taken courses to get course credit info from allDeptCourses for calculating students total credits & total quality points(QP)
            allDeptCourses.map((deptCourse) => {
                const matchingCourse = studentCourses === null || studentCourses === void 0 ? void 0 : studentCourses.find((course) => course.courseCode === deptCourse.course_code);
                // calculate students total credits & total quality points(QP)
                if (matchingCourse) {
                    if ((matchingCourse === null || matchingCourse === void 0 ? void 0 : matchingCourse.grade) !== undefined &&
                        matchingCourse.grade !== "P/CR" &&
                        matchingCourse.grade !== "N/A") {
                        const currCourseQP = deptCourse.course_credits *
                            gradeToQualityPoint[matchingCourse.grade];
                        totalStudentsQP += currCourseQP;
                        totalStudentCreds += deptCourse.course_credits;
                    }
                }
            });
            // calculate lower/upper gpa bound with incomplete courses
            inCompleteCourses.map((course) => {
                // lower bound calc
                totalIncompleteLowerBoundQP += course.course_credits * 0.0;
                totalIncompleteLowerBoundCreds += course.course_credits;
                // upper bound calc
                totalIncompleteUpperBoundQP += course.course_credits * 4.0;
                totalIncompleteUpperBoundCreds += course.course_credits;
            });
            const lowerBoundGpa = ((totalStudentsQP + totalIncompleteLowerBoundQP) /
                (totalStudentCreds + totalIncompleteLowerBoundCreds)).toFixed(2);
            const upperBoundGpa = ((totalStudentsQP + totalIncompleteUpperBoundQP) /
                (totalStudentCreds + totalIncompleteUpperBoundCreds)).toFixed(2);
            if (desiredGPA < lowerBoundGpa || desiredGPA > upperBoundGpa)
                return res.status(200).json({
                    msg: "Desired GPA is outside the possible range.",
                    desiredGPA,
                    lowerBoundGpa,
                    upperBoundGpa,
                });
            return res.status(200).json({ msg: "Your desired gpa is achievable" });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error calculating course grades for desired gpa",
                error: error,
            });
        }
    });
}
function getGPAEstimator(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        const { whatIfCourses } = req.body;
        try {
            const student = yield userModel_1.default.findById(_id);
            if (!student)
                return res
                    .status(404)
                    .json({ msg: "Can't estimate gpa because student doesn't exist" });
            const deptCourses = yield courseModel_1.default
                .find({ course_department: department })
                .lean();
            let studentTotalQP = 0;
            let studentTotalCredits = 0;
            // join dept courses with student taken courses to get course credit info from deptCourses for calculating students total credits & total quality points(QP)
            deptCourses.map((deptCourse) => {
                var _a;
                const matchingCourse = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === deptCourse.course_code);
                // calculate students total credits & total quality points(QP)
                if (matchingCourse) {
                    if ((matchingCourse === null || matchingCourse === void 0 ? void 0 : matchingCourse.grade) !== undefined &&
                        (matchingCourse === null || matchingCourse === void 0 ? void 0 : matchingCourse.grade) !== "P/CR" &&
                        (matchingCourse === null || matchingCourse === void 0 ? void 0 : matchingCourse.grade) !== "N/A") {
                        const currCourseQP = deptCourse.course_credits *
                            gradeToQualityPoint[matchingCourse.grade];
                        studentTotalQP += currCourseQP;
                        studentTotalCredits += deptCourse.course_credits;
                    }
                }
            });
            // prevent AFST students from using whatIfCourses past the 27 AFST Credits
            if (department === "Africana Studies") {
                let whatIfCourseTotalCredits = 0;
                for (const whatIfCourse of whatIfCourses) {
                    const matchingCourse = deptCourses.find((deptCourse) => deptCourse.course_code === whatIfCourse.courseCode);
                    if (matchingCourse &&
                        matchingCourse.course_credits &&
                        whatIfCourse.estimatedGrade !== undefined &&
                        whatIfCourse.estimatedGrade !== "") {
                        whatIfCourseTotalCredits += matchingCourse.course_credits;
                        if (studentTotalCredits + whatIfCourseTotalCredits > 27) {
                            return res.status(400).json({
                                msg: "Only up to 27 credits, including your past courses credits, are relevant to your GPA. Remove or change additional GPA estimator courses",
                            });
                        }
                    }
                }
            }
            let totalEstimatedQP = 0;
            let totalEstimatedCreds = 0;
            for (const whatIfCourse of whatIfCourses) {
                if (whatIfCourse.estimatedGrade === undefined ||
                    whatIfCourse.estimatedGrade === "")
                    continue;
                const matchingCourse = deptCourses.find((deptCourse) => deptCourse.course_code === whatIfCourse.courseCode);
                if (!matchingCourse) {
                    return res.status(400).json({
                        msg: `Course ${whatIfCourse.courseCode} doesn't belong to ${department}`,
                    });
                }
                if (whatIfCourse.estimatedGrade === "P/CR" ||
                    whatIfCourse.estimatedGrade === "N/A") {
                    return res.status(400).json({
                        msg: `Invalid course grade for ${whatIfCourse.courseCode}`,
                    });
                }
                totalEstimatedQP +=
                    matchingCourse.course_credits *
                        gradeToQualityPoint[whatIfCourse.estimatedGrade];
                totalEstimatedCreds += matchingCourse.course_credits;
            }
            let msg;
            let change;
            if (student.gpa !== undefined && student.gpa > 0) {
                const estimatedGPA = parseFloat(((studentTotalQP + totalEstimatedQP) /
                    (studentTotalCredits + totalEstimatedCreds)).toFixed(2));
                const percentDiff = ((Math.abs(estimatedGPA - student.gpa) / student.gpa) *
                    100).toFixed(2);
                if (estimatedGPA > student.gpa) {
                    msg = `Receiving these grade(s) would boost your GPA by ${percentDiff}%`;
                    change = "gain";
                }
                else if (estimatedGPA < student.gpa) {
                    msg = `Receiving these grade(s) would drop your GPA by ${percentDiff}%`;
                    change = "loss";
                }
                else {
                    msg = `Receiving these grades(s) would keep your GPA the same`;
                    change = "";
                }
                return res.status(200).json({ estimatedGPA, msg, change });
            }
            else if (student.gpa === 0) {
                const estimatedGPA = parseFloat(((studentTotalQP + totalEstimatedQP) /
                    (studentTotalCredits + totalEstimatedCreds)).toFixed(2));
                return res.status(200).json({
                    estimatedGPA,
                });
            }
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error calculating estimated gpa", error: error });
        }
    });
}
// AFST major's additional 18 credit controllers
function getAFSTChosenMajor(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        if (department !== "Africana Studies")
            return res.status(401).json({ msg: "Must be a AFST student" });
        try {
            const afstStudent = yield userModel_1.default.findOne({
                _id: _id,
                department: department,
            });
            if (!afstStudent)
                return res.status(404).json({ msg: "Invalid student" });
            if (!afstStudent.afst_chosen_additional_major)
                return res
                    .status(400)
                    .json({ msg: "You haven't chosen an additional major yet" });
            return res
                .status(200)
                .json({ additionalMajor: afstStudent.afst_chosen_additional_major });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error getting additional major", error: error });
        }
    });
}
function createAFSTChosenAddMajor(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        const { additionalMajor } = req.body;
        if (department !== "Africana Studies")
            return res.status(401).json({ msg: "Must be a AFST student" });
        try {
            const afstStudent = yield userModel_1.default.findOne({
                _id: _id,
                department: department,
            });
            if (!afstStudent)
                return res.status(404).json({ msg: "Invalid student" });
            if (afstStudent.afst_chosen_additional_major)
                return res
                    .status(400)
                    .json({ msg: "You already have a chosen additional major" });
            afstStudent.afst_chosen_additional_major = additionalMajor;
            yield afstStudent.save();
            return res
                .status(200)
                .json({ msg: "Additional major added", additionalMajor });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error adding additional major", error: error });
        }
    });
}
function updateAFSTChosenAddMajor(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        const { newAdditionalMajor } = req.body;
        if (department !== "Africana Studies")
            return res.status(401).json({ msg: "Must be a AFST student" });
        try {
            const afstStudent = yield userModel_1.default.findOne({
                _id: _id,
                department: department,
            });
            if (!afstStudent)
                return res.status(404).json({ msg: "Invalid student" });
            afstStudent.afst_chosen_additional_major = newAdditionalMajor;
            afstStudent.afst_chosen_additional_major_courses = [];
            afstStudent.afst_chosen_additional_major_credits_completed = false;
            yield afstStudent.save();
            return res.status(200).json({
                msg: "Additional major changed",
                newAdditionalMajor,
                newAddMajorCourses: afstStudent.afst_chosen_additional_major_courses,
                addMajorCompleted: afstStudent.afst_chosen_additional_major_credits_completed,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error updating additional major", error: error });
        }
    });
}
function getAFSTAdditionalCourses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        if (department !== "Africana Studies")
            return res.status(401).json({ msg: "Must be a AFST student" });
        try {
            const afstStudent = yield userModel_1.default.findOne({
                _id: _id,
                department: department,
            });
            if (!afstStudent)
                return res.status(404).json({ msg: "Invalid student" });
            if (!afstStudent.afst_chosen_additional_major_courses ||
                afstStudent.afst_chosen_additional_major_courses.length === 0) {
                return res.status(400).json({ msg: "No additional courses found" });
            }
            return res.status(200).json({
                additionalCourses: afstStudent.afst_chosen_additional_major_courses,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error getting additional credits course", error: error });
        }
    });
}
function createAFSTAddCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const { _id, department } = req.user;
        if (department !== "Africana Studies")
            return res.status(401).json({ msg: "Must be a AFST student" });
        const { courseCode } = req.params;
        const { grade, semesterCompleted, credits } = req.body;
        if (!courseCode.trim())
            return res.status(400).json({ msg: "Course code is missing" });
        if (courseCode.trim().length > 10)
            return res.status(400).json({ msg: "Course code is too long" });
        if (department !== "Africana Studies")
            return res.status(401).json({ msg: "Must be a AFST student" });
        if (!grade)
            return res.status(400).json({ msg: "Must provide a grade" });
        if (!semesterCompleted)
            return res.status(400).json({
                msg: "Must provide a semester for which you have taken this course",
            });
        if (credits < 1 || credits > 4 || !credits)
            return res.status(400).json({ msg: "Invalid credits" });
        try {
            const afstStudent = yield userModel_1.default.findOne({
                _id: _id,
                department: department,
            });
            if (!afstStudent)
                return res.status(404).json({ msg: "Invalid student" });
            if (afstStudent.afst_chosen_additional_major_credits_completed) {
                return res.status(400).json({
                    msg: "You've already reached the additional 18 credits requirement",
                });
            }
            const courseExists = (_a = afstStudent.afst_chosen_additional_major_courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === courseCode);
            if (courseExists)
                return res
                    .status(400)
                    .json({ msg: "This course already exists in your additional courses" });
            (_b = afstStudent.afst_chosen_additional_major_courses) === null || _b === void 0 ? void 0 : _b.push({
                courseCode: courseCode,
                grade: grade,
                semester_completed: semesterCompleted,
                credits: credits,
            });
            let totalAdditionalMajorCredits = 0;
            (_c = afstStudent.afst_chosen_additional_major_courses) === null || _c === void 0 ? void 0 : _c.forEach((course) => (totalAdditionalMajorCredits += course.credits));
            if (totalAdditionalMajorCredits >= 18) {
                afstStudent.afst_chosen_additional_major_credits_completed = true;
            }
            yield afstStudent.save();
            const returnedCourse = {
                courseCode: courseCode,
                grade: grade,
                semester_completed: semesterCompleted,
                credits: credits,
            };
            return res.status(200).json({
                msg: "Additional credits course added",
                returnedCourse,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error adding additional credits course", error: error });
        }
    });
}
function deleteAFSTAddCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { _id, department } = req.user;
        const { courseCode } = req.params;
        if (department !== "Africana Studies")
            return res.status(401).json({ msg: "Must be a AFST student" });
        try {
            const afstStudent = yield userModel_1.default.findOne({
                _id: _id,
                department: department,
            });
            if (!afstStudent)
                return res.status(404).json({ msg: "Invalid student" });
            const courseExists = (_a = afstStudent.afst_chosen_additional_major_courses) === null || _a === void 0 ? void 0 : _a.find((course) => course.courseCode === courseCode);
            if (!courseExists)
                return res
                    .status(404)
                    .json({ msg: "This course does not exist in your additional courses" });
            afstStudent.afst_chosen_additional_major_courses =
                (_b = afstStudent.afst_chosen_additional_major_courses) === null || _b === void 0 ? void 0 : _b.filter((course) => course.courseCode !== courseCode);
            yield afstStudent.save();
            return res.status(200).json({
                msg: "Additional credits course removed",
                removedCourseCode: courseCode,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error removing additional credits course", error: error });
        }
    });
}
