import OrganizationModel from "../models/Organization.js";
import OrgMemberModel from "../models/OrgMember.js";
import UserModel from "../models/User.js";
import { logAudit } from "../utils/auditLogger.js";
import { sendError, sendSuccess } from "../utils/response.js";

export const getOrganization = async (req, res) => {
  try {
    if (!req.orgId) {
      return sendError(res, { status: 400, message: "No organization selected" });
    }
    const org = await OrganizationModel.findById(req.orgId);
    if (!org) {
      return sendError(res, { status: 404, message: "Organization not found" });
    }
    return sendSuccess(res, { data: org });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const updateOrganization = async (req, res) => {
  try {
    if (!req.orgId) {
      return sendError(res, { status: 400, message: "No organization selected" });
    }
    const org = await OrganizationModel.findById(req.orgId);
    if (!org) {
      return sendError(res, { status: 404, message: "Organization not found" });
    }

    const { name, phone, email, gstin, currency, financialYearStart, invoicePrefix, address } = req.body;
    if (name) org.name = name;
    if (phone !== undefined) org.phone = phone;
    if (email !== undefined) org.email = email;
    if (gstin !== undefined) org.gstin = gstin;
    if (currency) org.currency = currency;
    if (financialYearStart) org.financialYearStart = financialYearStart;
    if (invoicePrefix) org.invoicePrefix = invoicePrefix;
    if (address) org.address = address;

    await org.save();
    logAudit({ action: "update", module: "settings", targetId: org._id, targetName: org.name, description: "Updated company settings" }, req);
    return sendSuccess(res, { data: org, message: "Organization updated" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getMembers = async (req, res) => {
  try {
    if (!req.orgId) {
      return sendError(res, { status: 400, message: "No organization selected" });
    }

    const members = await OrgMemberModel.find({ orgId: req.orgId }).sort({ role: 1 });
    // Populate user info
    const userIds = members.map(m => m.userId);
    const users = await UserModel.find({ _id: { $in: userIds } }).select("username email");
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const result = members.map(m => ({
      _id: m._id,
      userId: m.userId,
      username: userMap[m.userId.toString()]?.username || "Unknown",
      email: userMap[m.userId.toString()]?.email || "",
      role: m.role,
      permissions: m.permissions,
      isActive: m.isActive,
      createdAt: m.createdAt,
    }));

    return sendSuccess(res, { data: result });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    if (!req.orgId) {
      return sendError(res, { status: 400, message: "No organization selected" });
    }

    const { memberId } = req.params;
    const { role } = req.body;

    const validRoles = ["owner", "admin", "manager", "member", "viewer"];
    if (!validRoles.includes(role)) {
      return sendError(res, { status: 400, message: "Invalid role" });
    }

    const member = await OrgMemberModel.findOne({ _id: memberId, orgId: req.orgId });
    if (!member) {
      return sendError(res, { status: 404, message: "Member not found" });
    }

    const oldRole = member.role;
    member.role = role;
    await member.save();

    logAudit({
      action: "update", module: "settings", targetId: member.userId,
      description: `Changed role from ${oldRole} to ${role}`,
      changes: { role: { old: oldRole, new: role } },
    }, req);

    return sendSuccess(res, { data: member, message: "Member role updated" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};
