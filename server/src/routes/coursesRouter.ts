import express from "express";
import {
  createCourse,
  deleteACourse,
  getACourse,
  getAllCourses,
  updateCourse,
} from "../controllers/courseController";
import authenticateAdmin from "../middleware/authenticateAdmin";
import authenticateToken from "../middleware/authenticateToken";

const router = express.Router();

// get all courses
// remember to change this to only allow users with student role to access this endpoint
router.get("/", authenticateToken, getAllCourses);

// add a course
router.post(
  "/create-course",
  authenticateToken,
  authenticateAdmin,
  createCourse
);

// get a course
router.get("/course/:courseCode", authenticateToken, getACourse);

// update a course
router.patch(
  "/update-course/:courseCode",
  authenticateToken,
  authenticateAdmin,
  updateCourse
);

// delete a course
router.delete(
  "/delete-course/:courseCode",
  authenticateToken,
  authenticateAdmin,
  deleteACourse
);

export default router;
