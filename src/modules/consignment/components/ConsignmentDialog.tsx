import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/modules/common/FormDialog";
import {
  consignmentSchema,
  type ConsignmentFormValues,
} from "../validations/consignment.validation";
import { useCreateConsignment, useUpdateConsignment } from "../hooks/useConsignments";
import { CONSIGNMENT_TYPES, PAYMENT_MODES } from "../constants/consignment.constants";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { partyId as toPartyId } from "@/shared/lib/partyDisplay";
import type { Consignment } from "../types";
import type { Party } from "@/modules/party/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  value: Consignment | null;
  onSuccess: () => void;
  parties: Party[];
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition";
const selectCls = `${inputCls} cursor-pointer`;

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function toDateInput(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  return new Date(dateStr).toISOString().split("T")[0];
}

export function ConsignmentDialog({ open, onOpenChange, mode, value, onSuccess, parties }: Props) {
  const createMutation = useCreateConsignment();
  const updateMutation = useUpdateConsignment();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ConsignmentFormValues>({
    resolver: zodResolver(consignmentSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      party: "",
      packages: 1,
      chargeableWeight: 0,
      originStation: "MUM",
      destinationStation: "",
      type: "railway_booking",
      freightAmount: 0,
      reimbursementAmount: 0,
      hamaliCharges: 0,
      otherCharges: 0,
      paymentMode: "paid_source",
      directPaid: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && value) {
        form.reset({
          date: toDateInput(value.date),
          party: toPartyId(value.party),
          packages: value.packages,
          actualWeight: value.actualWeight,
          chargeableWeight: value.chargeableWeight,
          contents: value.contents ?? "",
          originStation: value.originStation,
          destinationStation: value.destinationStation,
          type: value.type,
          agentName: value.agentName ?? "",
          trainNumber: value.trainNumber ?? "",
          bogieNumber: value.bogieNumber ?? "",
          railwayReceiptNumber: value.railwayReceiptNumber ?? "",
          freightAmount: value.freightAmount,
          reimbursementAmount: value.reimbursementAmount,
          hamaliCharges: value.hamaliCharges,
          otherCharges: value.otherCharges,
          paymentMode: value.paymentMode,
          directPaid: value.directPaid ?? 0,
          notes: value.notes ?? "",
        });
      } else {
        form.reset({
          date: new Date().toISOString().split("T")[0],
          party: "",
          packages: 1,
          chargeableWeight: 0,
          originStation: "MUM",
          destinationStation: "",
          type: "railway_booking",
          freightAmount: 0,
          reimbursementAmount: 0,
          hamaliCharges: 0,
          otherCharges: 0,
          paymentMode: "paid_source",
          directPaid: 0,
        });
      }
    }
  }, [open, mode, value, form]);

  const { errors } = form.formState;

  // Live payment status, derived from the charges + amount paid the owner types.
  const [wFreight, wReimb, wHamali, wOther, wPaid] = form.watch([
    "freightAmount",
    "reimbursementAmount",
    "hamaliCharges",
    "otherCharges",
    "directPaid",
  ]);
  const total =
    (Number(wFreight) || 0) +
    (Number(wReimb) || 0) +
    (Number(wHamali) || 0) +
    (Number(wOther) || 0);
  const paid = Number(wPaid) || 0;
  const balance = Math.round((total - paid) * 100) / 100;
  const payState = paid <= 0 ? "Unpaid" : paid < total ? "Balance" : "Paid";
  const payStateCls =
    payState === "Paid"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : payState === "Balance"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";

  async function onSubmit(data: ConsignmentFormValues) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
      } else if (value) {
        await updateMutation.mutateAsync({ id: value.id, payload: data });
      }
      toast.success(mode === "create" ? "Consignment created" : "Consignment updated");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "New Consignment" : "Edit Consignment"}
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={isPending}
      submitLabel={mode === "create" ? "Create" : "Save"}
      size="xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Field label="Date" required error={errors.date?.message}>
          <input type="date" className={inputCls} {...form.register("date")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Party" required error={errors.party?.message}>
            <select className={selectCls} {...form.register("party")}>
              <option value="">Select party...</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Packages" required error={errors.packages?.message}>
          <input type="number" min={1} className={inputCls} {...form.register("packages")} />
        </Field>
        <Field label="Actual Weight (kg)" error={errors.actualWeight?.message}>
          <input
            type="number"
            step="0.01"
            min={0}
            className={inputCls}
            {...form.register("actualWeight")}
          />
        </Field>
        <Field label="Chargeable Weight (kg)" error={errors.chargeableWeight?.message}>
          <input
            type="number"
            step="0.01"
            min={0}
            className={inputCls}
            {...form.register("chargeableWeight")}
          />
        </Field>

        <Field label="Origin Station" error={errors.originStation?.message}>
          <input className={inputCls} placeholder="MUM" {...form.register("originStation")} />
        </Field>
        <Field label="Destination Station" required error={errors.destinationStation?.message}>
          <input className={inputCls} placeholder="NDLS" {...form.register("destinationStation")} />
        </Field>
        <Field label="Contents" error={errors.contents?.message}>
          <input
            className={inputCls}
            placeholder="Goods description"
            {...form.register("contents")}
          />
        </Field>

        <Field label="Type" required error={errors.type?.message}>
          <select className={selectCls} {...form.register("type")}>
            {CONSIGNMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment Mode" required error={errors.paymentMode?.message}>
          <select className={selectCls} {...form.register("paymentMode")}>
            {PAYMENT_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Railway Receipt No." error={errors.railwayReceiptNumber?.message}>
          <input
            className={inputCls}
            placeholder="PR/RR number"
            {...form.register("railwayReceiptNumber")}
          />
        </Field>

        <Field label="Train No." required error={errors.trainNumber?.message}>
          <input className={inputCls} {...form.register("trainNumber")} />
        </Field>
        <Field label="Bogie No." error={errors.bogieNumber?.message}>
          <input className={inputCls} {...form.register("bogieNumber")} />
        </Field>
        <Field label="Agent Name" error={errors.agentName?.message}>
          <input className={inputCls} {...form.register("agentName")} />
        </Field>

        <div className="border-t border-border pt-3 sm:col-span-2 md:col-span-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Charges (₹)
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Freight Amount" required error={errors.freightAmount?.message}>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inputCls}
                {...form.register("freightAmount")}
              />
            </Field>
            <Field label="Reimbursement" error={errors.reimbursementAmount?.message}>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inputCls}
                {...form.register("reimbursementAmount")}
              />
            </Field>
            <Field label="Hamali" error={errors.hamaliCharges?.message}>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inputCls}
                {...form.register("hamaliCharges")}
              />
            </Field>
            <Field label="Other" error={errors.otherCharges?.message}>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inputCls}
                {...form.register("otherCharges")}
              />
            </Field>
          </div>
        </div>

        <div className="border-t border-border pt-3 sm:col-span-2 md:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Payment
            </p>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${payStateCls}`}
            >
              {payState}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Amount Paid (₹)" error={errors.directPaid?.message}>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className={inputCls}
                  {...form.register("directPaid")}
                />
                <button
                  type="button"
                  onClick={() => form.setValue("directPaid", 0, { shouldValidate: true })}
                  className="shrink-0 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-accent transition-colors"
                  title="Mark unpaid"
                >
                  Unpaid
                </button>
                <button
                  type="button"
                  onClick={() =>
                    form.setValue("directPaid", Math.round(total * 100) / 100, {
                      shouldValidate: true,
                    })
                  }
                  className="shrink-0 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-accent transition-colors"
                  title="Mark fully paid"
                >
                  Full
                </button>
              </div>
            </Field>
            <Field label="Total (₹)">
              <input
                className={`${inputCls} bg-muted/40`}
                value={total.toFixed(2)}
                readOnly
                tabIndex={-1}
              />
            </Field>
            <Field label="Balance Due (₹)">
              <input
                className={`${inputCls} bg-muted/40 font-semibold ${
                  balance > 0 ? "text-red-600 dark:text-red-400" : ""
                }`}
                value={balance.toFixed(2)}
                readOnly
                tabIndex={-1}
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Amount collected directly for this parcel. Any lump-sum entries in the Payments module
            are added on top of this.
          </p>
        </div>

        <div className="sm:col-span-2 md:col-span-3">
          <Field label="Notes" error={errors.notes?.message}>
            <input className={inputCls} placeholder="Optional notes" {...form.register("notes")} />
          </Field>
        </div>
      </div>
    </FormDialog>
  );
}
