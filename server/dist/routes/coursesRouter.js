"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const courseController_1 = require("../controllers/courseController");
const authenticateAdmin_1 = __importDefault(require("../middleware/authenticateAdmin"));
const authenticateToken_1 = __importDefault(require("../middleware/authenticateToken"));
const router = express_1.default.Router();
// get all courses
router.get("/", authenticateToken_1.default, courseController_1.getAllCourses);
// add a course
router.post("/create-course", authenticateToken_1.default, authenticateAdmin_1.default, courseController_1.createCourse);
// get a course
router.get("/course/:courseCode", authenticateToken_1.default, courseController_1.getACourse);
// update a course
router.patch("/update-course/:courseCode", authenticateToken_1.default, authenticateAdmin_1.default, courseController_1.updateCourse);
// delete a course
router.delete("/delete-course/:courseCode", authenticateToken_1.default, authenticateAdmin_1.default, courseController_1.deleteACourse);
exports.default = router;
