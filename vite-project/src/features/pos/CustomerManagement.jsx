import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit3, Trash2, X, Users } from "lucide-react";
import toast from "react-hot-toast";
import { posCustomerApi } from "../../api/posApi";

const emptyForm = { name: "", phone: "", email: "", address: "" };

const CustomerManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["pos-customers", search],
    queryFn: () => posCustomerApi.list({ search }),
  });

  const customers = data?.data || [];

  const createMut = useMutation({
    mutationFn: (d) => posCustomerApi.create(d),
    onSuccess: () => {
      toast.success("Customer created");
      queryClient.invalidateQueries({ queryKey: ["pos-customers"] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => posCustomerApi.update(id, data),
    onSuccess: () => {
      toast.success("Customer updated");
      queryClient.invalidateQueries({ queryKey: ["pos-customers"] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => posCustomerApi.delete(id),
    onSuccess: () => {
      toast.success("Customer deleted");
      queryClient.invalidateQueries({ queryKey: ["pos-customers"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const openCreate = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (c) => {
    setEditId(c._id);
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "" });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditId(null); setForm(emptyForm); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      updateMut.mutate({ id: editId, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <div className="p-4 lg:pl-[17.5rem] pt-20">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">POS Customers</h1>
            <p className="text-sm text-gray-500">Manage your retail customers</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users className="w-12 h-12 mb-3" />
              <p className="text-sm">No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Address</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Credit</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.phone || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{c.email || "-"}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{c.address || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${c.creditBalance > 0 ? "text-red-600" : "text-gray-600"}`}>
                          Rs. {(c.creditBalance || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-600">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (window.confirm(`Delete "${c.name}"?`)) deleteMut.mutate(c._id); }}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editId ? "Edit Customer" : "Add Customer"}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {createMut.isPending || updateMut.isPending ? "Saving..." : editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
