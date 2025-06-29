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

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.includes("bc-successguide")
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Apply the same configuration to both
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
