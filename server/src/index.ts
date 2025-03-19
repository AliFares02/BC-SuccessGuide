import express from "express";
import mainRouter from "./routes/mainRouter";
import "dotenv/config";
import connectDB from "./db";

const app = express();

// middleware
app.use(express.json());

// main router entry point
app.use("/api", mainRouter);

// connectDB()
//   .then(() => {
app.listen(process.env.PORT || 3000, () => {
  console.log("server started at ", process.env.PORT);
});
// })
// .catch((error) => {
//   console.error("Failed to start server due to DB Connection error", error);
// });
