import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ msg: "Hello you have reached courses endpoint/router" });
});

export default router;
