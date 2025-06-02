import express from "express";
import {
  signUp,
  login,
  addActivitiesToStudent,
  updateStudentActivity,
  deleteStudentActivity,
  getStudentActivities,
  getFlowChartCourses,
  getStudentAcademicTracker,
  addPastCourse,
  addCurrentCourse,
  removeCurrentCourse,
  removePastCourse,
  getPastCourses,
  getCurrentCourses,
  getIncompleteCourses,
  getDesiredGPA,
  getGPAEstimator,
  deleteUser,
  getConcentrationCourses,
  editCourseComment,
  getStudentAccount,
  updateStudentAccount,
  requestPasswordReset,
  resetPassword,
} from "../controllers/userController";
import authenticateToken from "../middleware/authenticateToken";

const router = express.Router();

router.post("/sign-up", signUp);

router.post("/login", login);

router.get("/account", authenticateToken, getStudentAccount);

router.patch("/update-account", authenticateToken, updateStudentAccount);

router.delete("/delete-user/:id", authenticateToken, deleteUser);

router.post("/request-reset-password", requestPasswordReset);

router.post("/reset-password/:token", resetPassword);

router.post(
  "/student-activities/add-activity/:activityId",
  authenticateToken,
  addActivitiesToStudent
);

router.patch(
  "/student-activities/update-activity/:activityId",
  authenticateToken,
  updateStudentActivity
);

router.delete(
  "/student-activities/delete-activity/:activityId",
  authenticateToken,
  deleteStudentActivity
);

router.get("/student-activities", authenticateToken, getStudentActivities);

router.get("/", authenticateToken, getFlowChartCourses);

router.get("/concentration", authenticateToken, getConcentrationCourses);

router.get("/academic-tracker", authenticateToken, getStudentAcademicTracker);

router.post("/past-courses/add/:courseCode", authenticateToken, addPastCourse);

router.post("/current-courses/add", authenticateToken, addCurrentCourse);

router.delete(
  "/current-courses/remove/:courseCode",
  authenticateToken,
  removeCurrentCourse
);

router.delete(
  "/past-courses/remove/:courseCode",
  authenticateToken,
  removePastCourse
);

router.get("/past-courses", authenticateToken, getPastCourses);

router.get("/current-courses", authenticateToken, getCurrentCourses);

router.patch("/:courseCode/edit-comment", authenticateToken, editCourseComment);

router.get("/incomplete-courses", authenticateToken, getIncompleteCourses);

router.post("/desired-gpa", authenticateToken, getDesiredGPA);

router.post("/estimated-gpa", authenticateToken, getGPAEstimator);

export default router;
