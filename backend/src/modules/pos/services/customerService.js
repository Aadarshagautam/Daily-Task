import PosCustomer from "../models/Customer.js";

const ownerFilter = (req) =>
  req.orgId ? { orgId: req.orgId } : { userId: req.userId };

export const customerService = {
  async create(data, req) {
    const customer = new PosCustomer({
      ...data,
      userId: req.userId,
      orgId: req.orgId || null,
    });
    return customer.save();
  },

  async list(req) {
    const filter = { ...ownerFilter(req) };
    const { search } = req.query;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    return PosCustomer.find(filter).sort({ createdAt: -1 });
  },

  async getById(id, req) {
    return PosCustomer.findOne({ _id: id, ...ownerFilter(req) });
  },

  async update(id, data, req) {
    return PosCustomer.findOneAndUpdate(
      { _id: id, ...ownerFilter(req) },
      { $set: data },
      { new: true, runValidators: true }
    );
  },

  async delete(id, req) {
    return PosCustomer.findOneAndDelete({ _id: id, ...ownerFilter(req) });
  },

  async adjustCredit(id, amount, req) {
    return PosCustomer.findOneAndUpdate(
      { _id: id, ...ownerFilter(req) },
      { $inc: { creditBalance: amount } },
      { new: true }
    );
  },
};
