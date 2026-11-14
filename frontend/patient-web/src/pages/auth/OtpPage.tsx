import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { OtpInput, type OtpStatus } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/services/api/authApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";

const RESEND_SECONDS = 30;

interface OtpLocationState {
  mobile?: string;
  /** Forwarded from `LoginPage` — where to send the patient back to after a
   *  successful verify, if they arrived here via a "please log in" redirect
   *  (`ProtectedRoute` or `useAddToCart`) rather than the login link directly. */
  from?: { pathname: string; search: string };
}

function maskMobile(mobile: string) {
  return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
}

function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();

  const state = (location.state as OtpLocationState | null) ?? null;
  const mobile = state?.mobile;
  const from = state?.from;

  const [otp, setOtp] = useState("");
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [status, setStatus] = useState<OtpStatus>("idle");
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resendCycle, setResendCycle] = useState(0);
  // Where Continue sends the patient — decided once, right when verification
  // succeeds, so the button itself stays a plain navigate with no async work.

  useEffect(() => {
    if (!mobile) {
      navigate("/login", { replace: true });
    }
  }, [mobile, navigate]);

  useEffect(() => {
    setSecondsLeft(RESEND_SECONDS);
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCycle]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (!mobile || code.length !== 6 || status === "verifying" || status === "success") return;
      setStatus("verifying");
      try {
        const result = await authApi.verifyOtp(mobile, code);
        setSession(result.token, {
          id: result.user.id,
          mobile: result.user.mobile,
          name: null,
          isProfileComplete: result.user.is_profile_complete,
        });

        // An incomplete profile always goes through Complete Profile first,
        // `from` or not — everything else sends the patient back to whatever
        // page asked them to log in, falling back to Home.
        //
        // No pending-action replay here any more: in-app sign-in happens in
        // `AuthDialog` without leaving the page, so the action the patient
        // was taking is resumed by `useAuthGate`'s callback rather than
        // reconstructed after a redirect. This route survives only for deep
        // links, where there is no prior action to resume.
        const destination = !result.user.is_profile_complete
          ? "/complete-profile"
          : from
            ? `${from.pathname}${from.search}`
            : "/";
        setStatus("success");
        toast.success("Mobile number verified.");
        // Verified means logged in — straight to the destination, no
        // separate "Continue" tap.
        navigate(destination, { replace: true });
      } catch (error) {
        const message =
          error instanceof ApiRequestError
            ? error.message
            : "Something went wrong. Please try again.";
        toast.error(message);
        setOtp("");
        setStatus("error");
        setShakeTrigger((n) => n + 1);
      }
    },
    [mobile, status, setSession, from, navigate],
  );

  /** Clears the "didn't match" line the moment they start correcting the
   *  code, rather than leaving it under a field they've already fixed. */
  const handleOtpChange = (next: string) => {
    setOtp(next);
    if (status === "error") setStatus("idle");
  };

  const handleResend = async () => {
    if (!mobile || secondsLeft > 0 || isResending) return;
    setIsResending(true);
    try {
      await authApi.login(mobile);
      toast.success("OTP resent.");
      setOtp("");
      setResendCycle((c) => c + 1);
    } catch (error) {
      const message = error instanceof ApiRequestError ? error.message : "Could not resend OTP.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  if (!mobile) {
    return null;
  }

  const isBusy = status === "verifying" || status === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-xl">Verify your number</CardTitle>
          <CardDescription>
            OTP sent to <span className="font-medium text-foreground">{maskMobile(mobile)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleVerify(otp);
            }}
            className="space-y-5"
          >
            <OtpInput
              value={otp}
              onChange={handleOtpChange}
              onComplete={handleVerify}
              shakeTrigger={shakeTrigger}
              disabled={isBusy}
            />

            <p className="text-center text-xs font-medium text-muted-foreground" aria-live="polite">
              {status === "verifying" && "Verifying…"}
              {status === "success" && "Verified!"}
              {status === "error" && "That code didn't match — try again."}
            </p>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isBusy || otp.length !== 6}
            >
              {status === "verifying" && <Loader2 className="size-4 animate-spin" />}
              Verify &amp; Continue
            </Button>
          </form>

          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            {secondsLeft > 0 ? (
              <span>Resend OTP in 0:{secondsLeft.toString().padStart(2, "0")}</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
              >
                {isResending ? "Resending..." : "Resend OTP"}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Change mobile number
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { OtpPage };
