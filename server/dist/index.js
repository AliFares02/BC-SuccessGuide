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
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    methods: "*",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));
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
