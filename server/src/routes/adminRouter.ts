import express from "express";
import authenticateAdmin from "../middleware/authenticateAdmin";
import authenticateToken from "../middleware/authenticateToken";
import {
  signUpAdmin,
  loginAdmin,
  getAllStudents,
  getAvgStudentGPA,
  getAllCoursesWithEnrollmentCt,
  getCourseEnrollees,
  getAllActivitiesWithNumOfCurrEngaged,
  getActivityActiveStudents,
  getCourseComments,
  getListOfInactiveStudentsForCurrentSem,
  getAdminAccount,
  updateAdminAccount,
} from "../controllers/adminController";

const router = express.Router();

router.post("/sign-up", authenticateToken, authenticateAdmin, signUpAdmin);

router.post("/login", loginAdmin);

router.get("/account", authenticateToken, authenticateAdmin, getAdminAccount);

router.patch(
  "/update-account",
  authenticateToken,
  authenticateAdmin,
  updateAdminAccount
);

router.get("/students", authenticateToken, authenticateAdmin, getAllStudents);

router.get(
  "/average-student-gpa",
  authenticateToken,
  authenticateAdmin,
  getAvgStudentGPA
);

router.get(
  "/courses/all",
  authenticateToken,
  authenticateAdmin,
  getAllCoursesWithEnrollmentCt
);

router.get(
  "/course/:courseCode/enrollees",
  authenticateToken,
  authenticateAdmin,
  getCourseEnrollees
);

router.get(
  "/course/:courseCode/comments",
  authenticateToken,
  authenticateAdmin,
  getCourseComments
);

router.get(
  "/activities",
  authenticateToken,
  authenticateAdmin,
  getAllActivitiesWithNumOfCurrEngaged
);

router.get(
  "/semester-inactive-students",
  authenticateToken,
  authenticateAdmin,
  getListOfInactiveStudentsForCurrentSem
);

router.get(
  "/activity/:activityId/active-students",
  authenticateToken,
  authenticateAdmin,
  getActivityActiveStudents
);

export default router;
