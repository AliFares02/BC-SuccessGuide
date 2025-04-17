import express from "express";
import {
  signUp,
  login,
  addActivitiesToStudent,
  getStudentActivities,
  addPastCourse,
  addCurrentCourse,
  getPastCourses,
  getCurrentCourses,
} from "../controllers/userController";
import authenticateToken from "../middleware/authenticateToken";

const router = express.Router();

router.post("/sign-up", signUp);

router.post("/login", login);

router.post(
  "/:studentId/student-activities/add-activity",
  addActivitiesToStudent
);

router.get(
  "/:studentId/student-activities",
  authenticateToken,
  getStudentActivities
);

router.post("/:studentId/past-courses/add/:courseCode", addPastCourse);

router.post("/:studentId/current-courses/add/:courseCode", addCurrentCourse);

router.get("/:studentId/past-courses", getPastCourses);

router.get("/:studentId/current-courses", getCurrentCourses);

export default router;
