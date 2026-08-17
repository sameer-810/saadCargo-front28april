import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createResourceHooks } from "@/modules/common/createResourceHooks";
import {
  listConsignments,
  createConsignment,
  updateConsignment,
  deleteConsignment,
  updateConsignmentStatus,
} from "../api/consignmentApi";
import type {
  ConsignmentListQuery,
  ConsignmentCreatePayload,
  ConsignmentListResult,
} from "../types";

const crud = createResourceHooks<
  ConsignmentListQuery,
  ConsignmentCreatePayload,
  ConsignmentListResult
>("consignments", {
  list: listConsignments,
  create: createConsignment,
  update: updateConsignment,
  remove: deleteConsignment,
});

export const useConsignments = crud.useList;
export const useCreateConsignment = crud.useCreate;
export const useUpdateConsignment = crud.useUpdate;
export const useDeleteConsignment = crud.useDelete;

/** Updates a consignment's delivery status and refreshes the list. */
export function useUpdateConsignmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deliveryStatus }: { id: string; deliveryStatus: string }) =>
      updateConsignmentStatus(id, deliveryStatus),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consignments"] }),
  });
}
