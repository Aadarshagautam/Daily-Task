import OrganizationModel from "../models/Organization.js";
import OrgMemberModel from "../models/OrgMember.js";
import UserModel from "../models/User.js";
import { logAudit } from "../utils/auditLogger.js";

export const getOrganization = async (req, res) => {
  try {
    if (!req.orgId) {
      return res.json({ success: false, message: "No organization selected" });
    }
    const org = await OrganizationModel.findById(req.orgId);
    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }
    res.json({ success: true, org });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateOrganization = async (req, res) => {
  try {
    if (!req.orgId) {
      return res.json({ success: false, message: "No organization selected" });
    }
    const org = await OrganizationModel.findById(req.orgId);
    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
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
    res.json({ success: true, org });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMembers = async (req, res) => {
  try {
    if (!req.orgId) {
      return res.json({ success: false, message: "No organization selected" });
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

    res.json({ success: true, members: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    if (!req.orgId) {
      return res.json({ success: false, message: "No organization selected" });
    }

    const { memberId } = req.params;
    const { role } = req.body;

    const validRoles = ["owner", "admin", "manager", "member", "viewer"];
    if (!validRoles.includes(role)) {
      return res.json({ success: false, message: "Invalid role" });
    }

    const member = await OrgMemberModel.findOne({ _id: memberId, orgId: req.orgId });
    if (!member) {
      return res.json({ success: false, message: "Member not found" });
    }

    const oldRole = member.role;
    member.role = role;
    await member.save();

    logAudit({
      action: "update", module: "settings", targetId: member.userId,
      description: `Changed role from ${oldRole} to ${role}`,
      changes: { role: { old: oldRole, new: role } },
    }, req);

    res.json({ success: true, member });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
