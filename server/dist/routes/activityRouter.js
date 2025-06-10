"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const activityController_1 = require("../controllers/activityController");
const authenticateToken_1 = __importDefault(require("../middleware/authenticateToken"));
const authenticateAdmin_1 = __importDefault(require("../middleware/authenticateAdmin"));
const router = express_1.default.Router();
router.get("/semester/:semester", authenticateToken_1.default, activityController_1.getActivitiesBySemester);
router.post("/create-activity", authenticateToken_1.default, authenticateAdmin_1.default, activityController_1.createActivity);
router.get("/activity/:activityId", authenticateToken_1.default, activityController_1.getActivity);
router.patch("/update-activity/:activityId", authenticateToken_1.default, authenticateAdmin_1.default, activityController_1.updateActivity);
router.delete("/delete-activity/:activityId", authenticateToken_1.default, authenticateAdmin_1.default, activityController_1.deleteActivity);
router.get("/student-activities/:studentYr", authenticateToken_1.default, activityController_1.getAllActivitiesForStudent);
exports.default = router;
