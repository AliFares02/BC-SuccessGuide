"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mainRouter_1 = __importDefault(require("./routes/mainRouter"));
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./db"));
const app = (0, express_1.default)();
//cors configuration
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",")
    : [];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 ||
            origin.includes("bc-successguide")) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Explicitly list methods
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
// Handle preflight requests
app.options("*", (0, cors_1.default)());
app.use(express_1.default.json());
// main router entry point
app.use("/api", mainRouter_1.default);
(0, db_1.default)()
    .then(() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log("server started at ", process.env.PORT);
    });
})
    .catch((error) => {
    console.error("Failed to start server due to DB Connection error", error);
});
