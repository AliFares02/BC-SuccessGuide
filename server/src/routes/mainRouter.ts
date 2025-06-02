import express from "express";
import coursesRouter from "./coursesRouter";
import usersRouter from "./usersRouter";
import adminRouter from "./adminRouter";
import activityRouter from "./activityRouter";

const router = express.Router();

router.use("/courses", coursesRouter);

router.use("/users", usersRouter);

router.use("/admin", adminRouter);

router.use("/activities", activityRouter);

export default router;
