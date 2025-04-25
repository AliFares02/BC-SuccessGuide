import express from "express";
import {
  signUp,
  login,
  addActivitiesToStudent,
  getStudentAcademicTracker,
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
  "/student-activities/add-activity",
  authenticateToken,
  addActivitiesToStudent
);

router.get("/academic-tracker", authenticateToken, getStudentAcademicTracker);

router.get("/student-activities", authenticateToken, getStudentActivities);

router.post("/past-courses/add/:courseCode", authenticateToken, addPastCourse);

router.post("/current-courses/add", authenticateToken, addCurrentCourse);

router.get("/past-courses", authenticateToken, getPastCourses);

router.get("/current-courses", authenticateToken, getCurrentCourses);

export default router;
