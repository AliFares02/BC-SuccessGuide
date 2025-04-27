import { Request, Response } from "express";
import activityModel from "../models/activityModel";
import courseModel from "../models/courseModel";
import userModel from "../models/userModel";
import bcrypt from "bcrypt";
import validator from "validator";
import jwt from "jsonwebtoken";
import "dotenv/config";

function createToken(
  _id: string,
  email: string,
  role: string,
  department: string
) {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign({ _id, email, role, department }, secret, {
    expiresIn: "1d",
  });
}

// public endpoint
export async function signUp(req: Request, res: Response): Promise<any> {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department)
    return res.status(401).json({ msg: "Missing credentials" });
  if (!validator.isEmail(email))
    return res.status(401).json({ msg: "Invalid email" });
  if (!validator.isStrongPassword(password))
    return res.status(401).json({ msg: "Invalid password" });

  try {
    const userExists = await userModel.findOne({ email: email });
    if (userExists)
      return res.status(409).json({ msg: "Email already in use" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      name,
      email,
      hashed_password: hash,
      department,
    });

    const token = createToken(
      user._id.toString(),
      user.email,
      user.role,
      user.department
    );
    return res.status(200).json({
      msg: "User created",
      name: user.name,
      email: user.email,
      department: user.department,
      access_token: token,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Error creating user", error: error });
  }
}

// public endpoint
export async function login(req: Request, res: Response): Promise<any> {
  const credentials = req.body;

  if (!credentials.email || !credentials.password)
    return res.status(401).json({ msg: "Missing credentials" });
  try {
    const user = await userModel.findOne({ email: credentials.email });
    if (!user) return res.status(404).json({ msg: "Invalid credentials" });

    const matchingPassword = await bcrypt.compare(
      credentials.password,
      user.hashed_password
    );
    if (!matchingPassword)
      return res.status(401).json({ msg: "Invalid credentials" });

    const token = createToken(
      user._id.toString(),
      user.email,
      user.role,
      user.department
    );
    return res.status(200).json({
      msg: "Login successful",
      name: user.name,
      email: user.email,
      department: user.department,
      access_token: token,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error logging in, please try again later", error: error });
  }
}

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}
// student endpoints
export async function addActivitiesToStudent(
  req: Request,
  res: Response
): Promise<any> {
  const studentId = (req as AuthenticatedRequest).user?._id;
  const activityData = req.body;

  try {
    const student = await userModel.findById(studentId);
    const activity = await activityModel.findById(activityData.activityId);
    if (!student) return res.status(404).json({ msg: "Invalid student" });
    if (!activity) return res.status(404).json({ msg: "Invalid activity" });

    // check if activity already exists in students activities before adding it
    const activityExists = student.activities?.find(
      (activity) =>
        activity.activityId.toString() === activityData.activityId.toString()
    );
    if (activityExists)
      return res
        .status(409)
        .json({ msg: "Activity already exists in students activity list" });

    student.activities?.push(activityData);

    await student.save();
    return res.status(200).json({
      msg: "Activity added to student's activities",
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error adding activity, please try again later",
      error: error,
    });
  }
}

export async function getStudentAcademicTracker(
  req: Request,
  res: Response
): Promise<any> {
  const studentId = (req as AuthenticatedRequest).user?._id;

  try {
    const student = await userModel
      .findById(studentId)
      .populate("activities.activityId");
    if (!student) return res.status(404).json({ msg: "Student not found" });

    const studentCurrentCourses = student.courses?.filter(
      (course) => course.status === "in-progress"
    );

    return res
      .status(200)
      .json({ studentCurrentCourses, activities: student.activities });
  } catch (error) {
    return res.status(500).json({
      msg: "Error retrieving student academic tracker, please try again later",
      error: error,
    });
  }
}

export async function getStudentActivities(
  req: Request,
  res: Response
): Promise<any> {
  const studentId = (req as AuthenticatedRequest).user?._id;

  try {
    const student = await userModel.findById(studentId);
    if (!student)
      return res.status(404).json({
        msg: "Can't retrieve student activities because student does not exist",
      });
    const studentActivities = await userModel
      .findById(studentId)
      .select("activities")
      .populate("activities.activityId");
    return res.status(200).json({ activities: studentActivities?.activities });
  } catch (error) {
    return res.status(500).json({
      msg: "Error retrieving student activities, please try again later",
      error: error,
    });
  }
}

export async function addPastCourse(req: Request, res: Response): Promise<any> {
  const studentId = (req as AuthenticatedRequest).user?._id;
  // get the course object from the database, attatch the student details(which should only contain things like course grade), then add it to students past courses instead of what your doing now.
  const courseCode = req.params.courseCode;
  const studentsCourseDetails = req.body;

  // dont use coursecode from params just use it from req body or vic versa, no need to grab it from both, if you decide to grab it from both you must make sure the body code and param code match first

  try {
    const student = await userModel.findById(studentId);
    if (!student)
      return res.status(404).json({
        msg: "Can't add course because student does not exist",
      });
    const course = await courseModel.findOne({ course_code: courseCode });
    if (!course)
      return res.status(404).json({
        msg: "Can't add course because course does not exist",
      });

    // check if course already exists in student past courses
    const courseAlrTaken = student.courses?.find((course) => {
      return (
        course.courseCode === courseCode.toString() && course.status === "taken"
      );
    });
    const courseAlrInProg = student.courses?.find((course) => {
      return (
        course.courseCode === courseCode.toString() &&
        course.status === "in-progress"
      );
    });
    if (courseAlrTaken)
      return res.status(409).json({
        msg: "Course already taken before",
      });
    // if it is already in progress, then change the course from "in-progress" to "taken"
    if (courseAlrInProg) {
      const courseIdx = student.courses?.findIndex(
        (course) => course.courseCode === courseCode.toString()
      );
      if (courseIdx !== undefined && courseIdx !== -1) {
        student.courses![courseIdx].status = "taken";
        student.courses![courseIdx].grade = studentsCourseDetails.grade;
      }
    } else {
      // else add the course as a "taken" course
      student.courses?.push({
        courseCode,
        semester: studentsCourseDetails.semester,
        status: "taken",
        grade: studentsCourseDetails.grade,
      });
    }
    await student.save();
    return res.status(200).json({
      msg: "Course added to past courses",
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error adding course to student's past courses",
      error: error,
    });
  }
}

export async function addCurrentCourse(
  req: Request,
  res: Response
): Promise<any> {
  const studentId = (req as AuthenticatedRequest).user?._id;
  // get the course object from the database, attatch the student details(which should only contain things like course grade), then add it to students current courses instead of what your doing now.
  const { courseCode, semester } = req.body;

  // dont use coursecode from params just use it from req body or vic versa, no need to grab it from both, if you decide to grab it from both you must make sure the body code and param code match first

  // implement server side logic to check the current semester

  if (!semester)
    return res.status(400).json({ msg: "Invalid or missing semester" });

  try {
    const student = await userModel.findById(studentId);
    if (!student)
      return res.status(404).json({
        msg: "Can't add course because student does not exist",
      });
    const course = await courseModel.findOne({ course_code: courseCode });
    if (!course)
      return res.status(404).json({
        msg: "Can't add course because course does not exist",
      });

    // check if course already exists in student taken courses
    const courseAlrTaken = student.courses?.find((course) => {
      return (
        course.courseCode === courseCode.toString() && course.status === "taken"
      );
    });
    const courseAlrInProg = student.courses?.find((course) => {
      return (
        course.courseCode === courseCode.toString() &&
        course.status === "in-progress"
      );
    });
    if (courseAlrTaken || courseAlrInProg)
      return res.status(409).json({
        msg: "Course previously taken or currently in-progress",
      });

    student.courses?.push({ courseCode, semester, status: "in-progress" });
    await student.save();
    return res.status(200).json({
      msg: "Course added to current courses",
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error adding course to student's current courses",
      error: error,
    });
  }
}

export async function getPastCourses(
  req: Request,
  res: Response
): Promise<any> {
  const studentId = (req as AuthenticatedRequest).user?._id;

  try {
    const student = await userModel.findById(studentId);
    if (!student)
      return res.status(404).json({
        msg: "Can't retrieve student courses because student does not exist",
      });
    const studentPastCourses = student.courses?.filter(
      (course) => course.status === "taken"
    );
    return res.status(200).json({ past_courses: studentPastCourses });
  } catch (error) {
    return res.status(500).json({
      msg: "Error retrieving student's past courses",
      error: error,
    });
  }
}
export async function getCurrentCourses(
  req: Request,
  res: Response
): Promise<any> {
  const studentId = (req as AuthenticatedRequest).user?._id;

  try {
    const student = await userModel.findById(studentId);
    if (!student)
      return res.status(404).json({
        msg: "Can't retrieve student courses because student does not exist",
      });

    const studentCurrCourses = student.courses?.filter(
      (course) => course.status === "in-progress"
    );
    return res.status(200).json({ current_courses: studentCurrCourses });
  } catch (error) {
    return res.status(500).json({
      msg: "Error retrieving student's current courses",
      error: error,
    });
  }
}
