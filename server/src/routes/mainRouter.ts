import express from "express";
import coursesRouter from "./coursesRouter";
import usersRouter from "./usersRouter";
import activityRouter from "./activityRouter";
// import other routers and invoke in mainRouter

const router = express.Router();

// use courses router
router.use("/courses", coursesRouter);

// use users router
router.use("/users", usersRouter);

// use activity router
router.use("/activities", activityRouter);

export default router;
