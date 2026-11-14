import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchPaymentGatewayConfig,
  updatePaymentGatewayConfigApi,
  type PaymentGatewayConfigWriteData,
} from "@/services/api/paymentGatewayConfigApi";

export function usePaymentGatewayConfig() {
  return useQuery({
    queryKey: ["payment-gateway-config"],
    queryFn: fetchPaymentGatewayConfig,
  });
}

export function useUpdatePaymentGatewayConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PaymentGatewayConfigWriteData) => updatePaymentGatewayConfigApi(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-gateway-config"] }),
  });
}
