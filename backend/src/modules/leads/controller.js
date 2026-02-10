import CrmLead from "./model.js";
import { logAudit } from "../../core/utils/auditLogger.js";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";

// POST /api/leads
export const createLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone, email, company, source, stage, expectedRevenue, assignedTo } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, { status: 400, message: "Lead name is required" });
    }

    const lead = new CrmLead({
      name,
      phone: phone || "",
      email: email || "",
      company: company || "",
      source: source || "other",
      stage: stage || "new",
      expectedRevenue: expectedRevenue || 0,
      assignedTo: assignedTo || null,
      userId,
      orgId: req.orgId,
    });

    await lead.save();

    logAudit(
      { action: "create", module: "leads", targetId: lead._id, targetName: lead.name, description: `Created lead: ${lead.name}` },
      req
    );

    return sendCreated(res, lead, "Lead created");
  } catch (error) {
    console.error("createLead error:", error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

// GET /api/leads
export const getLeads = async (req, res) => {
  try {
    const userId = req.userId;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const { stage, search } = req.query;

    const filter = { ...ownerFilter };

    if (stage) filter.stage = stage;

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
    }

    const leads = await CrmLead.find(filter).sort({ createdAt: -1 });

    return sendSuccess(res, { data: leads, message: "Leads fetched" });
  } catch (error) {
    console.error("getLeads error:", error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

// GET /api/leads/:id
export const getLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const lead = await CrmLead.findOne({ _id: id, ...ownerFilter });

    if (!lead) {
      return sendError(res, { status: 404, message: "Lead not found" });
    }

    return sendSuccess(res, { data: lead, message: "Lead fetched" });
  } catch (error) {
    console.error("getLead error:", error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

// PUT /api/leads/:id
export const updateLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const lead = await CrmLead.findOne({ _id: id, ...ownerFilter });

    if (!lead) {
      return sendError(res, { status: 404, message: "Lead not found" });
    }

    const allowed = ["name", "phone", "email", "company", "source", "stage", "expectedRevenue", "assignedTo"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        lead[key] = req.body[key];
      }
    }

    await lead.save();

    logAudit(
      { action: "update", module: "leads", targetId: lead._id, targetName: lead.name, description: `Updated lead: ${lead.name}` },
      req
    );

    return sendSuccess(res, { data: lead, message: "Lead updated" });
  } catch (error) {
    console.error("updateLead error:", error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

// PATCH /api/leads/:id/stage
export const updateStage = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { stage } = req.body;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const validStages = ["new", "qualified", "proposal", "won", "lost"];
    if (!stage || !validStages.includes(stage)) {
      return sendError(res, { status: 400, message: `Invalid stage. Must be one of: ${validStages.join(", ")}` });
    }

    const lead = await CrmLead.findOne({ _id: id, ...ownerFilter });

    if (!lead) {
      return sendError(res, { status: 404, message: "Lead not found" });
    }

    const prevStage = lead.stage;
    lead.stage = stage;
    await lead.save();

    logAudit(
      { action: "stage_change", module: "leads", targetId: lead._id, targetName: lead.name, description: `Moved lead "${lead.name}" from ${prevStage} to ${stage}` },
      req
    );

    return sendSuccess(res, { data: lead, message: `Stage updated to ${stage}` });
  } catch (error) {
    console.error("updateStage error:", error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

// POST /api/leads/:id/notes
export const addNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { text } = req.body;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    if (!text || !text.trim()) {
      return sendError(res, { status: 400, message: "Note text is required" });
    }

    const lead = await CrmLead.findOne({ _id: id, ...ownerFilter });

    if (!lead) {
      return sendError(res, { status: 404, message: "Lead not found" });
    }

    lead.notes.push({ text, userId });
    await lead.save();

    logAudit(
      { action: "update", module: "leads", targetId: lead._id, targetName: lead.name, description: `Added note to lead: ${lead.name}` },
      req
    );

    return sendCreated(res, lead, "Note added");
  } catch (error) {
    console.error("addNote error:", error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

// DELETE /api/leads/:id
export const deleteLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const lead = await CrmLead.findOneAndDelete({ _id: id, ...ownerFilter });

    if (!lead) {
      return sendError(res, { status: 404, message: "Lead not found" });
    }

    logAudit(
      { action: "delete", module: "leads", targetId: lead._id, targetName: lead.name, description: `Deleted lead: ${lead.name}` },
      req
    );

    return sendSuccess(res, { message: "Lead deleted" });
  } catch (error) {
    console.error("deleteLead error:", error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};
