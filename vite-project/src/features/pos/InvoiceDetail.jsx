import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Printer, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { posSaleApi } from "../../api/posApi";
import PrintableInvoice from "./components/PrintableInvoice";

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pos-sale", id],
    queryFn: () => posSaleApi.get(id),
  });

  const refundMut = useMutation({
    mutationFn: () => posSaleApi.refund(id),
    onSuccess: () => {
      toast.success("Sale refunded");
      queryClient.invalidateQueries({ queryKey: ["pos-sale", id] });
      queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
      queryClient.invalidateQueries({ queryKey: ["pos-stats"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Refund failed"),
  });

  const sale = data?.data;

  if (isLoading) {
    return (
      <div className="p-4 lg:pl-[17.5rem] pt-20 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-4 lg:pl-[17.5rem] pt-20 text-center py-20">
        <p className="text-slate-500">Sale not found</p>
      </div>
    );
  }

  const handleRefund = () => {
    if (window.confirm(`Refund invoice ${sale.invoiceNo}? This will restore stock and mark the sale as refunded.`)) {
      refundMut.mutate();
    }
  };

  return (
    <div className="p-4 lg:pl-[17.5rem] pt-20">
      <div className="max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <button
            onClick={() => navigate("/pos/sales")}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sales
          </button>
          <div className="flex gap-2">
            {sale.status !== "refund" && (
              <button
                onClick={handleRefund}
                disabled={refundMut.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {refundMut.isPending ? "Processing..." : "Refund"}
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        <PrintableInvoice sale={sale} />
      </div>
    </div>
  );
};

export default InvoiceDetail;
