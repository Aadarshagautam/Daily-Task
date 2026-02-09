import OrgMemberModel from "../models/OrgMember.js";
import { ROLE_PERMISSIONS, hasPermission } from "../config/permissions.js";

const permissionMiddleware = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // If no orgId, allow (backward compat for personal use)
      if (!req.orgId) return next();

      const membership = await OrgMemberModel.findOne({
        orgId: req.orgId,
        userId: req.userId,
        isActive: true,
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this organization",
        });
      }

      // Get effective permissions: role defaults + individual overrides
      const rolePerms = ROLE_PERMISSIONS[membership.role] || [];
      const allPerms = [...new Set([...rolePerms, ...membership.permissions])];

      if (!hasPermission(allPerms, requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${requiredPermission}`,
        });
      }

      req.membership = membership;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ success: false, message: "Permission check failed" });
    }
  };
};

export default permissionMiddleware;
