import Customer from "./model.js";

export const getCustomers = async (req, res) => {
  try {
    const userId = req.userId;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const customers = await Customer.find(ownerFilter).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const customer = await Customer.findOne({ _id: id, ...ownerFilter });
    if (!customer) {
      return res.json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email, phone, company, address, gstin, notes } = req.body;

    if (!name) {
      return res.json({ success: false, message: "Customer name is required" });
    }

    const customer = new Customer({
      name, email, phone, company, address, gstin, notes, userId,
      orgId: req.orgId,
    });

    await customer.save();
    res.json({ success: true, customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const updates = req.body;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const customer = await Customer.findOne({ _id: id, ...ownerFilter });
    if (!customer) {
      return res.json({ success: false, message: "Customer not found" });
    }

    Object.assign(customer, updates);
    await customer.save();
    res.json({ success: true, customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };

    const customer = await Customer.findOneAndDelete({ _id: id, ...ownerFilter });
    if (!customer) {
      return res.json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, message: "Customer deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const searchCustomers = async (req, res) => {
  try {
    const userId = req.userId;
    const ownerFilter = req.orgId ? { orgId: req.orgId } : { userId };
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const customers = await Customer.find({
      ...ownerFilter,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
