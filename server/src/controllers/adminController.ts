import mongoose from "mongoose";
import { Request, Response } from "express";
import userModel from "../models/userModel";
import activityModel from "../models/activityModel";
import courseModel from "../models/courseModel";
import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import getSemester from "../utils/getCurrentSemester";

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

export async function signUpAdmin(req: Request, res: Response): Promise<any> {
  const { email, password, department } = req.body;

  if (!email || !password || !department)
    return res.status(401).json({ msg: "Missing credentials" });

  if (!email.trim() || !password.trim() || !department)
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

    const admin = await userModel.create({
      email,
      hashed_password: hash,
      role: "admin",
      department,
    });

    const token = createToken(
      admin._id.toString(),
      admin.email,
      admin.role,
      admin.department
    );

    return res.status(200).json({
      msg: "Admin created",
      email: admin.email,
      department: admin.department,
      access_token: token,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Error creating admin", error: error });
  }
}

export async function loginAdmin(req: Request, res: Response): Promise<any> {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(401).json({ msg: "Missing credentials" });

  if (!email.trim() || !password.trim())
    return res.status(401).json({ msg: "Missing credentials" });

  try {
    const admin = await userModel.findOne({ email: email, role: "admin" });
    if (!admin) return res.status(404).json({ msg: "Invalid credentials" });

    const matchingPassword = await bcrypt.compare(
      password,
      admin.hashed_password
    );

    if (!matchingPassword)
      return res.status(401).json({ msg: "Invalid credentials" });

    const token = createToken(
      admin._id.toString(),
      admin.email,
      admin.role,
      admin.department
    );

    return res.status(200).json({
      msg: "Login successful",
      email: admin.email,
      department: admin.department,
      access_token: token,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error logging in, please try again later", error: error });
  }
}

export async function getAdminAccount(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  try {
    const admin = await userModel.findOne({ _id, department });
    if (!admin) return res.status(404).json({ msg: "Invalid admin" });

    const adminAcct = {
      email: admin.email,
    };
    return res.status(200).json(adminAcct);
  } catch (error) {
    return res.status(500).json({
      msg: "Error retrieving student account, please try again later",
      error: error,
    });
  }
}

interface UpdatedAdminAccount {
  email?: string;
  hashed_password?: string;
}

export async function updateAdminAccount(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  const { updatedAdminAcctInfo } = req.body;

  const parsedUpdates: UpdatedAdminAccount = {};

  try {
    const admin = await userModel.findOne({ _id, department });
    if (!admin) return res.status(400).json({ msg: "Invalid student" });

    if (updatedAdminAcctInfo?.email?.trim()) {
      if (!validator.isEmail(updatedAdminAcctInfo.email.trim())) {
        return res.status(401).json("Invalid email");
      }
      parsedUpdates.email = updatedAdminAcctInfo.email.trim();
    }

    if (updatedAdminAcctInfo?.password?.trim()) {
      const samePassword = await bcrypt.compare(
        updatedAdminAcctInfo.password.trim(),
        admin.hashed_password
      );
      if (samePassword) {
        return res.status(400).json({
          msg: "New password must be different from the current password.",
        });
      }
      if (!validator.isStrongPassword(updatedAdminAcctInfo.password.trim())) {
        return res.status(401).json({ msg: "Invalid password" });
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(
        updatedAdminAcctInfo.password.trim(),
        salt
      );
      parsedUpdates.hashed_password = hash;
    }
    admin.set(parsedUpdates);
    await admin.save();
    const { email } = admin.toObject();
    return res.status(200).json({
      msg: "Admin account updated",
      admin: { email },
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error updating admin account, please try again later",
      error: error,
    });
  }
}

interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    role: string;
    department: string;
  };
}
export async function getAllStudents(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;

  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const sortBy =
    typeof req.query.sortBy === "string" ? req.query.sortBy : "name";
  const order = req.query.order === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  try {
    const admin = await userModel.findById(_id);

    if (!admin) return res.status(404).json({ msg: "Invalid admin" });

    const students = await userModel
      .find({ role: "student", department: department })
      .populate("activities.activityId", "activity_description")
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit)
      .select("_id name email department year gpa courses activities")
      .lean();

    const total = await userModel.countDocuments({
      role: "student",
      department: department,
    });

    if (department === "Communication") {
      const commConcCourses = await courseModel
        .find({ course_department: department, isConcentrationCourse: true })
        .lean();
      const commStudents = students.map((student) => {
        const chosenConcentration = commConcCourses.find((course) =>
          student.courses?.find(
            (stdntCourse) =>
              stdntCourse.courseCode === course.course_code &&
              stdntCourse.status === "taken"
          )
        )?.concentration;
        const studentCommCourses = student.courses?.map((stdntCourse) => {
          const isConcCourse = commConcCourses.find(
            (course) =>
              course.course_code === stdntCourse.courseCode &&
              stdntCourse.status === "taken"
          );

          if (isConcCourse) {
            return {
              ...stdntCourse,
              concentration: isConcCourse.concentration,
            };
          }
          return stdntCourse;
        });
        if (
          chosenConcentration &&
          studentCommCourses &&
          studentCommCourses?.length > 0
        ) {
          return {
            ...student,
            courses: studentCommCourses,
            concentration: chosenConcentration,
          };
        }
        return student;
      });

      return res.status(200).json({
        students: commStudents,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStudents: total,
      });
    }

    return res.status(200).json({
      students,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalStudents: total,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error retrieving students", error: error });
  }
}

export async function getAvgStudentGPA(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  try {
    const admin = await userModel.findById(_id);

    if (!admin) return res.status(404).json({ msg: "Invalid admin" });

    const students = await userModel
      .find({ role: "student", department: department })
      .select("gpa")
      .lean();

    const studentsWithGPA = students.filter(
      (students) => students.gpa && students.gpa > 0
    );
    const totalStudentsWithGPA = studentsWithGPA.length;
    let gpaSum = 0;
    for (const student of studentsWithGPA) {
      if (student.gpa) {
        gpaSum += student.gpa;
      }
    }
    const averageGPA =
      totalStudentsWithGPA > 0
        ? parseFloat((gpaSum / totalStudentsWithGPA).toFixed(2))
        : 0;

    return res.status(200).json({
      averageGPA,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error retrieving average student gpa", error: error });
  }
}

export async function getAllCoursesWithEnrollmentCt(
  req: Request,
  res: Response
): Promise<any> {
  const { department } = (req as AuthenticatedRequest).user;

  //perform conditional check to see if department is COMM and if it is, query the concentration courses as a separate list and return it as well as the core courses
  try {
    const courses = await courseModel
      .find({
        course_department: department,
      })
      .lean();
    if (!courses || courses.length == 0) {
      return res.status(404).json({ msg: "No courses found" });
    }

    const courseCodes = courses.map((course) => course.course_code);

    const nonConcCourses = courses.filter(
      (course) => !course.isConcentrationCourse
    );

    const nonConcCourseCodes = nonConcCourses.map(
      (course) => course.course_code
    );

    const existingPrereqStructure = new Map<string, string[]>();

    courses.forEach((course) => {
      if (!course.isConcentrationCourse) {
        existingPrereqStructure.set(
          course.course_code,
          course.course_prerequisites || []
        );
      }
    });

    const enrollmentCts = await userModel.aggregate([
      { $unwind: "$courses" },
      {
        $match: {
          "courses.courseCode": { $in: courseCodes },
          "courses.status": "in-progress",
        },
      },
      {
        $group: {
          _id: "$courses.courseCode",
          count: { $sum: 1 },
        },
      },
    ]);

    const countsMap = new Map(
      enrollmentCts.map((courseWithEnrollment) => [
        courseWithEnrollment._id,
        courseWithEnrollment.count,
      ])
    );

    const coursesWithDetailsAndCounts = courses
      .map((course) => ({
        ...course,
        enrollmentCount: countsMap.get(course.course_code) || 0,
      }))
      .sort((courseA, courseB) =>
        courseA.course_code.localeCompare(courseB.course_code, undefined, {
          numeric: true,
        })
      );

    return res.status(200).json({
      coursesWithDetailsAndCounts,
      availablePrereqs: nonConcCourseCodes,
      existingPrereqStructure: Object.fromEntries(existingPrereqStructure),
    });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
}

export async function getCourseEnrollees(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  const { courseCode } = req.params;

  try {
    const admin = await userModel.findById(_id);
    if (!admin) return res.status(404).json({ msg: "Invalid admin" });

    const course = await courseModel.findOne({
      course_code: courseCode,
      course_department: department,
    });
    if (!course) return res.status(404).json({ msg: "Invalid course" });

    const enrollees = await userModel
      .find({
        courses: {
          $elemMatch: {
            courseCode: courseCode,
            status: "in-progress",
          },
        },
      })
      .select("gpa name _id")
      .lean();

    const enrolleesWithGPA = enrollees.filter(
      (enrollees) => enrollees.gpa && enrollees.gpa > 0
    );
    const totalEnrolled = enrolleesWithGPA.length;
    let gpaSum = 0;
    for (const enrollee of enrolleesWithGPA) {
      if (enrollee.gpa) {
        gpaSum += enrollee.gpa;
      }
    }
    const averageGPA =
      totalEnrolled > 0 ? parseFloat((gpaSum / totalEnrolled).toFixed(2)) : 0;
    return res.status(200).json({ enrollees, averageGPA });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error retrieving enrollees", error: error });
  }
}

export async function unenrollStudentFromCourse(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  const { courseCode, studentId } = req.params;

  try {
    const admin = await userModel.findById(_id);
    if (!admin) return res.status(404).json({ msg: "Invalid admin" });

    const student = await userModel.findOne({
      _id: studentId,
      department: department,
    });

    if (!student) return res.status(404).json({ msg: "Invalid student" });

    student.courses = student.courses?.filter(
      (course) => course.courseCode !== courseCode
    );

    await student.save();
    return res
      .status(200)
      .json({ msg: "Student unenrolled", student: student._id });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error unenrolling student", error: error });
  }
}

export async function getCourseComments(
  req: Request,
  res: Response
): Promise<any> {
  const { _id } = (req as AuthenticatedRequest).user;
  const { courseCode } = req.params;

  try {
    const admin = await userModel.findById(_id);
    if (!admin) return res.status(404).json({ msg: "Invalid admin" });

    const comments = await userModel.aggregate([
      {
        $unwind: "$courses",
      },
      {
        $match: {
          "courses.courseCode": courseCode,
          "courses.status": "taken",
          "courses.comment": { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          _id: 0,
          comment: "$courses.comment",
        },
      },
    ]);

    const commentStrings = comments.map((entry) => entry.comment);
    return res.status(200).json({ commentStrings });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error retrieving course comments", error: error });
  }
}

export async function getAllActivitiesWithNumOfCurrEngaged(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  try {
    const admin = await userModel.findById(_id);
    if (!admin) return res.status(404).json({ msg: "Invalid admin" });

    const activities = await activityModel
      .find({ activity_department: department })
      .lean();
    const results = await Promise.all(
      activities.map(async (activity) => {
        const count = await userModel.countDocuments({
          activities: {
            $elemMatch: {
              activityId: activity._id,
              status: "in-progress",
            },
          },
        });

        return {
          ...activity,
          engagedStudentCount: count,
        };
      })
    );
    return res.status(200).json({ activities: results });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error retrieving activities", error: error });
  }
}

export async function getListOfInactiveStudentsForCurrentSem(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  try {
    const admin = await userModel.findById(_id);
    if (!admin) return res.status(404).json({ msg: "Invalid admin" });

    const currentSemester = getSemester().split(" ")[0];
    const activities = await activityModel
      .find({ activity_department: department, semester: currentSemester })
      .lean();
    const totalActivities = activities.length;

    const students = await userModel
      .find({ department, role: "student" })
      .select("name email gpa activities")
      .lean();

    const studentsWithLowEngagement = students
      .filter((student) => {
        const engagedActivities = (student.activities || []).filter(
          (activity) =>
            activities.find(
              (semesterActivity) =>
                semesterActivity._id.toString() ===
                activity.activityId.toString()
            )
        );

        const ratioActiveToTotal =
          totalActivities === 0
            ? 0
            : engagedActivities?.length / totalActivities;

        return ratioActiveToTotal < 0.25;
      })
      .map((studentDetails) => ({
        name: studentDetails.name,
        email: studentDetails.email,
        gpa: studentDetails.gpa,
      }));

    const lowEngagementStudentsPercent =
      students.length === 0
        ? 0
        : (studentsWithLowEngagement.length / students.length) * 100;

    return res
      .status(200)
      .json({ lowEngagementStudentsPercent, studentsWithLowEngagement });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error retrieving inactive students", error: error });
  }
}

export async function getActivityActiveStudents(
  req: Request,
  res: Response
): Promise<any> {
  const { _id, department } = (req as AuthenticatedRequest).user;
  const { activityId } = req.params;
  try {
    const admin = await userModel.findById(_id);
    if (!admin) return res.status(404).json({ msg: "Invalid admin" });

    const activity = await activityModel.findOne({
      _id: activityId,
      activity_department: department,
    });
    if (!activity) return res.status(404).json({ msg: "Invalid activity" });

    const activeStudents = await userModel
      .find({
        activities: {
          $elemMatch: {
            activityId: activityId,
            status: "in-progress",
          },
        },
      })
      .select("_id name email")
      .lean();

    return res.status(200).json({ activeStudents });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error retrieving active students", error: error });
  }
}
