import CrmLead from "./model.js";
import { logAudit } from "../../core/utils/auditLogger.js";

// POST /api/leads
export const createLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone, email, company, source, stage, expectedRevenue, assignedTo } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Lead name is required", data: null });
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

    res.status(201).json({ success: true, message: "Lead created", data: lead });
  } catch (error) {
    console.error("createLead error:", error);
    res.status(500).json({ success: false, message: "Server error", data: null });
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

    res.json({ success: true, message: "Leads fetched", data: leads });
  } catch (error) {
    console.error("getLeads error:", error);
    res.status(500).json({ success: false, message: "Server error", data: null });
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
      return res.status(404).json({ success: false, message: "Lead not found", data: null });
    }

    res.json({ success: true, message: "Lead fetched", data: lead });
  } catch (error) {
    console.error("getLead error:", error);
    res.status(500).json({ success: false, message: "Server error", data: null });
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
      return res.status(404).json({ success: false, message: "Lead not found", data: null });
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

    res.json({ success: true, message: "Lead updated", data: lead });
  } catch (error) {
    console.error("updateLead error:", error);
    res.status(500).json({ success: false, message: "Server error", data: null });
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
      return res.status(400).json({ success: false, message: `Invalid stage. Must be one of: ${validStages.join(", ")}`, data: null });
    }

    const lead = await CrmLead.findOne({ _id: id, ...ownerFilter });

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found", data: null });
    }

    const prevStage = lead.stage;
    lead.stage = stage;
    await lead.save();

    logAudit(
      { action: "stage_change", module: "leads", targetId: lead._id, targetName: lead.name, description: `Moved lead "${lead.name}" from ${prevStage} to ${stage}` },
      req
    );

    res.json({ success: true, message: `Stage updated to ${stage}`, data: lead });
  } catch (error) {
    console.error("updateStage error:", error);
    res.status(500).json({ success: false, message: "Server error", data: null });
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
      return res.status(400).json({ success: false, message: "Note text is required", data: null });
    }

    const lead = await CrmLead.findOne({ _id: id, ...ownerFilter });

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found", data: null });
    }

    lead.notes.push({ text, userId });
    await lead.save();

    logAudit(
      { action: "update", module: "leads", targetId: lead._id, targetName: lead.name, description: `Added note to lead: ${lead.name}` },
      req
    );

    res.status(201).json({ success: true, message: "Note added", data: lead });
  } catch (error) {
    console.error("addNote error:", error);
    res.status(500).json({ success: false, message: "Server error", data: null });
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
      return res.status(404).json({ success: false, message: "Lead not found", data: null });
    }

    logAudit(
      { action: "delete", module: "leads", targetId: lead._id, targetName: lead.name, description: `Deleted lead: ${lead.name}` },
      req
    );

    res.json({ success: true, message: "Lead deleted", data: null });
  } catch (error) {
    console.error("deleteLead error:", error);
    res.status(500).json({ success: false, message: "Server error", data: null });
  }
};
