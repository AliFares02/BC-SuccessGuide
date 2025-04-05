import courseModel from "../models/courseModel";
import { Request, Response } from "express";

// get all courses
export async function getAllCourses(req: Request, res: Response): Promise<any> {
  try {
    const courses = await courseModel.find();
    if (!courses || courses.length == 0) {
      return res.status(404).json({ msg: "No courses found" });
    }
    return res.status(200).json({ courses: courses });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
}

// create a course
export async function createCourse(req: Request, res: Response): Promise<any> {
  try {
    // add object directly to database without need for destructuring
    const course = await courseModel.create(req.body);
    return res
      .status(201)
      .json({ msg: "course successfully created!", course });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
}

// get a course
interface CourseParams {
  code: string;
}
export async function getACourse(
  req: Request<CourseParams>,
  res: Response
): Promise<any> {
  const { code } = req.params;
  try {
    const course = await courseModel.findOne({ course_code: code });
    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }
    return res.status(200).json({ msg: "Course found", course });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error });
  }
}

// update a course
interface updatedCourse {
  course_name?: string;
  course_description?: string;
  course_credits?: number;
  course_difficulty?: string;
  course_department?: string;
  course_prerequisites?: string[];
}
export async function updateCourse(
  req: Request<CourseParams, unknown, updatedCourse>,
  res: Response
): Promise<any> {
  const { code } = req.params;
  try {
    const course = await courseModel.findOneAndUpdate(
      { course_code: code },
      {
        ...req.body,
      }
    );
    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }
    return res.status(200).json({ msg: "Course updated" });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error });
  }
}

// delete a course
export async function deleteACourse(
  req: Request<CourseParams>,
  res: Response
): Promise<any> {
  const { code } = req.params;
  try {
    const course = await courseModel.findOneAndDelete({ course_code: code });
    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }
    return res.status(200).json({ msg: "Course deleted" });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error });
  }
}
