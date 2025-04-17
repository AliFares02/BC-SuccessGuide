import { Request, Response } from "express";
import activityModel from "../models/activityModel";
import courseModel from "../models/courseModel";
import userModel from "../models/userModel";
import bcrypt from "bcrypt";
import validator from "validator";
import jwt from "jsonwebtoken";
import "dotenv/config";

function createToken(_id: String, role: String) {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign({ _id, role }, secret, { expiresIn: "1d" });
}

// remove any student id from params as the token is sufficient for validation bc middleware will recieve token, authenticate its signature, and bind the user id from the token to the user object and then retrieve said binded user id from user object to retrieve resources from db.

// for a login, send the user id and the role from the user object you retrieve from the database(after credentials are validated), and not from the client req, to the token generator

// same goes for signup except your sending the user id and role to the generator once you retrieve them from the successfully created user object

// authenticateToken ex. const authenticateToken = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ message: 'No token provided' });

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) return res.status(403).json({ message: 'Invalid token' });

//     req.user = decoded; // decoded contains id and role
//     next();
//   });
// };

// a isadmin middleware interceptor: function isAdmin(req, res, next) {
//   if (req.user?.role !== 'admin') {
//     return res.status(403).json({ message: 'Admins only' });
//   }
//   next();
// }

// the middleware isnt explicitly called in the protected endpoint instead you add it as a parameter to the routehandler that calls the endpoint and express will know to use that middleware to intercept all requests to that endpoint before proceeding to said endpoint: e.g router.get('/admin-dashboard', authenticateToken(another controller for authenticating the token which will be called before isAdmin), isAdmin, adminController.getDashboard);

// the next() call operates via the order the functions/params are placed in the routehandler e.g router.get(). i.e authenticateToken next() -> isAdmin next() -> adminController.getDashboard.

// the req, res are the same arguments that are passed down from middleware to middleware and eventually to controller

// and so if a middleware modifies the req, the next middleware or controller will recieve that same modified req

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

    const token = createToken(user._id.toString(), user.role);
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
    if (!user) return res.status(404).json({ msg: "Invalid credentials" });

    const matchingPassword = await bcrypt.compare(
      credentials.password,
      user.hashed_password
    );
    if (!matchingPassword)
      return res.status(401).json({ msg: "Invalid credentials" });

    const token = createToken(user._id.toString(), user.role);
    return res.status(200).json({
      msg: "Login successful",
      name: user.name,
      email: user.email,
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
