import express from "express";
import {
  createCourse,
  getAllCourses,
  getACourse,
  updateCourse,
  deleteACourse,
} from "../controllers/courseController";

const router = express.Router();

// get all courses
router.get("/", getAllCourses);

// add a course
router.post("/create-course", createCourse);

// get a course
router.get("/course/:code", getACourse);

// update a course
router.patch("/update-course/:code", updateCourse);

// delete a course
router.delete("/delete-course/:code", deleteACourse);

export default router;
