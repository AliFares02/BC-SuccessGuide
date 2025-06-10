"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        res.status(401).json({ msg: "No token provided" });
        return;
    }
    const secret = process.env.JWT_SECRET;
    try {
        const { _id, role, department } = jsonwebtoken_1.default.verify(token, secret);
        req.user = { _id, role, department };
        next();
    }
    catch (error) {
        res.status(401).json({ msg: "Unauthorized request" });
    }
}
exports.default = authenticateToken;
