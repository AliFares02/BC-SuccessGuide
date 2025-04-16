import { Request, Response } from "express";
import activityModel from "../models/activityModel";
import courseModel from "../models/courseModel";
import userModel from "../models/userModel";
import bcrypt from "bcrypt";
import validator from "validator";
import jwt from "jsonwebtoken";
import "dotenv/config";

function createToken(_id: String) {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign({ _id }, secret, { expiresIn: "1d" });
}

// public endpoint
export async function signUp(req: Request, res: Response): Promise<any> {
  const { name, email, password } = req.body;
  // use validatorjs for validating input
  // validate credentials
  if (!name || !email || !password)
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

    const user = await userModel.create({ name, email, hashed_password: hash });

    const token = createToken(user._id.toString());
    return res.status(200).json({
      msg: "User created",
      name: user.name,
      email: user.email,
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
    if (!user)
      return res
        .status(404)
        .json({ msg: "A user with this email does not exist" });

    const matchingPassword = await bcrypt.compare(
      credentials.password,
      user.hashed_password
    );
    if (!matchingPassword)
      return res.status(401).json({ msg: "Invalid password" });

    const token = createToken(user._id.toString());
    return res.status(200).json({
      msg: "Login successful",
      access_token: token,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error logging in, please try again later", error: error });
  }
}

// student endpoints
export async function addActivitiesToStudent(
  req: Request,
  res: Response
): Promise<any> {
  const studentId = req.params.studentId;
  const activityData = req.body;

  try {
    const student = await userModel.findById(studentId);
    const activity = await activityModel.findById(activityData.activityId);
    if (!student) return res.status(404).json({ msg: "Invalid student" });
    if (!activity) return res.status(404).json({ msg: "Invalid activity" });

    // check if activity already exists in students activities before adding it
    const activityExists = student.activities.find(
      (activity) =>
        activity.activityId.toString() === activityData.activityId.toString()
    );
    if (activityExists)
      return res
        .status(409)
        .json({ msg: "Activity already exists in students activity list" });

    student.activities.push(activityData);

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

export async function getStudentActivities(
  req: Request,
  res: Response
): Promise<any> {
  const studentId = req.params.studentId;

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
  const studentId = req.params.studentId;
  const courseCode = req.params.courseCode;
  const studentsCourseDetails = req.body;

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
    const courseExistsInPastCourses = student.past_courses.find(
      (course) => course.courseCode === courseCode.toString()
    );
    const courseExistsInCurrentCourses = student.current_courses.find(
      (course) => course.courseCode === courseCode.toString()
    );
    if (courseExistsInPastCourses)
      return res.status(409).json({
        msg: "Course already exists in past courses",
      });
    // if it exists in current courses, then it is being moved from current courses to past courses so first remove it from current courses
    if (courseExistsInCurrentCourses) {
      const courseIdx = student.current_courses.findIndex(
        (course) => course.courseCode === courseCode.toString()
      );
      if (courseIdx !== -1) student.current_courses.splice(courseIdx, 1);
    }

    student.past_courses.push(studentsCourseDetails);
    await student.save();
    return res.status(200).json({
      msg: "Course added to past courses",
      past_courses: student?.past_courses,
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
  const studentId = req.params.studentId;
  const courseCode = req.params.courseCode;

  const studentsCourseDetails = req.body;

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
    const courseExistsInPastCourses = student.past_courses.find(
      (course) => course.courseCode === courseCode.toString()
    );
    const courseExistsInCurrentCourses = student.current_courses.find(
      (course) => course.courseCode === courseCode.toString()
    );
    if (courseExistsInCurrentCourses || courseExistsInPastCourses)
      return res.status(409).json({
        msg: "Course already exists in either past courses or current courses",
      });

    student.current_courses.push(studentsCourseDetails);
    await student.save();
    return res.status(200).json({
      msg: "Course added to current courses",
      current_courses: student?.current_courses,
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
  const studentId = req.params.studentId;

  try {
    const student = await userModel.findById(studentId).select("past_courses");
    if (!student)
      return res.status(404).json({
        msg: "Can't retrieve student courses because student does not exist",
      });
    return res.status(200).json({ past_courses: student.past_courses });
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
  const studentId = req.params.studentId;

  try {
    const student = await userModel
      .findById(studentId)
      .select("current_courses");
    if (!student)
      return res.status(404).json({
        msg: "Can't retrieve student courses because student does not exist",
      });
    return res.status(200).json({ current_courses: student.current_courses });
  } catch (error) {
    return res.status(500).json({
      msg: "Error retrieving student's current courses",
      error: error,
    });
  }
}
