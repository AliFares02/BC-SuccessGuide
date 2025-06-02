import { Request, Response } from "express";
import mongoose from "mongoose";
import activityModel from "../models/activityModel";
import courseModel from "../models/courseModel";
import userModel from "../models/userModel";
import bcrypt from "bcrypt";
import validator from "validator";
import jwt from "jsonwebtoken";
import "dotenv/config";
import crypto from "crypto";
import getSemester from "../utils/getCurrentSemester";
import sendResetEmail from "../utils/sendResetEmail";

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

  if (!name.trim() || !email.trim() || !password.trim() || !department)
    return res.status(401).json({ msg: "Missing credentials" });

  if (!validator.isEmail(email.trim()))
    return res.status(401).json({ msg: "Invalid email" });
  if (!validator.isStrongPassword(password))
    return res.status(401).json({ msg: "Invalid password" });

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  try {
    const userExists = await userModel.findOne({ email: trimmedEmail });
    if (userExists)
      return res.status(409).json({ msg: "Email already in use" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      name: trimmedName,
      email: trimmedEmail,
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

  if (!credentials || !credentials)
    return res.status(401).json({ msg: "Missing credentials" });

  if (!credentials.email.trim() || !credentials.password.trim())
    return res.status(401).json({ msg: "Missing credentials" });

  const trimmedEmail = credentials.email.trim();
  try {
    const user = await userModel.findOne({
      email: trimmedEmail,
      role: "student",
    });
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
  user: {
    _id: string;
    role: string;
    department: string;
  };
}

export async function getStudentAccount(
  req: Request,
  res: Response
): Promise<any> {
  const { _id } = (req as AuthenticatedRequest).user;
  try {
    const student = await userModel.findById(_id);
    if (!student) return res.status(404).json({ msg: "Invalid student" });

    const studentAcct = {
      name: student.name,
      email: student.email,
      department: student.department,
      year: student.year,
    };
    return res.status(200).json(studentAcct);
  } catch (error) {
    return res.status(500).json({
      msg: "Error retrieving student account, please try again later",
      error: error,
    });
  }
}

interface UpdatedStudentAccount {
  name?: string;
  email?: string;
  department?: string;
  year?: string;
  hashed_password?: string;
}

export async function updateStudentAccount(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  const { updatedStudentAcctInfo } = req.body;

  const parsedUpdates: UpdatedStudentAccount = {};

  try {
    const student = await userModel.findById(_id);
    if (!student) return res.status(400).json({ msg: "Invalid student" });

    if (updatedStudentAcctInfo?.name?.trim()) {
      parsedUpdates.name = updatedStudentAcctInfo.name.trim();
    }
    if (updatedStudentAcctInfo?.email?.trim()) {
      if (!validator.isEmail(updatedStudentAcctInfo.email.trim())) {
        return res.status(401).json("Invalid email");
      }
      parsedUpdates.email = updatedStudentAcctInfo.email.trim();
    }
    if (
      updatedStudentAcctInfo?.department &&
      updatedStudentAcctInfo?.department !== department
    ) {
      parsedUpdates.department = updatedStudentAcctInfo.department;
      student.courses = [];
    }
    if (
      updatedStudentAcctInfo?.year &&
      updatedStudentAcctInfo?.year !== student.year
    ) {
      parsedUpdates.year = updatedStudentAcctInfo.year;
    }

    if (updatedStudentAcctInfo?.password?.trim()) {
      const samePassword = await bcrypt.compare(
        updatedStudentAcctInfo.password.trim(),
        student.hashed_password
      );
      if (samePassword) {
        return res.status(400).json({
          msg: "New password must be different from the current password.",
        });
      }
      if (!validator.isStrongPassword(updatedStudentAcctInfo.password.trim())) {
        return res.status(401).json({ msg: "Invalid password" });
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(
        updatedStudentAcctInfo.password.trim(),
        salt
      );
      parsedUpdates.hashed_password = hash;
    }
    student.set(parsedUpdates);
    await student.save();
    const {
      name,
      email,
      department: updatedDepartment,
      year,
    } = student.toObject();
    return res.status(200).json({
      msg: "Student account updated",
      student: { name, email, department: updatedDepartment, year },
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error updating student account, please try again later",
      error: error,
    });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<any> {
  const userToDel = req.params.id;
  const { _id, role } = (req as AuthenticatedRequest).user;

  const isAdmin = role === "admin";
  const delSelf = _id.toString() === userToDel;

  if (!isAdmin && !delSelf) {
    return res.status(403).json({ msg: "Unauthorized access" });
  }
  try {
    await userModel.findByIdAndDelete(userToDel);
    return res.status(200).json({ msg: "User deleted", id: userToDel });
  } catch (error) {
    return res.status(500).json({ msg: "Error deleting user" });
  }
}

export async function requestPasswordReset(
  req: Request,
  res: Response
): Promise<any> {
  const { email } = req.body;

  try {
    const user = await userModel.findOne({ email: email });
    if (!user)
      return res
        .status(404)
        .json({ msg: "Email does not exist in our database" });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 15);

    await user.save();

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    await sendResetEmail(user.email, resetURL);
    return res.status(200).json({ msg: "Reset email sent" });
  } catch (error) {
    return res.status(500).json({
      msg: "Error sending reset link, please try again later",
      error: error,
    });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<any> {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user)
      return res
        .status(400)
        .json({ msg: "Invalid or expired password reset token" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword.trim(), salt);

    user.hashed_password = hash;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    return res.status(200).json({ msg: "Password reset successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error resetting password", error: error });
  }
}

// student endpoints
export async function getFlowChartCourses(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;

  // fetch student courses, then fetch all department courses and right join them so matching courses are joined
  try {
    const studentCourses = await userModel.findById(_id).select("courses");
    if (!studentCourses)
      return res.status(404).json({ msg: "Invalid student" });

    const studentCourseArr = studentCourses.courses;

    const deptCourses = await courseModel
      .find({ course_department: department, isConcentrationCourse: false })
      .lean();

    const studentAndDeptCoursesJoined = deptCourses.map((deptCourse) => {
      const matchingCourse = studentCourseArr?.find(
        (course) => course.courseCode === deptCourse.course_code
      );

      if (matchingCourse) {
        return {
          deptCourse,
          status: matchingCourse.status,
          grade: matchingCourse.grade,
          semesterTaken: matchingCourse.semester,
        };
      }
      return { deptCourse };
    });
    return res.status(200).json({ studentAndDeptCoursesJoined });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error });
  }
}

export async function getConcentrationCourses(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  if (department !== "Communication")
    return res.status(403).json({ msg: "Invalid department" });

  try {
    const studentCourses = await userModel.findById(_id).select("courses");
    if (!studentCourses)
      return res.status(404).json({ msg: "Invalid student" });

    const studentCoursesArr = studentCourses.courses;

    const concentrationCourses = await courseModel
      .find({
        course_department: department,
        concentration: { $exists: true, $ne: null },
      })
      .lean();

    const studentAndConCoursesJoined = concentrationCourses.map(
      (concentrationCourse) => {
        const matchingCourse = studentCoursesArr?.find(
          (course) => course.courseCode === concentrationCourse.course_code
        );

        if (matchingCourse) {
          return {
            concentrationCourse,
            status: matchingCourse.status,
            grade: matchingCourse.grade,
            semesterTaken: matchingCourse.semester,
          };
        }
        return {
          concentrationCourse,
        };
      }
    );
    return res.status(200).json({ studentAndConCoursesJoined });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error });
  }
}

export async function addActivitiesToStudent(
  req: Request,
  res: Response
): Promise<any> {
  const { _id } = (req as AuthenticatedRequest).user;
  const { activityId } = req.params;

  try {
    const student = await userModel.findById(_id);
    const activity = await activityModel.findById(activityId);
    if (!student) return res.status(404).json({ msg: "Invalid student" });
    if (!activity) return res.status(404).json({ msg: "Invalid activity" });

    // check if activity already exists in students activities before adding it
    const activityExists = student.activities?.find(
      (activity) => activity.activityId.toString() === activityId
    );
    if (activityExists)
      return res
        .status(409)
        .json({ msg: "Activity already exists in students activity list" });

    student.activities?.push({
      activityId: new mongoose.Types.ObjectId(activityId),
      status: "in-progress",
    });

    await student.save();
    return res.status(200).json({
      msg: "Activity added to student's activities",
      activityId,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error adding activity, please try again later",
      error: error,
    });
  }
}

export async function updateStudentActivity(
  req: Request,
  res: Response
): Promise<any> {
  const { _id } = (req as AuthenticatedRequest).user;
  const { activityId } = req.params;
  const {
    comment,
    modificationType,
  }: { comment: string; modificationType: string } = req.body;
  try {
    const student = await userModel.findById(_id).select("activities");
    if (!student) return res.status(404).json({ msg: "Invalid student" });

    const studentActivities = student.activities;

    const activity = studentActivities?.find(
      (activity) => activity.activityId.toString() === activityId
    );

    if (!activity)
      return res
        .status(404)
        .json({ error: "Activity not found in student activities" });

    switch (modificationType) {
      case "save":
        activity.comment = comment.trim();
        break;
      case "delete":
        activity.comment = undefined;
        break;
      case "status-complete":
        activity.status = "completed";
        break;
      default:
    }

    await student.save();
    return res.status(200).json({ msg: "Activity updated", activity });
  } catch (error) {
    return res.status(500).json({
      msg: "Error updating activity, please try again later",
      error: error,
    });
  }
}

export async function deleteStudentActivity(
  req: Request,
  res: Response
): Promise<any> {
  const { _id } = (req as AuthenticatedRequest).user;
  const { activityId } = req.params;

  try {
    const student = await userModel.findById(_id).select("activities");
    if (!student) return res.status(404).json({ msg: "Invalid student" });

    const activity = student.activities?.find(
      (activity) => activity.activityId.toString() === activityId
    );

    if (!activity)
      return res
        .status(404)
        .json({ error: "Activity does not exist in student activities" });

    student.activities = student.activities?.filter(
      (activity) => activity.activityId.toString() !== activityId
    );

    await student.save();

    return res
      .status(200)
      .json({ msg: "Activity deleted", activityId: activity.activityId });
  } catch (error) {
    return res.status(500).json({
      msg: "Error deleting activity, please try again later",
      error: error,
    });
  }
}

export async function getStudentActivities(
  req: Request,
  res: Response
): Promise<any> {
  const { _id } = (req as AuthenticatedRequest).user;

  try {
    const student = await userModel.findById(_id);
    if (!student)
      return res.status(404).json({
        msg: "Can't retrieve student activities because student does not exist",
      });
    const studentActivities = await userModel
      .findById(_id)
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

export async function getStudentAcademicTracker(
  req: Request,
  res: Response
): Promise<any> {
  const { _id } = (req as AuthenticatedRequest).user;

  try {
    const student = await userModel
      .findById(_id)
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

export async function addPastCourse(req: Request, res: Response): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  // get the course object from the database, attatch the student details(which should only contain things like course grade), then add it to students past courses instead of what your doing now.
  const courseCode = req.params.courseCode;
  const studentsCourseDetails = req.body as {
    grade: keyof typeof gradeToQualityPoint;
    semester: string;
  };

  // dont use coursecode from params just use it from req body or vic versa, no need to grab it from both, if you decide to grab it from both you must make sure the body code and param code match first

  try {
    const student = await userModel.findById(_id);
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
    let returnedCourse;
    if (courseAlrInProg) {
      const courseIdx = student.courses?.findIndex(
        (course) => course.courseCode === courseCode.toString()
      );
      if (courseIdx !== undefined && courseIdx !== -1) {
        // handle comm student adding internship course
        if (department === "Communication") {
          if (courseCode === "COMM 4000" || courseCode === "COMM 4100") {
            const otherCourseCode =
              courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000";
            const internshipReqMet = student.courses?.find(
              (course) =>
                course.courseCode === otherCourseCode &&
                (course.status === "taken" || course.status === "in-progress")
            );
            if (internshipReqMet) {
              return res
                .status(400)
                .json({ msg: "You've already met the internship requirement" });
            } else {
              student.courses![courseIdx].status = "taken";
              student.courses![courseIdx].grade =
                studentsCourseDetails.grade as any;
              student.courses?.push({
                courseCode:
                  courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000",
                status: "taken",
                grade: "P/CR" as any,
                semester: student.courses![courseIdx].semester,
              });
              returnedCourse = {
                courseCode: student.courses![courseIdx].courseCode,
                status: "taken",
                grade: studentsCourseDetails.grade,
                semester: student.courses![courseIdx].semester,
              };
            }
          } else {
            student.courses![courseIdx].status = "taken";
            student.courses![courseIdx].grade =
              studentsCourseDetails.grade as any;
            returnedCourse = {
              courseCode: student.courses![courseIdx].courseCode,
              status: "taken",
              grade: studentsCourseDetails.grade,
              semester: student.courses![courseIdx].semester,
            };
          }
        } else {
          student.courses![courseIdx].status = "taken";
          student.courses![courseIdx].grade =
            studentsCourseDetails.grade as any;
          returnedCourse = {
            courseCode: student.courses![courseIdx].courseCode,
            status: "taken",
            grade: studentsCourseDetails.grade,
            semester: student.courses![courseIdx].semester,
          };
        }
      }
    } else {
      // else check if course prerequisites have been met
      if (
        course.course_prerequisites &&
        course.course_prerequisites.length > 0
      ) {
        const missingPrerequisites = course.course_prerequisites.filter(
          (coursePrerequisite) => {
            const preReqMatch = student.courses?.find(
              (course) =>
                course.courseCode === coursePrerequisite &&
                course.status === "taken"
            );
            return !preReqMatch;
          }
        );
        if (missingPrerequisites.length > 0) {
          return res
            .status(400)
            .json({ msg: `Missing prerequisite(s): ${missingPrerequisites}` });
        }
      }
      // then add the course as a "taken" course
      student.courses?.push({
        courseCode,
        semester: studentsCourseDetails.semester,
        status: "taken",
        grade: studentsCourseDetails.grade as any,
      });
      returnedCourse = {
        courseCode,
        status: "taken",
        grade: studentsCourseDetails.grade,
        semester: studentsCourseDetails.semester,
      };
    }
    // update students gpa acordingly for new course & grade
    const studentGPA = student.gpa ? student.gpa : 0;
    let studentTotalCredits = 0;
    const allDeptCourses = await courseModel
      .find({ course_department: department })
      .lean();
    allDeptCourses.map((deptCourse) => {
      const matchingTakenCourse = student.courses?.find(
        (course) =>
          course.courseCode === deptCourse.course_code &&
          course.status === "taken"
      );
      // calculate students total credits
      if (studentsCourseDetails.grade !== "P/CR") {
        if (matchingTakenCourse)
          studentTotalCredits += deptCourse.course_credits;
      }
    });
    if (student.gpa !== undefined) {
      if (
        studentsCourseDetails.grade !== undefined &&
        studentsCourseDetails.grade !== "P/CR"
      ) {
        student.gpa = parseFloat(
          (
            (studentGPA * (studentTotalCredits - course.course_credits) +
              gradeToQualityPoint[studentsCourseDetails.grade] *
                course.course_credits) /
            studentTotalCredits
          ).toFixed(2)
        );
      }
    } else if (
      studentsCourseDetails.grade !== undefined &&
      studentsCourseDetails.grade !== "P/CR"
    ) {
      student.gpa = gradeToQualityPoint[studentsCourseDetails.grade];
    }

    await student.save();
    return res.status(200).json({
      msg: "Course added to past courses",
      gpa: student.gpa,
      returnedCourse,
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
  const currentSemester = getSemester();
  const { _id, department } = (req as AuthenticatedRequest).user;
  // get the course object from the database, attatch the student details(which should only contain things like course grade), then add it to students current courses instead of what your doing now.
  const { courseCode } = req.body;

  try {
    const student = await userModel.findById(_id);
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
    const courseAlrTaken = student.courses?.find(
      (course) =>
        course.courseCode === courseCode.toString() && course.status === "taken"
    );
    const courseAlrInProg = student.courses?.find(
      (course) =>
        course.courseCode === courseCode.toString() &&
        course.status === "in-progress"
    );
    if (courseAlrTaken || courseAlrInProg)
      return res.status(409).json({
        msg: "Course previously taken or currently in-progress",
      });

    // check if course prerequisites have been met
    if (course.course_prerequisites && course.course_prerequisites.length > 0) {
      const missingPrerequisites = course.course_prerequisites.filter(
        (coursePrerequisite) => {
          const preReqMatch = student.courses?.find(
            (course) =>
              course.courseCode === coursePrerequisite &&
              course.status === "taken"
          );
          return !preReqMatch;
        }
      );
      if (missingPrerequisites.length > 0) {
        return res.status(400).json({
          msg: `Missing prerequisite(s): ${missingPrerequisites.join(", ")}`,
        });
      }
    }

    // handle comm student adding internship course
    if (department === "Communication") {
      if (courseCode === "COMM 4000" || courseCode === "COMM 4100") {
        const otherCourseCode =
          courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000";
        const internshipReqInProg = student.courses?.find(
          (course) =>
            course.courseCode === otherCourseCode &&
            course.status === "in-progress"
        );
        if (internshipReqInProg) {
          return res
            .status(400)
            .json({ msg: "Internship requirement already in progress" });
        }
      }
    }
    // handle user adding concentration course. *Relevant to Comm department
    // user cant add a concentration course from a different concentration than the one they are/already taken a course in
    if (department === "Communication" && course.isConcentrationCourse) {
      let numOfConcCoursesTaken = 0;
      const allConcentrationCourses = await courseModel
        .find({ course_department: department, isConcentrationCourse: true })
        .lean();

      const studentConcentrationCourses = allConcentrationCourses.filter(
        (course) => {
          const matchingCourse = student.courses?.find(
            (studentCourse) => studentCourse.courseCode === course.course_code
          );
          if (matchingCourse && matchingCourse.status === "taken") {
            numOfConcCoursesTaken++;
          }
          return matchingCourse;
        }
      );

      if (numOfConcCoursesTaken == 4) {
        return res.status(400).json({
          msg: "You've already completed the 4 concentration courses requirement",
        });
      }

      for (const studentCourse of studentConcentrationCourses) {
        if (studentCourse.concentration !== course.concentration) {
          return res.status(400).json({
            msg: "Course(s) from a different concentration are currently or already taken, remove them if you would like to change concentration",
          });
        }
        if (studentCourse.concentration_area === course.concentration_area) {
          return res.status(400).json({
            msg: "You can only take one course per area in this concentration",
          });
        }
      }
    }

    student.courses?.push({
      courseCode,
      semester: currentSemester,
      status: "in-progress",
    });
    await student.save();
    return res.status(200).json({
      msg: "Course added to current courses",
      courseCode,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error adding course to student's current courses",
      error: error,
    });
  }
}

export async function removeCurrentCourse(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  const { courseCode } = req.params;

  try {
    const student = await userModel.findById(_id);

    if (!student)
      return res.status(404).json({
        msg: "Can't remove course because student does not exist",
      });

    const currCourseFound = student.courses?.find(
      (course) =>
        course.courseCode === courseCode && course.status === "in-progress"
    );

    if (!currCourseFound)
      return res
        .status(404)
        .json({ msg: "Course not found in student's current courses" });

    student.courses = student.courses?.filter(
      (course) => course.courseCode !== courseCode
    );

    if (department === "Communication") {
      if (courseCode === "COMM 4000" || courseCode === "COMM 4100") {
        const otherCourseCode =
          courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000";
        const internshipReqCourse = student.courses?.find(
          (course) =>
            course.courseCode === otherCourseCode && course.status === "taken"
        );
        if (internshipReqCourse) {
          student.courses = student.courses?.filter(
            (course) => course.courseCode !== otherCourseCode
          );
        }
      }
    }

    await student.save();

    return res.status(200).json({
      msg: "Course removed from student's current courses",
      courseCode,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error removing current course",
      error: error,
    });
  }
}

export async function removePastCourse(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;

  const { courseCode } = req.params;
  try {
    const student = await userModel.findById(_id);

    if (!student)
      return res.status(404).json({
        msg: "Can't remove course because student does not exist",
      });

    const pastCourseFound = student.courses?.find(
      (course) => course.courseCode === courseCode && course.status === "taken"
    );

    if (!pastCourseFound)
      return res
        .status(404)
        .json({ msg: "Course not found in student's past courses" });

    const allDeptCourses = await courseModel
      .find({ course_department: department })
      .lean();

    // Remove the course
    // Before removing the course check if the user has any courses taken that this course is a prereq for and if so prompt them to remove those courses before they can remove this course
    const course = await courseModel.findOne({ course_code: courseCode });
    if (course) {
      const dependentCourseCodes = allDeptCourses
        .filter(
          (deptCourse) =>
            deptCourse.course_prerequisites.includes(courseCode) &&
            student.courses?.some(
              (course) =>
                course.courseCode === deptCourse.course_code &&
                (course.status === "taken" || course.status === "in-progress")
            )
        )
        .map((course) => course.course_code);

      if (dependentCourseCodes.length > 0) {
        return res.status(400).json({
          msg: `Cannot remove course. It is a prerequisite for: ${dependentCourseCodes.join(
            ", "
          )}. Remove them first`,
        });
      }
    }

    student.courses = student.courses?.filter(
      (course) => course.courseCode !== courseCode
    );

    if (department === "Communication") {
      if (courseCode === "COMM 4000" || courseCode === "COMM 4100") {
        const otherCourseCode =
          courseCode === "COMM 4000" ? "COMM 4100" : "COMM 4000";
        const internshipReqCourse = student.courses?.find(
          (course) =>
            course.courseCode === otherCourseCode && course.status === "taken"
        );
        if (internshipReqCourse) {
          student.courses = student.courses?.filter(
            (course) => course.courseCode !== otherCourseCode
          );
        }
      }
    }

    // Recalculate GPA from remaining courses
    let totalQualityPoints = 0;
    let totalCredits = 0;

    for (const course of student.courses ?? []) {
      if (course.status === "taken" && course.grade) {
        const deptCourse = allDeptCourses.find(
          (c) => c.course_code === course.courseCode
        );
        if (!deptCourse) continue;

        const courseCredits = deptCourse.course_credits;
        const gradeValue = gradeToQualityPoint[course.grade];

        totalCredits += courseCredits;
        totalQualityPoints += gradeValue * courseCredits;
      }
    }

    student.gpa =
      totalCredits > 0
        ? parseFloat((totalQualityPoints / totalCredits).toFixed(2))
        : 0;

    await student.save();

    return res.status(200).json({
      msg: "Course removed from student's past courses",
      courseCode,
      gpa: student.gpa,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error removing past course",
      error: error,
    });
  }
}

export async function getPastCourses(
  req: Request,
  res: Response
): Promise<any> {
  const { _id } = (req as AuthenticatedRequest).user;

  try {
    const student = await userModel.findById(_id);
    if (!student)
      return res.status(404).json({
        msg: "Can't retrieve student courses because student does not exist",
      });
    const studentPastCourses = student.courses?.filter(
      (course) => course.status === "taken"
    );
    return res
      .status(200)
      .json({ past_courses: studentPastCourses, gpa: student.gpa });
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
  const { _id } = (req as AuthenticatedRequest).user;

  try {
    const student = await userModel.findById(_id);
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

export async function editCourseComment(
  req: Request,
  res: Response
): Promise<any> {
  const { _id } = (req as AuthenticatedRequest).user;
  const { courseCode } = req.params;
  const { comment } = req.body;
  try {
    const updatedStudent = await userModel.findOneAndUpdate(
      { _id, "courses.courseCode": courseCode },
      { $set: { "courses.$.comment": comment } },
      { new: true, projection: { courses: 1 } }
    );

    if (!updatedStudent || !updatedStudent.courses) {
      return res.status(404).json({ msg: "Course not found" });
    }

    const updatedCourse = updatedStudent?.courses.find(
      (course) => course.courseCode === courseCode
    ) as (typeof updatedStudent.courses)[number] & { comment?: string };

    return res.status(200).json({
      msg: "Course comment updated successfully",
      courseCode: updatedCourse?.courseCode,
      status: updatedCourse?.status,
      comment: updatedCourse!.comment,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error editing course comment",
      error: error,
    });
  }
}

export async function getIncompleteCourses(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;

  try {
    const student = await userModel.findById(_id);
    if (!student)
      return res.status(404).json({
        msg: "Can't return incomplete courses because student is invalid",
      });
    const allDeptCourses = await courseModel
      .find({ course_department: department, isConcentrationCourse: false })
      .lean();

    const inCompleteCourses = allDeptCourses
      .filter((deptCourse) => {
        const matchingCourse = student.courses?.find(
          (course) => course.courseCode === deptCourse.course_code
        );
        return !matchingCourse || matchingCourse.status === "in-progress";
      })
      .map((incompleteCourse) => ({
        courseCode: incompleteCourse.course_code,
      }));
    return res.status(200).json({ inCompleteCourses });
  } catch (error) {
    return res.status(500).json({
      msg: "Error retrieving student's incomplete courses",
      error: error,
    });
  }
}

// for getDesiredGPA() purpose
const gradeToQualityPoint = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,
  F: 0.0,
  "P/CR": null,
};

export async function getDesiredGPA(req: Request, res: Response): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  const { desiredGPA } = req.body;

  if (parseFloat(desiredGPA) < 0 || parseFloat(desiredGPA) > 4)
    return res
      .status(400)
      .json({ msg: "Desired gpa must be between 0 and 4.0" });

  try {
    const student = await userModel.findById(_id).select("courses");
    if (!student)
      return res.status(404).json({ msg: "Student does not exist" });

    const studentCourses = student.courses;
    const allDeptCourses = await courseModel
      .find({ course_department: department, isConcentrationCourse: false })
      .lean();

    const inCompleteCourses = allDeptCourses.filter((deptCourse) => {
      const matchingCourse = studentCourses?.find(
        (course) => course.courseCode === deptCourse.course_code
      );
      return !matchingCourse || matchingCourse.status === "in-progress";
    });

    // *calculate lowest & highest possible gpa and check if desired gpa falls within that range*
    let totalStudentsQP = 0;
    let totalStudentCreds = 0;
    let totalIncompleteLowerBoundQP = 0;
    let totalIncompleteLowerBoundCreds = 0;
    let totalIncompleteUpperBoundQP = 0;
    let totalIncompleteUpperBoundCreds = 0;

    // for including concentration credits for comm students
    if (department === "Communication") {
      let numOfConcCoursesTaken = 0;
      const allConcentrationCourses = await courseModel
        .find({ course_department: department, isConcentrationCourse: true })
        .lean();
      allConcentrationCourses.forEach((course) => {
        const concCourseTaken = student.courses?.find(
          (studentCourse) =>
            studentCourse.courseCode === course.course_code &&
            studentCourse.status === "taken"
        );
        if (concCourseTaken && concCourseTaken.grade !== undefined) {
          numOfConcCoursesTaken++;
          // Only include in GPA if not P/CR
          if ((concCourseTaken.grade as any) !== "P/CR") {
            const qualityPoint = gradeToQualityPoint[concCourseTaken.grade];
            if (qualityPoint !== null) {
              const currCourseQP = 3 * qualityPoint;
              totalStudentsQP += currCourseQP;
              totalStudentCreds += 3;
            }
          }
        }
      });
      let numOfIncompleteConcCourses = 4 - numOfConcCoursesTaken;
      totalIncompleteLowerBoundCreds += numOfIncompleteConcCourses * 3;
      totalIncompleteUpperBoundQP += numOfIncompleteConcCourses * 3 * 4.0;
      totalIncompleteUpperBoundCreds += numOfIncompleteConcCourses * 3;
    }

    // join dept courses with student taken courses to get course credit info from allDeptCourses for calculating students total credits & total quality points(QP)
    allDeptCourses.map((deptCourse) => {
      const matchingCourse = studentCourses?.find(
        (course) => course.courseCode === deptCourse.course_code
      );
      // calculate students total credits & total quality points(QP)
      if (matchingCourse) {
        if (
          matchingCourse?.grade !== undefined &&
          (matchingCourse.grade as any) !== "P/CR"
        ) {
          const currCourseQP =
            deptCourse.course_credits *
            gradeToQualityPoint[matchingCourse.grade];
          totalStudentsQP += currCourseQP;
          totalStudentCreds += deptCourse.course_credits;
        }
      }
    });

    // calculate lower/upper gpa bound with incomplete courses
    inCompleteCourses.map((course) => {
      // lower bound calc
      totalIncompleteLowerBoundQP += course.course_credits * 0.0;
      totalIncompleteLowerBoundCreds += course.course_credits;

      // upper bound calc
      totalIncompleteUpperBoundQP += course.course_credits * 4.0;
      totalIncompleteUpperBoundCreds += course.course_credits;
    });

    const lowerBoundGpa = (
      (totalStudentsQP + totalIncompleteLowerBoundQP) /
      (totalStudentCreds + totalIncompleteLowerBoundCreds)
    ).toFixed(2);

    const upperBoundGpa = (
      (totalStudentsQP + totalIncompleteUpperBoundQP) /
      (totalStudentCreds + totalIncompleteUpperBoundCreds)
    ).toFixed(2);

    if (desiredGPA < lowerBoundGpa || desiredGPA > upperBoundGpa)
      return res.status(200).json({
        msg: "Desired GPA is outside the possible range.",
        desiredGPA,
        lowerBoundGpa,
        upperBoundGpa,
      });

    return res.status(200).json({ msg: "Your desired gpa is achievable" });
  } catch (error) {
    return res.status(500).json({
      msg: "Error calculating course grades for desired gpa",
      error: error,
    });
  }
}

type WhatIfCourse = {
  courseCode: string;
  estimatedGrade?: Exclude<keyof typeof gradeToQualityPoint, "P/CR"> | "";
};
export async function getGPAEstimator(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  const { whatIfCourses } = req.body as { whatIfCourses: WhatIfCourse[] };

  try {
    const student = await userModel.findById(_id);
    if (!student)
      return res
        .status(404)
        .json({ msg: "Can't estimate gpa because student doesn't exist" });

    const deptCourses = await courseModel
      .find({ course_department: department })
      .lean();

    let studentTotalQP = 0;
    let studentTotalCredits = 0;

    // join dept courses with student taken courses to get course credit info from deptCourses for calculating students total credits & total quality points(QP)
    deptCourses.map((deptCourse) => {
      const matchingCourse = student.courses?.find(
        (course) => course.courseCode === deptCourse.course_code
      );
      // calculate students total credits & total quality points(QP)
      if (matchingCourse) {
        if (matchingCourse?.grade !== undefined) {
          const currCourseQP =
            deptCourse.course_credits *
            gradeToQualityPoint[matchingCourse.grade];
          studentTotalQP += currCourseQP;
          studentTotalCredits += deptCourse.course_credits;
        }
      }
    });

    let totalEstimatedQP = 0;
    let totalEstimatedCreds = 0;

    whatIfCourses.forEach((whatIfCourse) => {
      if (
        whatIfCourse.estimatedGrade === undefined ||
        whatIfCourse.estimatedGrade === ""
      )
        return;

      const matchingCourse = deptCourses.find(
        (deptCourse) => deptCourse.course_code === whatIfCourse.courseCode
      );

      if (matchingCourse) {
        if (
          whatIfCourse.courseCode !== undefined &&
          whatIfCourse.estimatedGrade !== undefined
        ) {
          totalEstimatedQP +=
            matchingCourse.course_credits *
            gradeToQualityPoint[whatIfCourse.estimatedGrade];
          totalEstimatedCreds += matchingCourse.course_credits;
        } else
          return res.status(400).json({
            msg: `Invalid course grade for ${whatIfCourse.courseCode}`,
          });
      } else {
        return res.status(400).json({
          msg: `Course ${whatIfCourse.courseCode} doesn't belong to ${department}`,
        });
      }
    });

    let msg: string;
    let change: string;
    if (student.gpa !== undefined && student.gpa > 0) {
      const estimatedGPA = parseFloat(
        (
          (studentTotalQP + totalEstimatedQP) /
          (studentTotalCredits + totalEstimatedCreds)
        ).toFixed(2)
      );
      const percentDiff = (
        (Math.abs(estimatedGPA - student.gpa) / student.gpa) *
        100
      ).toFixed(2);

      if (estimatedGPA > student.gpa) {
        msg = `Receiving these grade(s) would boost your GPA by ${percentDiff}%`;
        change = "gain";
      } else if (estimatedGPA < student.gpa) {
        msg = `Receiving these grade(s) would drop your GPA by ${percentDiff}%`;
        change = "loss";
      } else {
        msg = `Receiving these grades(s) would keep your GPA the same`;
        change = "";
      }
      return res.status(200).json({ estimatedGPA, msg, change });
    } else if (student.gpa === 0) {
      const estimatedGPA = parseFloat(
        (
          (studentTotalQP + totalEstimatedQP) /
          (studentTotalCredits + totalEstimatedCreds)
        ).toFixed(2)
      );
      return res.status(200).json({
        estimatedGPA,
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error calculating estimated gpa", error: error });
  }
}
