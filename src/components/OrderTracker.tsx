import React, { useState } from "react";
import { Package, Truck, CheckCircle2, Download, AlertCircle, FileText, ArrowRight, CornerDownRight } from "lucide-react";
import { motion } from "motion/react";
import { Order } from "../types";

interface OrderTrackerProps {
  order: Order;
  onReturnOrder: (orderId: string) => void;
  onBackToShopping: () => void;
}

export default function OrderTracker({ order, onReturnOrder, onBackToShopping }: OrderTrackerProps) {
  const [activeOrder, setActiveOrder] = useState<Order>(order);
  const [isSimulating, setIsSimulating] = useState(false);

  // Helper to advance shipping states in-memory for delightful interaction
  const advanceSimulatedTransit = async () => {
    setIsSimulating(true);
    
    // Find current uncompleted step
    const nextStepIdx = activeOrder.trackingSteps.findIndex(step => !step.completed);
    if (nextStepIdx === -1) {
      setIsSimulating(false);
      return; // already fully delivered
    }

    let nextStatus = "pending";
    if (nextStepIdx === 1) nextStatus = "processing";
    if (nextStepIdx === 2) nextStatus = "shipped";
    if (nextStepIdx === 3) nextStatus = "delivered";

    try {
      const res = await fetch(`/api/orders/${activeOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          currentStepIndex: nextStepIdx,
          paymentStatus: nextStatus === "delivered" ? "paid" : activeOrder.paymentStatus
        })
      });
      const updated = await res.json();
      if (res.ok) {
        setActiveOrder(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDownloadInvoice = () => {
    // Generate a virtual printable txt invoice block representing purchase orders
    const element = document.createElement("a");
    const file = new Blob([
      `===============================================\n` +
      `               VISION ELECTRONICS              \n` +
      `               INVOICE OF PURCHASE             \n` +
      `===============================================\n` +
      `Invoice ID: INV-${activeOrder.id.toUpperCase()}\n` +
      `Date: ${new Date(activeOrder.createdAt).toLocaleDateString()}\n` +
      `Payment Channel: ${activeOrder.paymentMethod.toUpperCase()}\n` +
      `Settlement: ${activeOrder.paymentStatus.toUpperCase()}\n\n` +
      `Delivered To:\n` +
      `  ${activeOrder.shippingAddress.fullName}\n` +
      `  ${activeOrder.shippingAddress.street}\n` +
      `  ${activeOrder.shippingAddress.city}, ${activeOrder.shippingAddress.state} - ${activeOrder.shippingAddress.zipCode}\n` +
      `  Contact: ${activeOrder.shippingAddress.phone}\n\n` +
      `Purchased Items:\n` +
      activeOrder.items.map(item => `  - ${item.product.name} (Qty ${item.quantity}) @ ₹${item.product.price}`).join("\n") +
      `\n\n` +
      `Subtotal: ₹${activeOrder.subtotal}\n` +
      `Promo Deductions: -₹${activeOrder.couponDiscount}\n` +
      `Shipping Fees: ₹${activeOrder.shippingFee}\n` +
      `-----------------------------------------------\n` +
      `GRAND TOTAL: ₹${activeOrder.total}\n` +
      `===============================================\n` +
      `Thank you for choosing Vision! Keep this invoice for physical returns.\n`
    ], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Vision_Invoice_${activeOrder.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleReturn = async () => {
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}/return`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setActiveOrder(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 text-neutral-850">
      
      {/* Top Details panel */}
      <div className="bg-white rounded-3xl border border-neutral-150 p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
            Order #{activeOrder.id}
          </span>
          <h2 className="text-xl font-black text-neutral-900 tracking-tight">Your Hardware is in Flight!</h2>
          <p className="text-xs text-neutral-450 mt-1">Placed on {new Date(activeOrder.createdAt).toLocaleString()}</p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDownloadInvoice}
            className="px-3.5 py-2.5 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Download size={14} />
            <span>Invoice TXT</span>
          </button>

          <button
            onClick={onBackToShopping}
            className="px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all"
          >
            Keep Shopping
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Step-by-step progress list */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-neutral-150 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-black text-neutral-800">Transit Milestones</h3>
            
            {/* Interactive transit simulator action */}
            {activeOrder.status !== "delivered" && activeOrder.status !== "returned" && (
              <button
                onClick={advanceSimulatedTransit}
                disabled={isSimulating}
                className="text-[10px] bg-brand-50 hover:bg-brand-100 text-brand-700 font-extrabold px-2.5 py-1 rounded-lg border border-brand-100 transition-all flex items-center gap-1"
              >
                <span>{isSimulating ? "Packing..." : "Simulate Next Stage"}</span>
                <ArrowRight size={10} />
              </button>
            )}
          </div>

          <div className="relative pl-6 space-y-6">
            {/* Draw linear connection bar */}
            <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-neutral-150" />

            {activeOrder.trackingSteps.map((step, idx) => (
              <div key={idx} className="relative flex gap-3 text-xs">
                {/* Visual state bullet */}
                <div className={`absolute -left-[22px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 ${
                  step.completed 
                    ? "bg-brand-500 border-brand-500 text-white" 
                    : "bg-white border-neutral-200 text-neutral-400"
                }`}>
                  {step.completed && <CheckCircle2 size={10} className="fill-brand-500 text-white" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className={step.completed ? "text-neutral-900" : "text-neutral-450"}>{step.status}</span>
                    <span className="text-[10px] text-neutral-400 font-mono font-medium">{step.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed font-normal">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Return items form if order is fully delivered */}
          {activeOrder.status === "delivered" && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-neutral-800">Need to initiate return?</h4>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Vision provides a zero-questions-asked 7-day refund guarantee.</p>
                </div>
              </div>
              <button
                onClick={handleReturn}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg transition-colors text-[11px]"
              >
                Return Order
              </button>
            </div>
          )}

          {activeOrder.status === "returned" && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700">
              <h4 className="font-bold">✓ Return settled</h4>
              <p className="text-[10px] text-red-600 mt-0.5">The purchase values have been fully reversed. Check your credit balance in 3-5 days.</p>
            </div>
          )}
        </div>

        {/* Right column: Delivery details summary */}
        <div className="space-y-4 text-xs font-medium">
          <div className="bg-white rounded-3xl border border-neutral-150 p-5 shadow-sm">
            <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider mb-3">Delivery Destination</h4>
            <div className="space-y-1 text-neutral-700 font-semibold leading-relaxed">
              <p className="text-neutral-950 font-bold">{activeOrder.shippingAddress.fullName}</p>
              <p className="font-normal text-[11px]">{activeOrder.shippingAddress.street}</p>
              <p className="font-normal text-[11px]">{activeOrder.shippingAddress.city}, {activeOrder.shippingAddress.state} - {activeOrder.shippingAddress.zipCode}</p>
              <p className="text-[10px] text-neutral-400 mt-1 font-mono">Mobile: {activeOrder.shippingAddress.phone}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-neutral-150 p-5 shadow-sm">
            <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider mb-3">Package Items</h4>
            <div className="space-y-3">
              {activeOrder.items.map((item, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="w-10 h-10 bg-neutral-50 border border-neutral-100 rounded-lg overflow-hidden shrink-0">
                    <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-neutral-800 truncate leading-snug">{item.product.name}</h5>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Qty {item.quantity} {item.selectedColor ? `| ${item.selectedColor}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
