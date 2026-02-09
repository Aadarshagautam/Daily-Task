import Lead from "./model.js";
import Customer from "../customers/model.js";

export const getLeads = async (req, res) => {
  try {
    const userId = req.userId;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const { stage, priority, source } = req.query;

    const filter = { ...ownerFilter };
    if (stage) filter.stage = stage;
    if (priority) filter.priority = priority;
    if (source) filter.source = source;

    const leads = await Lead.find(filter).sort({ stage: 1, stageOrder: 1, createdAt: -1 });
    res.json(leads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const lead = await Lead.findOne({ _id: id, ...ownerFilter });
    if (!lead) {
      return res.json({ success: false, message: "Lead not found" });
    }
    res.json({ success: true, lead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email, phone, company, stage, expectedRevenue, probability, source, priority, tags, notes, nextFollowUp } = req.body;

    if (!name) {
      return res.json({ success: false, message: "Lead name is required" });
    }

    // Get max stageOrder for the target stage
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const lastLead = await Lead.findOne({ ...ownerFilter, stage: stage || "new" }).sort({ stageOrder: -1 });
    const stageOrder = lastLead ? lastLead.stageOrder + 1 : 0;

    const lead = new Lead({
      name, email, phone, company,
      stage: stage || "new",
      stageOrder,
      expectedRevenue: expectedRevenue || 0,
      probability: probability || 10,
      source: source || "other",
      priority: priority || "medium",
      tags: tags || [],
      notes: notes || "",
      nextFollowUp: nextFollowUp || null,
      userId,
      orgId: req.orgId,
    });

    await lead.save();
    res.json({ success: true, lead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const updates = req.body;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const lead = await Lead.findOne({ _id: id, ...ownerFilter });
    if (!lead) {
      return res.json({ success: false, message: "Lead not found" });
    }

    Object.assign(lead, updates);
    await lead.save();
    res.json({ success: true, lead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const lead = await Lead.findOneAndDelete({ _id: id, ...ownerFilter });
    if (!lead) {
      return res.json({ success: false, message: "Lead not found" });
    }

    res.json({ success: true, message: "Lead deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const moveLeadStage = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { stage } = req.body;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const validStages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
    if (!validStages.includes(stage)) {
      return res.json({ success: false, message: "Invalid stage" });
    }

    const lead = await Lead.findOne({ _id: id, ...ownerFilter });
    if (!lead) {
      return res.json({ success: false, message: "Lead not found" });
    }

    // Get max order in target stage
    const lastInStage = await Lead.findOne({ ...ownerFilter, stage }).sort({ stageOrder: -1 });
    lead.stage = stage;
    lead.stageOrder = lastInStage ? lastInStage.stageOrder + 1 : 0;

    // Auto-update probability based on stage
    const stageProbabilities = { new: 10, contacted: 20, qualified: 40, proposal: 60, negotiation: 80, won: 100, lost: 0 };
    lead.probability = stageProbabilities[stage];

    await lead.save();
    res.json({ success: true, lead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const convertToCustomer = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const lead = await Lead.findOne({ _id: id, ...ownerFilter });
    if (!lead) {
      return res.json({ success: false, message: "Lead not found" });
    }

    if (lead.customerId) {
      return res.json({ success: false, message: "Lead already converted to customer" });
    }

    // Create customer from lead
    const customer = new Customer({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      notes: lead.notes,
      userId,
      orgId: req.orgId,
    });
    await customer.save();

    // Update lead
    lead.customerId = customer._id;
    lead.stage = "won";
    lead.probability = 100;
    await lead.save();

    res.json({ success: true, lead, customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getLeadStats = async (req, res) => {
  try {
    const userId = req.userId;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const leads = await Lead.find(ownerFilter);

    const stats = {
      total: leads.length,
      byStage: {},
      totalExpectedRevenue: 0,
      weightedRevenue: 0,
    };

    const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
    stages.forEach(s => { stats.byStage[s] = { count: 0, revenue: 0 }; });

    leads.forEach(lead => {
      stats.byStage[lead.stage].count++;
      stats.byStage[lead.stage].revenue += lead.expectedRevenue;
      stats.totalExpectedRevenue += lead.expectedRevenue;
      stats.weightedRevenue += lead.expectedRevenue * (lead.probability / 100);
    });

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
