import express from "express";
import mainRouter from "./routes/mainRouter";
import "dotenv/config";
import cors from "cors";
import connectDB from "./db";

const app = express();

//cors configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "*",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// middleware for parsing all incoming data into readable format i.e js objects
app.use(express.json());

// main router entry point
app.use("/api", mainRouter);

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log("server started at ", process.env.PORT);
    });
  })
  .catch((error) => {
    console.error("Failed to start server due to DB Connection error", error);
  });
