import express from "express";
import {
  signUp,
  login,
  addActivitiesToStudent,
  getStudentActivities,
} from "../controllers/userController";

const router = express.Router();

// router.get("/", (req, res) => {
//   res.json({ msg: "admin router/endpoint" });
// });

router.post("/sign-up", signUp);

router.post("/login", login);

router.post(
  "/:studentId/student-activities/add-activity",
  addActivitiesToStudent
);

router.get("/:studentId/student-activities", getStudentActivities);

export default router;
