import UserModel from "../models/User.js";
import OrganizationModel from "../models/Organization.js";
import OrgMemberModel from "../models/OrgMember.js";
import { ROLE_PERMISSIONS } from "../config/permissions.js";

export const getUserData = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await UserModel.findById(userId).select('-password');

        if (!user) {
          return res.json({ success: false, message: "User not found" });
        }

        let orgName = null;
        let role = null;
        let permissions = [];

        if (user.currentOrgId) {
          const [org, membership] = await Promise.all([
            OrganizationModel.findById(user.currentOrgId).select("name"),
            OrgMemberModel.findOne({ orgId: user.currentOrgId, userId: user._id, isActive: true }),
          ]);
          orgName = org?.name || null;
          role = membership?.role || null;
          // Merge role defaults with individual overrides
          const rolePerms = ROLE_PERMISSIONS[membership?.role] || [];
          permissions = [...new Set([...rolePerms, ...(membership?.permissions || [])])];
        }

        return res.json({
          success: true,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            isAccountVerified: user.isAccountVerified,
            orgId: user.currentOrgId || null,
            orgName,
            role,
            permissions,
          }
        });
      } catch (error) {
        console.error("Get user data error:", error);
        return res.json({ success: false, message: "Failed to get user data" });
      }
}
