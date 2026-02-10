import AuditLogModel from "../models/AuditLog.js";

export const getAuditLogs = async (req, res) => {
  try {
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId: req.userId };
    const { module, action, page = 1, limit = 50 } = req.query;

    const filter = { ...ownerFilter };
    if (module) filter.module = module;
    if (action) filter.action = action;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLogModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
