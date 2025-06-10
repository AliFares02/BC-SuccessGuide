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
exports.getAllCourses = getAllCourses;
exports.createCourse = createCourse;
exports.getACourse = getACourse;
exports.updateCourse = updateCourse;
exports.deleteACourse = deleteACourse;
const courseModel_1 = __importDefault(require("../models/courseModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
// get all courses
function getAllCourses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { department } = req.user;
        //perform conditional check to see if department is COMM and if it is, query the concentration courses as a separate list and return it as well as the core courses
        try {
            const courses = yield courseModel_1.default.find({
                course_department: department,
            });
            if (!courses || courses.length == 0) {
                return res.status(404).json({ msg: "No courses found" });
            }
            return res.status(200).json({ courses: courses });
        }
        catch (error) {
            return res.status(400).json({ error: error });
        }
    });
}
// create a course
function createCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        const { createCourseBody } = req.body;
        const { department } = req.user;
        if (!((_a = createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_code) === null || _a === void 0 ? void 0 : _a.trim()) ||
            !((_b = createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_name) === null || _b === void 0 ? void 0 : _b.trim()) ||
            !((_c = createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_description) === null || _c === void 0 ? void 0 : _c.trim()) ||
            !((_d = String(createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_credits)) === null || _d === void 0 ? void 0 : _d.trim())) {
            return res.status(404).json({ msg: "Missing course fields" });
        }
        if (department === "Communication" &&
            createCourseBody.isConcentrationCourse) {
            if (!((_e = createCourseBody.concentration) === null || _e === void 0 ? void 0 : _e.trim()) ||
                !((_f = createCourseBody.concentration_area) === null || _f === void 0 ? void 0 : _f.trim())) {
                return res
                    .status(404)
                    .json({ msg: "Missing course concentration fields" });
            }
        }
        try {
            // logic for handling Comm concentration course addition
            if (department === "Communication" &&
                createCourseBody.isConcentrationCourse) {
                const concentrationCourseExists = yield courseModel_1.default.findOne({
                    course_code: (_g = createCourseBody.course_code) === null || _g === void 0 ? void 0 : _g.trim(),
                    course_department: department,
                });
                if (concentrationCourseExists)
                    return res
                        .status(400)
                        .json({ msg: "Concentration course already exists" });
                const concentrationCourse = yield courseModel_1.default.create({
                    course_code: (_h = createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_code) === null || _h === void 0 ? void 0 : _h.trim(),
                    course_name: (_j = createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_name) === null || _j === void 0 ? void 0 : _j.trim(),
                    course_description: (_k = createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_description) === null || _k === void 0 ? void 0 : _k.trim(),
                    course_credits: createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_credits,
                    course_department: department,
                    isConcentrationCourse: createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.isConcentrationCourse,
                    concentration: (_l = createCourseBody.concentration) === null || _l === void 0 ? void 0 : _l.trim(),
                    concentration_area: (_m = createCourseBody.concentration_area) === null || _m === void 0 ? void 0 : _m.trim(),
                });
                return res.status(200).json({
                    msg: "Concentration course successfully created!",
                    concentrationCourse,
                    enrollmentCount: 0,
                });
            }
            const courseExists = yield courseModel_1.default.findOne({
                course_code: (_o = createCourseBody.course_code) === null || _o === void 0 ? void 0 : _o.trim(),
                course_department: department,
            });
            if (courseExists)
                return res.status(400).json({ msg: "Course already exists" });
            const course = yield courseModel_1.default.create({
                course_code: (_p = createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_code) === null || _p === void 0 ? void 0 : _p.trim(),
                course_name: (_q = createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_name) === null || _q === void 0 ? void 0 : _q.trim(),
                course_description: (_r = createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_description) === null || _r === void 0 ? void 0 : _r.trim(),
                course_credits: createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_credits,
                course_department: department,
                course_prerequisites: createCourseBody === null || createCourseBody === void 0 ? void 0 : createCourseBody.course_prerequisites,
            });
            return res.status(200).json({
                msg: "Course successfully created!",
                course,
                enrollmentCount: 0,
            });
        }
        catch (error) {
            return res.status(500).json({ msg: "Error adding course", error: error });
        }
    });
}
// get a course
function getACourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { courseCode } = req.params;
        const { department } = req.user;
        try {
            const course = yield courseModel_1.default.findOne({
                course_code: courseCode,
                course_department: department,
            });
            if (!course) {
                return res.status(404).json({ msg: "Course not found" });
            }
            return res.status(200).json({ msg: "Course found", course });
        }
        catch (error) {
            return res.status(500).json({ msg: "Server error", error });
        }
    });
}
// update a course
function updateCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { courseCode } = req.params;
        const { department } = req.user;
        try {
            const course = yield courseModel_1.default.findOneAndUpdate({ course_code: courseCode, course_department: department }, Object.assign({}, req.body.updatedCourseBody), { new: true, runValidators: true });
            if (!course) {
                return res.status(404).json({ msg: "Course not found" });
            }
            const enrollmentCount = yield userModel_1.default.countDocuments({
                "courses.courseCode": courseCode,
                "courses.status": "in-progress",
            });
            return res
                .status(200)
                .json({ msg: "Course updated", course, enrollmentCount });
        }
        catch (error) {
            return res.status(500).json({ msg: "Server error", error });
        }
    });
}
// delete a course
function deleteACourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { courseCode } = req.params;
        const { department } = req.user;
        try {
            const course = yield courseModel_1.default.findOne({
                course_code: courseCode,
                course_department: department,
            });
            if (!course) {
                return res.status(404).json({ msg: "Course not found" });
            }
            const allDeptCourses = yield courseModel_1.default.find({
                course_department: department,
            });
            const dependentCourseCodes = allDeptCourses
                .filter((deptCourse) => deptCourse.course_prerequisites.includes(courseCode))
                .map((course) => course.course_code);
            if (dependentCourseCodes.length > 0) {
                return res.status(400).json({
                    msg: `Cannot remove course. It is a prerequisite for: ${dependentCourseCodes.join(", ")}. Remove them first`,
                });
            }
            yield course.deleteOne();
            return res.status(200).json({ msg: "Course deleted", courseCode });
        }
        catch (error) {
            return res.status(500).json({ msg: "Server error", error });
        }
    });
}
