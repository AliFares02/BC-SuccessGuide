import express from "express";
import {
  getActivitiesBySemester,
  createActivity,
  getActivity,
  updateActivity,
  deleteActivity,
  getAllActivitiesForStudent,
} from "../controllers/activityController";

const router = express.Router();

router.get("/semester/:semester", getActivitiesBySemester);

router.post("/create-activity", createActivity);

router.get("/:activityId", getActivity);

router.patch("/update-activity/:activityId", updateActivity);

router.delete("/delete-activity/:activityId", deleteActivity);

router.get("/:studentId/:semester", getAllActivitiesForStudent);

export default router;
