import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { thirdPartyReportApi } from "@/services/api/thirdPartyReportApi";
import { paymentApi } from "@/services/api/paymentApi";
import { openRazorpayCheckout } from "@/utils/razorpay";
import { downloadBlob } from "@/utils/downloadBlob";
import { useThirdPartyLabStore } from "@/store/thirdPartyLabStore";
import { useAuth } from "@/hooks/useAuth";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { ThirdPartyReportItem } from "@/types";

export const THIRD_PARTY_REPORTS_QUERY_KEY = ["third-party-reports"];

export function useSendThirdPartyOtp() {
  return useMutation({
    mutationFn: (mobileNumber: string) => thirdPartyReportApi.sendOtp(mobileNumber),
    onError: (error) =>
      toast.error(error instanceof ApiRequestError ? error.message : "Could not send OTP"),
  });
}

export function useVerifyThirdPartyOtp() {
  const setLinked = useThirdPartyLabStore((s) => s.setLinked);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mobileNumber, otp }: { mobileNumber: string; otp: string }) =>
      thirdPartyReportApi.verifyOtp(mobileNumber, otp),
    onSuccess: (result, { mobileNumber }) => {
      setLinked(result.userFID, mobileNumber);
      queryClient.invalidateQueries({ queryKey: THIRD_PARTY_REPORTS_QUERY_KEY });
    },
    onError: (error) =>
      toast.error(error instanceof ApiRequestError ? error.message : "Incorrect OTP"),
  });
}

export function useThirdPartyReports() {
  const userFID = useThirdPartyLabStore((s) => s.userFID);

  return useQuery({
    queryKey: [...THIRD_PARTY_REPORTS_QUERY_KEY, userFID],
    queryFn: () => thirdPartyReportApi.fetchReports(userFID as string),
    enabled: !!userFID,
  });
}

/** Fetches the PDF through our own authenticated API (`responseType: "blob"`,
 *  so the Bearer header actually goes along) and saves it — never a direct
 *  link to the lab partner's host (see `thirdPartyReportApi.downloadReport`'s
 *  doc comment for why that never worked). */
export function useDownloadThirdPartyReport() {
  const userFID = useThirdPartyLabStore((s) => s.userFID);

  return useMutation({
    mutationFn: async (report: ThirdPartyReportItem) => {
      if (!userFID) {
        throw new Error("Link your lab account first");
      }
      const blob = await thirdPartyReportApi.downloadReport(userFID, report.testRegnId);
      downloadBlob(blob, `report-${report.testRegnId}.pdf`);
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Could not download this report",
      ),
  });
}

/** Pays off a report's BalanceAmt via the real Razorpay checkout, then the
 *  fast-path verify call — the backend's finalize step pushes the payment
 *  status to the lab partner automatically, so nothing else is needed here
 *  beyond refetching the list. */
export function usePayThirdPartyBalance() {
  const queryClient = useQueryClient();
  const userFID = useThirdPartyLabStore((s) => s.userFID);
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (report: ThirdPartyReportItem) => {
      if (!userFID) {
        throw new Error("Link your lab account first");
      }

      const order = await paymentApi.createOrder(
        {
          purpose: "third_party_lab_balance",
          reference_id: String(report.testRegnId),
          third_party_user_fid: userFID,
        },
        report.balanceAmt,
      );

      const razorpayResponse = await openRazorpayCheckout(order, {
        description: `Report payment · ${report.labCode}`,
        prefill: { name: user?.name ?? undefined, contact: user?.mobile },
      });

      const verifyResult = await paymentApi.verify({
        payment_id: order.payment_id,
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
      });

      if (verifyResult.status !== "success") {
        throw new Error("Payment could not be verified. Please try again.");
      }
    },
    onSuccess: () => {
      toast.success("Payment successful — your report is unlocked.");
      queryClient.invalidateQueries({ queryKey: THIRD_PARTY_REPORTS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Payment failed");
    },
  });
}
