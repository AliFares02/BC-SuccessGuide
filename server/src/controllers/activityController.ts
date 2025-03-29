import activityModel from "../models/activityModel";
import { Request, Response } from "express";

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
    res.status(500).json({ msg: "Server Error", error: error });
  }
}

export async function createActivity(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const activity = await activityModel.create(req.body);
    return res.status(200).json({ msg: "Activity created", activity });
  } catch (error) {
    return res
      .status(400)
      .json({ msg: "Error creating activity", error: error });
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
    return res.status(500).json({ msg: "Server error", error: error });
  }
}

// const semester = req.body.semester;
// const studentId = req.body.studentId;

// try {
//   // Fetch all activities for the semester
//   const activities = await activityModel.find({ activity_semester: semester });

//   // Fetch the student's activities
//   const student = await studentModel.findById(studentId).select('activities');

//   // Map completed activities (based on activityId) to the activities
//   const completedActivityIds = student.activities
//     .filter(activity => activity.isCompleted)
//     .map(activity => activity.activityId.toString());

//   // Add completion info to the activity
//   const activitiesWithCompletion = activities.map(activity => ({
//     ...activity.toObject(),
//     isCompleted: completedActivityIds.includes(activity._id.toString()),
//   }));

//   // Send activities to frontend
//   res.json(activitiesWithCompletion);

// } catch (error) {
//   console.error(error);
//   res.status(500).send('Error fetching activities');
// }
