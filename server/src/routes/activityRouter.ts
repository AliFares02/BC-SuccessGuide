import express from "express";
import {
  getActivitiesBySemester,
  createActivity,
  getActivity,
} from "../controllers/activityController";

const router = express.Router();

router.get("/semester/:semester", getActivitiesBySemester);

router.post("/create-activity", createActivity);

router.get("/:activityId", getActivity);

export default router;
