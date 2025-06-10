import express from "express";
import mainRouter from "./routes/mainRouter";
import "dotenv/config";
import cors from "cors";
import connectDB from "./db";

const app = express();

//cors configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: "*",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
