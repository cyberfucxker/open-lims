import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, FileText, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useSendThirdPartyOtp, useVerifyThirdPartyOtp } from "@/hooks/queries/useThirdPartyReports";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";
import { mobileNumberField } from "@/utils/mobileNumberField";

const mobileSchema = z.object({
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
});
type MobileFormValues = z.infer<typeof mobileSchema>;

const STEPS = [
  { key: "mobile", label: "Mobile" },
  { key: "otp", label: "Verify" },
] as const;

function StepRail({ step }: { step: "mobile" | "otp" }) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const isDone = i < activeIndex;
        const isCurrent = i === activeIndex;

        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                isDone || isCurrent
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold tracking-wide uppercase transition-colors",
                isCurrent ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden className={cn("h-px w-6", isDone ? "bg-primary" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** OTP-gated link step for the ThirdPartyReport module — mirrors the login
 *  OTP flow (LoginPage/OtpPage) but scoped to linking the partner lab
 *  account rather than the app session itself. */
function ThirdPartyLinkCard() {
  const { user } = useAuth();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const sendOtp = useSendThirdPartyOtp();
  const verifyOtp = useVerifyThirdPartyOtp();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MobileFormValues>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobileNumber: user?.mobile ?? "" },
  });

  const onSendOtp = async ({ mobileNumber }: MobileFormValues) => {
    try {
      await sendOtp.mutateAsync(mobileNumber);
      setMobile(mobileNumber);
      setStep("otp");
      toast.success("OTP sent.");
    } catch {
      // toast already shown by the mutation's onError
    }
  };

  const onVerify = async (code: string) => {
    try {
      await verifyOtp.mutateAsync({ mobileNumber: mobile, otp: code });
      toast.success("Lab account linked.");
    } catch {
      setOtp("");
      setShakeTrigger((s) => s + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="mx-auto w-full max-w-lg"
    >
      <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-card p-6 shadow-xl shadow-black/[0.05] sm:p-8">
        <div
          aria-hidden
          className="absolute -top-24 -right-16 size-56 rounded-full bg-primary/[0.07] blur-3xl"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <span
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15"
            >
              <FileText className="size-6" />
            </span>
            <StepRail step={step} />
          </div>

          <h2 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">
            {step === "mobile" ? "Access your lab reports" : "Enter the verification code"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {step === "mobile"
              ? "Verify your mobile number to securely pull every report filed against it at our partner lab."
              : `We sent a 6-digit code to +91 ${mobile}.`}
          </p>

          {/* mode="wait" so the outgoing step clears before the next slides in — the two
              steps have different heights and would otherwise overlap mid-transition. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === "otp" ? 24 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: step === "otp" ? -24 : 24 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              className="mt-6"
            >
              {step === "mobile" ? (
                <form onSubmit={handleSubmit(onSendOtp)} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="third-party-mobile">Mobile number</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 border-r border-border pr-3 text-sm font-semibold text-muted-foreground">
                        +91
                      </span>
                      <Input
                        id="third-party-mobile"
                        aria-invalid={!!errors.mobileNumber}
                        className="h-12 pl-16 text-base tracking-wide tabular-nums"
                        {...mobileNumberField(register("mobileNumber"))}
                      />
                    </div>
                    {errors.mobileNumber && (
                      <p className="text-sm text-destructive">{errors.mobileNumber.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full"
                    disabled={sendOtp.isPending}
                  >
                    {sendOtp.isPending && <Loader2 className="size-4 animate-spin" />}
                    Send OTP
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    onComplete={onVerify}
                    shakeTrigger={shakeTrigger}
                    disabled={verifyOtp.isPending}
                  />
                  <Button
                    size="lg"
                    className="h-12 w-full"
                    disabled={verifyOtp.isPending || otp.length !== 6}
                    onClick={() => onVerify(otp)}
                  >
                    {verifyOtp.isPending && <Loader2 className="size-4 animate-spin" />}
                    Verify &amp; View Reports
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep("mobile")}
                    className="mx-auto flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" />
                    Change mobile number
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center gap-4 border-t border-border pt-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <LockKeyhole className="size-3.5" />
              OTP verified access
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" />
              Reports never leave your account
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { ThirdPartyLinkCard };
