import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ msg: "admin router/endpoint" });
});

export default router;
