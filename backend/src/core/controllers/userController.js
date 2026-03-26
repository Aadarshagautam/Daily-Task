import UserModel from "../models/User.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { resolveWorkspaceContextForUser } from "../utils/workspace.js";

export const getUserData = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await UserModel.findById(userId).select('-password');

        if (!user) {
          return sendError(res, { status: 404, message: "User not found" });
        }

        const workspace = await resolveWorkspaceContextForUser(user);

        return sendSuccess(res, {
          data: {
            id: user._id,
            username: user.username,
            email: user.email,
            isAccountVerified: user.isAccountVerified,
            orgId: workspace.orgId,
            orgName: workspace.orgName,
            orgBusinessType: workspace.orgBusinessType,
            orgSoftwarePlan: workspace.orgSoftwarePlan,
            branchId: workspace.branchId,
            branchName: workspace.branchName,
            role: workspace.role,
            permissions: workspace.permissions,
          },
        });
      } catch (error) {
        console.error("Get user data error:", error);
        return sendError(res, { status: 500, message: "Failed to get user data" });
      }
}
