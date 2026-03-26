import OrganizationModel from "../models/Organization.js";
import OrgMemberModel from "../models/OrgMember.js";
import BranchModel from "../models/Branch.js";
import { ROLE_PERMISSIONS } from "../config/permissions.js";
import { normalizeBusinessType } from "./onboarding.js";

const getIdString = (value) => (value ? value.toString() : null);

export const resolveWorkspaceContextForUser = async (
  user,
  { includeOrganization = true, includeBranch = true } = {}
) => {
  if (!user?._id) {
    return {
      orgId: null,
      orgName: null,
      orgBusinessType: "shop",
      orgSoftwarePlan: "single-branch",
      branchId: null,
      branchName: null,
      membership: null,
      role: null,
      permissions: [],
    };
  }

  let membership = null;

  if (user.currentOrgId) {
    membership = await OrgMemberModel.findOne({
      orgId: user.currentOrgId,
      userId: user._id,
      isActive: true,
    });
  }

  if (!membership) {
    membership = await OrgMemberModel.findOne({
      userId: user._id,
      isActive: true,
    }).sort({ createdAt: 1 });
  }

  const resolvedOrgId = membership?.orgId || null;

  if (getIdString(user.currentOrgId) !== getIdString(resolvedOrgId)) {
    await user.updateOne({ currentOrgId: resolvedOrgId });
    user.currentOrgId = resolvedOrgId;
  }

  const [org, branch] = await Promise.all([
    includeOrganization && resolvedOrgId
      ? OrganizationModel.findById(resolvedOrgId).select("name businessType softwarePlan")
      : Promise.resolve(null),
    includeBranch && membership?.branchId
      ? BranchModel.findById(membership.branchId).select("name")
      : Promise.resolve(null),
  ]);

  const role = membership?.role || null;
  const rolePerms = ROLE_PERMISSIONS[role] || [];

  return {
    orgId: resolvedOrgId,
    orgName: org?.name || null,
    orgBusinessType: normalizeBusinessType(org?.businessType),
    orgSoftwarePlan: org?.softwarePlan || "single-branch",
    branchId: membership?.branchId || null,
    branchName: branch?.name || null,
    membership,
    role,
    permissions: [...new Set([...rolePerms, ...(membership?.permissions || [])])],
  };
};
