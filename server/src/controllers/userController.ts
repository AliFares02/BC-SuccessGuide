import activityModel from "../models/activityModel";
import userModel from "../models/userModel";
import { Request, Response } from "express";

// public endpoint
export async function signUp(req: Request, res: Response): Promise<any> {
  const userBody = req.body;
  try {
    const userExists = await userModel.findOne({ email: userBody.email });
    if (userExists)
      return res.status(409).json({ msg: "Email already in use" });

    const user = await userModel.create(userBody);
    return res.status(200).json({ msg: "User created" });
  } catch (error) {
    return res.status(500).json({ msg: "Error creating user", error: error });
  }
}

// public endpoint
export async function login(req: Request, res: Response): Promise<any> {
  const credentials = req.body;
  try {
    const user = await userModel.findOne({ email: credentials.email });
    if (!user) return res.status(404).json({ msg: "User does not exist" });

    if (credentials.password !== user.hashed_password)
      return res.status(401).json({ msg: "Invalid credentials" });

    return res.status(200).json({
      msg: "Login successful",
      access_token: "Here is your access token",
      user,
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
        msg: "Can't return student activities because student does not exist",
      });
    const studentActivities = await userModel
      .findById(studentId)
      .select("activities")
      .populate("activities.activityId");
    return res.status(200).json({ activities: studentActivities?.activities });
  } catch (error) {
    return res.status(500).json({
      msg: "Error fetching student activities, please try again later",
      error: error,
    });
  }
}
