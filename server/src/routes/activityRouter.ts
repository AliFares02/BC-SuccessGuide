import express from "express";
import {
  getActivitiesBySemester,
  createActivity,
  getActivity,
  updateActivity,
  deleteActivity,
  getAllActivitiesForStudent,
} from "../controllers/activityController";
import authenticateToken from "../middleware/authenticateToken";
import authenticateAdmin from "../middleware/authenticateAdmin";

const router = express.Router();

router.get("/semester/:semester", authenticateToken, getActivitiesBySemester);

router.post(
  "/create-activity",
  authenticateToken,
  authenticateAdmin,
  createActivity
);

router.get("/activity/:activityId", authenticateToken, getActivity);

router.patch(
  "/update-activity/:activityId",
  authenticateToken,
  authenticateAdmin,
  updateActivity
);

router.delete(
  "/delete-activity/:activityId",
  authenticateToken,
  authenticateAdmin,
  deleteActivity
);

router.get(
  "/student-activities/:semester",
  authenticateToken,
  getAllActivitiesForStudent
);

export default router;
