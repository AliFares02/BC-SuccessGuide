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
exports.signUpAdmin = signUpAdmin;
exports.loginAdmin = loginAdmin;
exports.getAdminAccount = getAdminAccount;
exports.updateAdminAccount = updateAdminAccount;
exports.getAllStudents = getAllStudents;
exports.getAvgStudentGPA = getAvgStudentGPA;
exports.getAllCoursesWithEnrollmentCt = getAllCoursesWithEnrollmentCt;
exports.getCourseEnrollees = getCourseEnrollees;
exports.unenrollStudentFromCourse = unenrollStudentFromCourse;
exports.getCourseComments = getCourseComments;
exports.getAllActivitiesWithNumOfCurrEngaged = getAllActivitiesWithNumOfCurrEngaged;
exports.getListOfInactiveStudentsForCurrentSem = getListOfInactiveStudentsForCurrentSem;
exports.getActivityActiveStudents = getActivityActiveStudents;
const userModel_1 = __importDefault(require("../models/userModel"));
const activityModel_1 = __importDefault(require("../models/activityModel"));
const courseModel_1 = __importDefault(require("../models/courseModel"));
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const validator_1 = __importDefault(require("validator"));
const getCurrentSemester_1 = __importDefault(require("../utils/getCurrentSemester"));
function createToken(_id, email, role, department) {
    const secret = process.env.JWT_SECRET;
    return jsonwebtoken_1.default.sign({ _id, email, role, department }, secret, {
        expiresIn: "1d",
    });
}
function signUpAdmin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password, department } = req.body;
        if (!email || !password || !department)
            return res.status(401).json({ msg: "Missing credentials" });
        if (!email.trim() || !password.trim() || !department)
            return res.status(401).json({ msg: "Missing credentials" });
        if (!validator_1.default.isEmail(email))
            return res.status(401).json({ msg: "Invalid email" });
        if (!validator_1.default.isStrongPassword(password))
            return res.status(401).json({ msg: "Invalid password" });
        try {
            const userExists = yield userModel_1.default.findOne({ email: email });
            if (userExists)
                return res.status(409).json({ msg: "Email already in use" });
            const salt = yield bcrypt_1.default.genSalt(10);
            const hash = yield bcrypt_1.default.hash(password, salt);
            const admin = yield userModel_1.default.create({
                email,
                hashed_password: hash,
                role: "admin",
                department,
            });
            const token = createToken(admin._id.toString(), admin.email, admin.role, admin.department);
            return res.status(200).json({
                msg: "Admin created",
                email: admin.email,
                department: admin.department,
                access_token: token,
            });
        }
        catch (error) {
            return res.status(500).json({ msg: "Error creating admin", error: error });
        }
    });
}
function loginAdmin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(401).json({ msg: "Missing credentials" });
        if (!email.trim() || !password.trim())
            return res.status(401).json({ msg: "Missing credentials" });
        try {
            const admin = yield userModel_1.default.findOne({ email: email, role: "admin" });
            if (!admin)
                return res.status(404).json({ msg: "Invalid credentials" });
            const matchingPassword = yield bcrypt_1.default.compare(password, admin.hashed_password);
            if (!matchingPassword)
                return res.status(401).json({ msg: "Invalid credentials" });
            const token = createToken(admin._id.toString(), admin.email, admin.role, admin.department);
            return res.status(200).json({
                msg: "Login successful",
                email: admin.email,
                department: admin.department,
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
function getAdminAccount(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        try {
            const admin = yield userModel_1.default.findOne({ _id, department });
            if (!admin)
                return res.status(404).json({ msg: "Invalid admin" });
            const adminAcct = {
                email: admin.email,
            };
            return res.status(200).json(adminAcct);
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error retrieving student account, please try again later",
                error: error,
            });
        }
    });
}
function updateAdminAccount(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { _id, department } = req.user;
        const { updatedAdminAcctInfo } = req.body;
        const parsedUpdates = {};
        try {
            const admin = yield userModel_1.default.findOne({ _id, department });
            if (!admin)
                return res.status(400).json({ msg: "Invalid student" });
            if ((_a = updatedAdminAcctInfo === null || updatedAdminAcctInfo === void 0 ? void 0 : updatedAdminAcctInfo.email) === null || _a === void 0 ? void 0 : _a.trim()) {
                if (!validator_1.default.isEmail(updatedAdminAcctInfo.email.trim())) {
                    return res.status(401).json("Invalid email");
                }
                parsedUpdates.email = updatedAdminAcctInfo.email.trim();
            }
            if ((_b = updatedAdminAcctInfo === null || updatedAdminAcctInfo === void 0 ? void 0 : updatedAdminAcctInfo.password) === null || _b === void 0 ? void 0 : _b.trim()) {
                const samePassword = yield bcrypt_1.default.compare(updatedAdminAcctInfo.password.trim(), admin.hashed_password);
                if (samePassword) {
                    return res.status(400).json({
                        msg: "New password must be different from the current password.",
                    });
                }
                if (!validator_1.default.isStrongPassword(updatedAdminAcctInfo.password.trim())) {
                    return res.status(401).json({ msg: "Invalid password" });
                }
                const salt = yield bcrypt_1.default.genSalt(10);
                const hash = yield bcrypt_1.default.hash(updatedAdminAcctInfo.password.trim(), salt);
                parsedUpdates.hashed_password = hash;
            }
            admin.set(parsedUpdates);
            yield admin.save();
            const { email } = admin.toObject();
            return res.status(200).json({
                msg: "Admin account updated",
                admin: { email },
            });
        }
        catch (error) {
            return res.status(500).json({
                msg: "Error updating admin account, please try again later",
                error: error,
            });
        }
    });
}
function getAllStudents(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : "name";
        const order = req.query.order === "desc" ? -1 : 1;
        const skip = (page - 1) * limit;
        try {
            const admin = yield userModel_1.default.findById(_id);
            if (!admin)
                return res.status(404).json({ msg: "Invalid admin" });
            const students = yield userModel_1.default
                .find({ role: "student", department: department })
                .populate("activities.activityId", "activity_description")
                .sort({ [sortBy]: order })
                .skip(skip)
                .limit(limit)
                .select("_id name email department year gpa courses activities")
                .lean();
            const total = yield userModel_1.default.countDocuments({
                role: "student",
                department: department,
            });
            if (department === "Communication") {
                const commConcCourses = yield courseModel_1.default
                    .find({ course_department: department, isConcentrationCourse: true })
                    .lean();
                const commStudents = students.map((student) => {
                    var _a, _b;
                    const chosenConcentration = (_a = commConcCourses.find((course) => {
                        var _a;
                        return (_a = student.courses) === null || _a === void 0 ? void 0 : _a.find((stdntCourse) => stdntCourse.courseCode === course.course_code &&
                            stdntCourse.status === "taken");
                    })) === null || _a === void 0 ? void 0 : _a.concentration;
                    const studentCommCourses = (_b = student.courses) === null || _b === void 0 ? void 0 : _b.map((stdntCourse) => {
                        const isConcCourse = commConcCourses.find((course) => course.course_code === stdntCourse.courseCode &&
                            stdntCourse.status === "taken");
                        if (isConcCourse) {
                            return Object.assign(Object.assign({}, stdntCourse), { concentration: isConcCourse.concentration });
                        }
                        return stdntCourse;
                    });
                    if (chosenConcentration &&
                        studentCommCourses &&
                        (studentCommCourses === null || studentCommCourses === void 0 ? void 0 : studentCommCourses.length) > 0) {
                        return Object.assign(Object.assign({}, student), { courses: studentCommCourses, concentration: chosenConcentration });
                    }
                    return student;
                });
                return res.status(200).json({
                    students: commStudents,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalStudents: total,
                });
            }
            return res.status(200).json({
                students,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalStudents: total,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error retrieving students", error: error });
        }
    });
}
function getAvgStudentGPA(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        try {
            const admin = yield userModel_1.default.findById(_id);
            if (!admin)
                return res.status(404).json({ msg: "Invalid admin" });
            const students = yield userModel_1.default
                .find({ role: "student", department: department })
                .select("gpa")
                .lean();
            const studentsWithGPA = students.filter((students) => students.gpa && students.gpa > 0);
            const totalStudentsWithGPA = studentsWithGPA.length;
            let gpaSum = 0;
            for (const student of studentsWithGPA) {
                if (student.gpa) {
                    gpaSum += student.gpa;
                }
            }
            const averageGPA = totalStudentsWithGPA > 0
                ? parseFloat((gpaSum / totalStudentsWithGPA).toFixed(2))
                : 0;
            return res.status(200).json({
                averageGPA,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error retrieving average student gpa", error: error });
        }
    });
}
function getAllCoursesWithEnrollmentCt(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { department } = req.user;
        //perform conditional check to see if department is COMM and if it is, query the concentration courses as a separate list and return it as well as the core courses
        try {
            const courses = yield courseModel_1.default
                .find({
                course_department: department,
            })
                .lean();
            if (!courses || courses.length == 0) {
                return res.status(404).json({ msg: "No courses found" });
            }
            const courseCodes = courses.map((course) => course.course_code);
            const nonConcCourses = courses.filter((course) => !course.isConcentrationCourse);
            const nonConcCourseCodes = nonConcCourses.map((course) => course.course_code);
            const existingPrereqStructure = new Map();
            courses.forEach((course) => {
                if (!course.isConcentrationCourse) {
                    existingPrereqStructure.set(course.course_code, course.course_prerequisites || []);
                }
            });
            const enrollmentCts = yield userModel_1.default.aggregate([
                { $unwind: "$courses" },
                {
                    $match: {
                        "courses.courseCode": { $in: courseCodes },
                        "courses.status": "in-progress",
                    },
                },
                {
                    $group: {
                        _id: "$courses.courseCode",
                        count: { $sum: 1 },
                    },
                },
            ]);
            const countsMap = new Map(enrollmentCts.map((courseWithEnrollment) => [
                courseWithEnrollment._id,
                courseWithEnrollment.count,
            ]));
            const coursesWithDetailsAndCounts = courses
                .map((course) => (Object.assign(Object.assign({}, course), { enrollmentCount: countsMap.get(course.course_code) || 0 })))
                .sort((courseA, courseB) => courseA.course_code.localeCompare(courseB.course_code, undefined, {
                numeric: true,
            }));
            return res.status(200).json({
                coursesWithDetailsAndCounts,
                availablePrereqs: nonConcCourseCodes,
                existingPrereqStructure: Object.fromEntries(existingPrereqStructure),
            });
        }
        catch (error) {
            return res.status(400).json({ error: error });
        }
    });
}
function getCourseEnrollees(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        const { courseCode } = req.params;
        try {
            const admin = yield userModel_1.default.findById(_id);
            if (!admin)
                return res.status(404).json({ msg: "Invalid admin" });
            const course = yield courseModel_1.default.findOne({
                course_code: courseCode,
                course_department: department,
            });
            if (!course)
                return res.status(404).json({ msg: "Invalid course" });
            const enrollees = yield userModel_1.default
                .find({
                courses: {
                    $elemMatch: {
                        courseCode: courseCode,
                        status: "in-progress",
                    },
                },
            })
                .select("gpa name _id")
                .lean();
            const enrolleesWithGPA = enrollees.filter((enrollees) => enrollees.gpa && enrollees.gpa > 0);
            const totalEnrolled = enrolleesWithGPA.length;
            let gpaSum = 0;
            for (const enrollee of enrolleesWithGPA) {
                if (enrollee.gpa) {
                    gpaSum += enrollee.gpa;
                }
            }
            const averageGPA = totalEnrolled > 0 ? parseFloat((gpaSum / totalEnrolled).toFixed(2)) : 0;
            return res.status(200).json({ enrollees, averageGPA });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error retrieving enrollees", error: error });
        }
    });
}
function unenrollStudentFromCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { _id, department } = req.user;
        const { courseCode, studentId } = req.params;
        try {
            const admin = yield userModel_1.default.findById(_id);
            if (!admin)
                return res.status(404).json({ msg: "Invalid admin" });
            const student = yield userModel_1.default.findOne({
                _id: studentId,
                department: department,
            });
            if (!student)
                return res.status(404).json({ msg: "Invalid student" });
            student.courses = (_a = student.courses) === null || _a === void 0 ? void 0 : _a.filter((course) => course.courseCode !== courseCode);
            yield student.save();
            return res
                .status(200)
                .json({ msg: "Student unenrolled", student: student._id });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error unenrolling student", error: error });
        }
    });
}
function getCourseComments(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id } = req.user;
        const { courseCode } = req.params;
        try {
            const admin = yield userModel_1.default.findById(_id);
            if (!admin)
                return res.status(404).json({ msg: "Invalid admin" });
            const comments = yield userModel_1.default.aggregate([
                {
                    $unwind: "$courses",
                },
                {
                    $match: {
                        "courses.courseCode": courseCode,
                        "courses.status": "taken",
                        "courses.comment": { $exists: true, $ne: null },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        comment: "$courses.comment",
                    },
                },
            ]);
            const commentStrings = comments.map((entry) => entry.comment);
            return res.status(200).json({ commentStrings });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error retrieving course comments", error: error });
        }
    });
}
function getAllActivitiesWithNumOfCurrEngaged(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        try {
            const admin = yield userModel_1.default.findById(_id);
            if (!admin)
                return res.status(404).json({ msg: "Invalid admin" });
            const activities = yield activityModel_1.default
                .find({ activity_department: department })
                .lean();
            const results = yield Promise.all(activities.map((activity) => __awaiter(this, void 0, void 0, function* () {
                const count = yield userModel_1.default.countDocuments({
                    activities: {
                        $elemMatch: {
                            activityId: activity._id,
                            status: "in-progress",
                        },
                    },
                });
                return Object.assign(Object.assign({}, activity), { engagedStudentCount: count });
            })));
            return res.status(200).json({ activities: results });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error retrieving activities", error: error });
        }
    });
}
function getListOfInactiveStudentsForCurrentSem(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        try {
            const admin = yield userModel_1.default.findById(_id);
            if (!admin)
                return res.status(404).json({ msg: "Invalid admin" });
            const currentSemester = (0, getCurrentSemester_1.default)().split(" ")[0];
            const activities = yield activityModel_1.default
                .find({ activity_department: department, semester: currentSemester })
                .lean();
            const totalActivities = activities.length;
            const students = yield userModel_1.default
                .find({ department, role: "student" })
                .select("name email gpa activities")
                .lean();
            const studentsWithLowEngagement = students
                .filter((student) => {
                const engagedActivities = (student.activities || []).filter((activity) => activities.find((semesterActivity) => semesterActivity._id.toString() ===
                    activity.activityId.toString()));
                const ratioActiveToTotal = totalActivities === 0
                    ? 0
                    : (engagedActivities === null || engagedActivities === void 0 ? void 0 : engagedActivities.length) / totalActivities;
                return ratioActiveToTotal < 0.25;
            })
                .map((studentDetails) => ({
                name: studentDetails.name,
                email: studentDetails.email,
                gpa: studentDetails.gpa,
            }));
            const lowEngagementStudentsPercent = students.length === 0
                ? 0
                : (studentsWithLowEngagement.length / students.length) * 100;
            return res
                .status(200)
                .json({ lowEngagementStudentsPercent, studentsWithLowEngagement });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error retrieving inactive students", error: error });
        }
    });
}
function getActivityActiveStudents(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id, department } = req.user;
        const { activityId } = req.params;
        try {
            const admin = yield userModel_1.default.findById(_id);
            if (!admin)
                return res.status(404).json({ msg: "Invalid admin" });
            const activity = yield activityModel_1.default.findOne({
                _id: activityId,
                activity_department: department,
            });
            if (!activity)
                return res.status(404).json({ msg: "Invalid activity" });
            const activeStudents = yield userModel_1.default
                .find({
                activities: {
                    $elemMatch: {
                        activityId: activityId,
                        status: "in-progress",
                    },
                },
            })
                .select("_id name email")
                .lean();
            return res.status(200).json({ activeStudents });
        }
        catch (error) {
            return res
                .status(500)
                .json({ msg: "Error retrieving active students", error: error });
        }
    });
}
