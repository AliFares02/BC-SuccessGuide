import express from "express";
import coursesRouter from "./coursesRouter";
import usersRouter from "./usersRouter";
import activityRouter from "./activityRouter";

const router = express.Router();

router.use("/courses", coursesRouter);

router.use("/users", usersRouter);

router.use("/activities", activityRouter);

export default router;
