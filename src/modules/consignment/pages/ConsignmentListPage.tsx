import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ResourceListPage } from "@/modules/common/ResourceListPage";
import { ConsignmentDialog } from "../components/ConsignmentDialog";
import {
  useConsignments,
  useDeleteConsignment,
  useUpdateConsignmentStatus,
} from "../hooks/useConsignments";
import { useParties } from "@/modules/party/hooks/useParties";
import { toast } from "@/shared/lib/toast";
import { getApiErrorMessage } from "@/shared/api/http";
import {
  PAYMENT_MODES,
  PAYMENT_STATUSES,
  PAYMENT_MODE_COLORS,
  PAYMENT_STATUS_COLORS,
  CONSIGNMENT_TYPES,
  DELIVERY_STATUSES,
  DELIVERY_STATUS_COLORS,
  PAYMENT_RECEIVERS,
  BOOKING_CLASSES,
} from "../constants/consignment.constants";
import { CONSIGNMENT_MASTER_QUERIES } from "../constants/consignment.queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { partyName } from "@/shared/lib/partyDisplay";
import type { Consignment, ConsignmentListQuery } from "../types";

export function ConsignmentListPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    party: searchParams.get("party") ?? "",
    paymentMode: "",
    paymentStatus: "",
    type: "",
    deliveryStatus: "",
    paymentReceiver: "",
    bookingClass: "",
    startDate: "",
    endDate: "",
  });

  const partiesRes = useParties(CONSIGNMENT_MASTER_QUERIES.parties);
  const parties = partiesRes.data?.items ?? [];

  const statusMutation = useUpdateConsignmentStatus();
  async function changeStatus(id: string, deliveryStatus: string) {
    try {
      await statusMutation.mutateAsync({ id, deliveryStatus });
      toast.success("Order status updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const inputCls =
    "rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition w-full";
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <ResourceListPage<Consignment, ConsignmentListQuery>
      title="Consignments"
      subtitle="Daily railway parcel entries"
      newButtonText="New Consignment"
      minTableWidth="min-w-[1600px]"
      emptyText="No consignments found."
      deleteConfirmText="Delete this consignment permanently?"
      useList={useConsignments}
      useDelete={useDeleteConsignment}
      buildQuery={({ search, page, limit }) => ({
        search: search || undefined,
        party: filters.party || undefined,
        paymentMode: filters.paymentMode || undefined,
        paymentStatus: filters.paymentStatus || undefined,
        type: filters.type || undefined,
        deliveryStatus: filters.deliveryStatus || undefined,
        paymentReceiver: filters.paymentReceiver || undefined,
        bookingClass: filters.bookingClass || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page,
        limit,
        sortBy: "date",
        sortDir: "desc" as const,
      })}
      renderFilters={({ search, setSearch }) => (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="RR number, station, contents..."
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Party</label>
              <select
                value={filters.party}
                onChange={(e) => setFilters((f) => ({ ...f, party: e.target.value }))}
                className={selectCls}
              >
                <option value="">All parties</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Payment Mode
              </label>
              <select
                value={filters.paymentMode}
                onChange={(e) => setFilters((f) => ({ ...f, paymentMode: e.target.value }))}
                className={selectCls}
              >
                <option value="">All modes</option>
                {PAYMENT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                className={selectCls}
              >
                <option value="">All types</option>
                {CONSIGNMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Order Status
              </label>
              <select
                value={filters.deliveryStatus}
                onChange={(e) => setFilters((f) => ({ ...f, deliveryStatus: e.target.value }))}
                className={selectCls}
              >
                <option value="">All statuses</option>
                {DELIVERY_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Payment Receiver
              </label>
              <select
                value={filters.paymentReceiver}
                onChange={(e) => setFilters((f) => ({ ...f, paymentReceiver: e.target.value }))}
                className={selectCls}
              >
                <option value="">All receivers</option>
                {PAYMENT_RECEIVERS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Lease / Booking
              </label>
              <select
                value={filters.bookingClass}
                onChange={(e) => setFilters((f) => ({ ...f, bookingClass: e.target.value }))}
                className={selectCls}
              >
                <option value="">All</option>
                {BOOKING_CLASSES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}
      columns={[
        { header: "Date", getValue: (c) => formatDate(c.date) },
        {
          header: "Party",
          getValue: (c) => <span className="font-medium">{partyName(c.party)}</span>,
        },
        {
          header: "Destination",
          getValue: (c) => (
            <span className="font-mono font-semibold text-primary">{c.destinationStation}</span>
          ),
        },
        { header: "Pkgs", getValue: (c) => c.packages },
        { header: "Wt (kg)", getValue: (c) => c.chargeableWeight },
        {
          header: "RR No.",
          getValue: (c) =>
            c.railwayReceiptNumber ? (
              <span className="font-mono text-xs">{c.railwayReceiptNumber}</span>
            ) : (
              "-"
            ),
        },
        {
          header: "Mode",
          getValue: (c) => (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_MODE_COLORS[c.paymentMode] ?? ""}`}
            >
              {PAYMENT_MODES.find((m) => m.value === c.paymentMode)?.label ?? c.paymentMode}
            </span>
          ),
        },
        {
          header: "Status",
          getValue: (c) => (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[c.paymentStatus] ?? ""}`}
            >
              {c.paymentStatus}
            </span>
          ),
        },
        {
          header: "Type",
          getValue: (c) => (
            <span className="text-xs">
              {CONSIGNMENT_TYPES.find((t) => t.value === c.type)?.label ?? c.type}
            </span>
          ),
        },
        {
          header: "Order Status",
          getValue: (c) => (
            <select
              value={c.deliveryStatus}
              onChange={(e) => changeStatus(c.id, e.target.value)}
              disabled={statusMutation.isPending}
              onClick={(e) => e.stopPropagation()}
              className={`cursor-pointer rounded-full border-0 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
                DELIVERY_STATUS_COLORS[c.deliveryStatus] ?? ""
              }`}
            >
              {DELIVERY_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          ),
        },
        {
          header: "Receiver",
          getValue: (c) => c.paymentReceiver ?? "—",
        },
        {
          header: "Class",
          getValue: (c) => (
            <div className="flex gap-1">
              {c.isLease && (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                  Lease
                </span>
              )}
              {c.isBooking && (
                <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400">
                  Booking
                </span>
              )}
              {!c.isLease && !c.isBooking && <span className="text-muted-foreground">—</span>}
            </div>
          ),
        },
        {
          header: "Total (₹)",
          getValue: (c) => <span className="font-semibold">{formatCurrency(c.totalAmount)}</span>,
        },
        {
          header: "Paid (₹)",
          getValue: (c) => (
            <span className="text-muted-foreground">{formatCurrency(c.amountPaid ?? 0)}</span>
          ),
        },
        {
          header: "Balance (₹)",
          getValue: (c) => {
            const due = c.balanceDue ?? c.totalAmount - (c.amountPaid ?? 0);
            return (
              <span
                className={
                  due > 0 ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground"
                }
                title={due > 0 ? "Amount still to be collected for this parcel" : "Fully collected"}
              >
                {formatCurrency(due)}
              </span>
            );
          },
        },
      ]}
      renderDialog={({ open, onOpenChange, mode, value, onSuccess }) => (
        <ConsignmentDialog
          open={open}
          onOpenChange={onOpenChange}
          mode={mode}
          value={value}
          onSuccess={onSuccess}
          parties={parties}
        />
      )}
    />
  );
}
