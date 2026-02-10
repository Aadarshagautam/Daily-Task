import AuditLogModel from "../models/AuditLog.js";

/**
 * Log an audit event. Fire-and-forget — never throws.
 *
 * @param {Object} opts
 * @param {string} opts.action    - create | update | delete | login | logout | etc.
 * @param {string} opts.module    - notes | todos | accounting | inventory | crm | invoices | customers | auth | settings
 * @param {string} [opts.description]
 * @param {string} [opts.targetId]
 * @param {string} [opts.targetName]
 * @param {Object} [opts.changes] - { field: { old, new } }
 * @param {Object} req            - Express req (must have userId, orgId)
 */
export const logAudit = (opts, req) => {
  try {
    AuditLogModel.create({
      action: opts.action,
      module: opts.module,
      description: opts.description || "",
      targetId: opts.targetId || null,
      targetName: opts.targetName || "",
      changes: opts.changes || null,
      userId: req.userId,
      userName: req.userName || "",
      orgId: req.orgId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || "",
    }).catch(() => {});
  } catch (e) {
    // audit must never break app
  }
};
