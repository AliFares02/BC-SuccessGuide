import express from "express";
import coursesRouter from "./coursesRouter";
import usersRouter from "./usersRouter";
// import other routers and invoke in mainRouter

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ msg: "GET hello from mainRouter" });
});

// use courses router
router.use("/courses", coursesRouter);

// use users router
router.use("/users", usersRouter);

export default router;
