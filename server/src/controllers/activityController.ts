import activityModel from "../models/activityModel";
import userModel from "../models/userModel";
import { Request, Response } from "express";
import getSemester from "../utils/getCurrentSemester";

interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    role: string;
    department: string;
  };
}

export async function getActivitiesBySemester(
  req: Request,
  res: Response
): Promise<any> {
  const semester = req.params.semester;
  try {
    const activities = await activityModel.find({
      activity_semester: semester,
    });
    if (!activities || activities.length === 0) {
      return res
        .status(404)
        .json({ msg: "No milestone activites for this semester" });
    }
    return res.status(200).json({ activities });
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error });
  }
}

export async function getAllActivitiesForStudent(
  req: Request,
  res: Response
): Promise<any> {
  const studentId = (req as AuthenticatedRequest).user?._id;
  const { department } = (req as AuthenticatedRequest).user;
  const currentSemester = getSemester().split(" ")[0];
  const { studentYr } = req.params;
  try {
    const allActivitiesForSemester = await activityModel.find({
      activity_semester: currentSemester,
      activity_department: department,
      activity_year: studentYr,
    });
    if (!allActivitiesForSemester) {
      return res.status(404).json({ msg: "No activities for this semester" });
    }

    // return an array of the students activities(includes both completed and in progress activities)
    const studentActivities = await userModel
      .findById(studentId)
      .select("activities");
    const studentActivitiesArray = studentActivities?.activities;

    if (!studentActivities) {
      return res.status(404).json({
        msg: "Can't find activities for this student as they do not exist",
      });
    }

    // match the completed/in progress activities with the allactivities array based on activityid to get a filtered array that has all activities with in progress and complete ones marked accordingly
    const studentActivityIdsAndStatus = studentActivitiesArray?.map(
      (activity) => ({
        activityId: activity.activityId?.toString(),
        comment: activity.comment,
        status: activity.status,
      })
    );

    let numOfSemActivitiesCompleted = 0;
    const combinedActivites = allActivitiesForSemester.map((activity) => {
      const matchedActivity = studentActivityIdsAndStatus?.find(
        (studentActivity) =>
          studentActivity.activityId === activity._id.toString()
      );

      if (matchedActivity) {
        if (matchedActivity.status === "completed") {
          numOfSemActivitiesCompleted++;
        }
        return {
          activity,
          comment: matchedActivity.comment,
          status: matchedActivity.status,
        };
      } else {
        return {
          activity,
        };
      }
    });
    res.status(200).json({ combinedActivites, numOfSemActivitiesCompleted });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error });
  }
}

export async function createActivity(
  req: Request,
  res: Response
): Promise<any> {
  const {
    activity_description,
    activity_category,
    activity_semester,
    activity_year,
  } = req.body;

  if (
    !activity_description?.trim() ||
    !activity_category?.trim() ||
    !activity_semester?.trim() ||
    !activity_year?.trim()
  )
    return res.status(400).json({ msg: "Missing activity fields" });
  const { department } = (req as AuthenticatedRequest).user;
  try {
    const activity = await activityModel.create({
      ...req.body,
      activity_department: department,
      activity_description: activity_description.trim(),
    });
    return res.status(200).json({ msg: "Activity created", activity });
  } catch (error) {
    return res.status(400).json({ msg: "Error creating activity", error });
  }
}

export async function getActivity(req: Request, res: Response): Promise<any> {
  const activityId = req.params.activityId;
  try {
    const activity = await activityModel.findById(activityId);
    if (!activity) {
      return res.status(404).json({ msg: "Activity does not exist" });
    }
    return res.status(200).json({ activity });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error });
  }
}

interface activityBody {
  _id?: string;
  activity_category?: string;
  activity_department?: string;
  activity_description?: string;
  activity_info_link?: string;
  activity_semester?: string;
  activity_year?: string;
}
export async function updateActivity(
  req: Request<{ activityId: string }, unknown, activityBody>,
  res: Response
): Promise<any> {
  const activityId = req.params.activityId;
  const activityUpdates: activityBody = req.body;
  try {
    const activity = await activityModel.findByIdAndUpdate(
      activityId,
      activityUpdates,
      { new: true, runValidators: true }
    );
    if (!activity) {
      return res.status(404).json({ msg: "Activity not found" });
    }
    return res.status(200).json({ msg: "Activity updated", activity });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error });
  }
}

export async function deleteActivity(
  req: Request,
  res: Response
): Promise<any> {
  const activityId = req.params.activityId;

  try {
    const activity = await activityModel.findByIdAndDelete(activityId);
    if (!activity) {
      return res.status(404).json({ msg: "Activity not found" });
    }
    await userModel.updateMany({}, { $pull: { activities: { activityId } } });
    return res
      .status(200)
      .json({ msg: "Activity deleted and references removed", activityId });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error });
  }
}
