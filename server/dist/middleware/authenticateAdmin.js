"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function authenticateAdmin(req, res, next) {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res.status(401).json({ msg: "Unauthorized: Admin access required." });
        return;
    }
    next();
}
exports.default = authenticateAdmin;
