"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const coursesRouter_1 = __importDefault(require("./coursesRouter"));
const usersRouter_1 = __importDefault(require("./usersRouter"));
const adminRouter_1 = __importDefault(require("./adminRouter"));
const activityRouter_1 = __importDefault(require("./activityRouter"));
const router = express_1.default.Router();
router.use("/courses", coursesRouter_1.default);
router.use("/users", usersRouter_1.default);
router.use("/admin", adminRouter_1.default);
router.use("/activities", activityRouter_1.default);
exports.default = router;
