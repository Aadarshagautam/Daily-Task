import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import { resolveWorkspaceContextForUser } from "../utils/workspace.js";

const userAuth = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration: missing JWT_SECRET"
      });
    }

    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    const user = await UserModel.findById(decoded.id).select("currentOrgId");
    const workspace = user
      ? await resolveWorkspaceContextForUser(user, {
          includeOrganization: false,
          includeBranch: false,
        })
      : null;
    const dbOrgId = workspace?.orgId ? workspace.orgId.toString() : null;
    const tokenOrgId = decoded.orgId ? decoded.orgId.toString() : null;

    req.userId = decoded.id;
    req.orgId = dbOrgId || null;

    if (cookieToken && dbOrgId !== tokenOrgId) {
      const refreshedToken = jwt.sign(
        { id: decoded.id, orgId: dbOrgId || null },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "7d" }
      );

      res.cookie("token", refreshedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again."
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again."
      });
    }

    console.error("Auth error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error"
    });
  }
};

export default userAuth;
