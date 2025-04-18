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
router.get("/", authenticateToken, getAllCourses);

// add a course
router.post(
  "/create-course",
  authenticateToken,
  authenticateAdmin,
  createCourse
);

// get a course
router.get("/course/:code", authenticateToken, getACourse);

// update a course
router.patch(
  "/update-course/:code",
  authenticateToken,
  authenticateAdmin,
  updateCourse
);

// delete a course
router.delete(
  "/delete-course/:code",
  authenticateToken,
  authenticateAdmin,
  deleteACourse
);

export default router;
