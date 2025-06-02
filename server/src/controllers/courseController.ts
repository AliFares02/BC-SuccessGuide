import courseModel from "../models/courseModel";
import { Request, Response } from "express";
import userModel from "../models/userModel";

interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    role: string;
    department: string;
  };
}
// get all courses
export async function getAllCourses(req: Request, res: Response): Promise<any> {
  const { department } = (req as AuthenticatedRequest).user;

  //perform conditional check to see if department is COMM and if it is, query the concentration courses as a separate list and return it as well as the core courses
  try {
    const courses = await courseModel.find({
      course_department: department,
    });
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
  const { createCourseBody } = req.body;
  const { department } = (req as AuthenticatedRequest).user;

  if (
    !createCourseBody?.course_code?.trim() ||
    !createCourseBody?.course_name?.trim() ||
    !createCourseBody?.course_description?.trim() ||
    !String(createCourseBody?.course_credits)?.trim()
  ) {
    return res.status(404).json({ msg: "Missing course fields" });
  }

  if (
    department === "Communication" &&
    createCourseBody.isConcentrationCourse
  ) {
    if (
      !createCourseBody.concentration?.trim() ||
      !createCourseBody.concentration_area?.trim()
    ) {
      return res
        .status(404)
        .json({ msg: "Missing course concentration fields" });
    }
  }
  try {
    // logic for handling Comm concentration course addition
    if (
      department === "Communication" &&
      createCourseBody.isConcentrationCourse
    ) {
      const concentrationCourseExists = await courseModel.findOne({
        course_code: createCourseBody.course_code?.trim(),
        course_department: department,
      });
      if (concentrationCourseExists)
        return res
          .status(400)
          .json({ msg: "Concentration course already exists" });

      const concentrationCourse = await courseModel.create({
        course_code: createCourseBody?.course_code?.trim(),
        course_name: createCourseBody?.course_name?.trim(),
        course_description: createCourseBody?.course_description?.trim(),
        course_credits: createCourseBody?.course_credits,
        course_department: department,
        isConcentrationCourse: createCourseBody?.isConcentrationCourse,
        concentration: createCourseBody.concentration?.trim(),
        concentration_area: createCourseBody.concentration_area?.trim(),
      });
      return res.status(200).json({
        msg: "Concentration course successfully created!",
        concentrationCourse,
        enrollmentCount: 0,
      });
    }
    // add object directly to database without need for destructuring
    const courseExists = await courseModel.findOne({
      course_code: createCourseBody.course_code?.trim(),
      course_department: department,
    });
    if (courseExists)
      return res.status(400).json({ msg: "Course already exists" });

    const course = await courseModel.create({
      course_code: createCourseBody?.course_code?.trim(),
      course_name: createCourseBody?.course_name?.trim(),
      course_description: createCourseBody?.course_description?.trim(),
      course_credits: createCourseBody?.course_credits,
      course_department: department,
      course_prerequisites: createCourseBody?.course_prerequisites,
    });

    return res.status(200).json({
      msg: "Course successfully created!",
      course,
      enrollmentCount: 0,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Error adding course", error: error });
  }
}

// get a course
export async function getACourse(req: Request, res: Response): Promise<any> {
  const { courseCode } = req.params;
  const { department } = (req as AuthenticatedRequest).user;
  try {
    const course = await courseModel.findOne({
      course_code: courseCode,
      course_department: department,
    });
    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }
    return res.status(200).json({ msg: "Course found", course });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error });
  }
}

// update a course
export async function updateCourse(req: Request, res: Response): Promise<any> {
  const { courseCode } = req.params;
  const { department } = (req as AuthenticatedRequest).user;
  try {
    const course = await courseModel.findOneAndUpdate(
      { course_code: courseCode, course_department: department },
      {
        ...req.body.updatedCourseBody,
      },
      { new: true, runValidators: true }
    );
    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }
    const enrollmentCount = await userModel.countDocuments({
      "courses.courseCode": courseCode,
      "courses.status": "in-progress",
    });
    return res
      .status(200)
      .json({ msg: "Course updated", course, enrollmentCount });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error });
  }
}

// delete a course
export async function deleteACourse(req: Request, res: Response): Promise<any> {
  const { courseCode } = req.params;
  const { department } = (req as AuthenticatedRequest).user;
  try {
    const course = await courseModel.findOne({
      course_code: courseCode,
      course_department: department,
    });
    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }
    const allDeptCourses = await courseModel.find({
      course_department: department,
    });
    const dependentCourseCodes = allDeptCourses
      .filter((deptCourse) =>
        deptCourse.course_prerequisites.includes(courseCode)
      )
      .map((course) => course.course_code);

    if (dependentCourseCodes.length > 0) {
      return res.status(400).json({
        msg: `Cannot remove course. It is a prerequisite for: ${dependentCourseCodes.join(
          ", "
        )}. Remove them first`,
      });
    }
    await course.deleteOne();
    return res.status(200).json({ msg: "Course deleted", courseCode });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error });
  }
}
