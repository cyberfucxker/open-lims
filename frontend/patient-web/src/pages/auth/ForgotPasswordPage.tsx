// Phase 2 blocker: no backend endpoint yet — see build plan gap list. UI-only for now.
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, Loader2, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { delay } from "@/mocks/delay";
import { mobileNumberField } from "@/utils/mobileNumberField";

const DEMO_OTP = "123456";
const RESEND_SECONDS = 30;

const mobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
});
type MobileFormValues = z.infer<typeof mobileSchema>;

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

type Step = "mobile" | "otp" | "password" | "success";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resendCycle, setResendCycle] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const mobileForm = useForm<MobileFormValues>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile: "" },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (step !== "otp") return;
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
  }, [step, resendCycle]);

  useEffect(() => {
    if (step !== "success") return;
    const timeout = setTimeout(() => navigate("/login", { replace: true }), 1800);
    return () => clearTimeout(timeout);
  }, [step, navigate]);

  const handleSendOtp = async ({ mobile: value }: MobileFormValues) => {
    await delay(null, 600);
    setMobile(value);
    toast.success(`OTP sent. For this demo, your OTP is ${DEMO_OTP}.`, { duration: 6000 });
    setStep("otp");
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6 || isVerifyingOtp) return;
    setIsVerifyingOtp(true);
    await delay(null, 600);
    if (code !== DEMO_OTP) {
      toast.error("Incorrect OTP. Please try again.");
      setOtp("");
      setShakeTrigger((s) => s + 1);
      setIsVerifyingOtp(false);
      return;
    }
    setIsVerifyingOtp(false);
    setStep("password");
  };

  const handleResendOtp = async () => {
    if (secondsLeft > 0 || isResending) return;
    setIsResending(true);
    await delay(null, 500);
    toast.success(`OTP resent. For this demo, your OTP is ${DEMO_OTP}.`);
    setOtp("");
    setResendCycle((c) => c + 1);
    setIsResending(false);
  };

  const handleSetPassword = async () => {
    await delay(null, 700);
    setStep("success");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="size-6" />
          </div>
          <CardTitle className="text-xl">
            {step === "success" ? "All set!" : "Reset your password"}
          </CardTitle>
          <CardDescription>
            {step === "mobile" && "Enter your registered mobile number to receive an OTP."}
            {step === "otp" && `OTP sent to +91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`}
            {step === "password" && "Choose a new password for your account."}
            {step === "success" && "Your password has been reset successfully."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {step === "mobile" && (
              <motion.form
                key="mobile"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={mobileForm.handleSubmit(handleSendOtp)}
                className="space-y-5"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="fp-mobile">Mobile number</Label>
                  <div className="flex items-center gap-2">
                    <span className="flex h-11 items-center rounded-lg border border-input bg-muted px-3.5 text-sm text-muted-foreground">
                      +91
                    </span>
                    <Input
                      id="fp-mobile"
                      placeholder="98765 43210"
                      aria-invalid={!!mobileForm.formState.errors.mobile}
                      {...mobileNumberField(mobileForm.register("mobile"))}
                    />
                  </div>
                  {mobileForm.formState.errors.mobile && (
                    <p className="text-sm text-destructive">
                      {mobileForm.formState.errors.mobile.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={mobileForm.formState.isSubmitting}
                >
                  {mobileForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Send OTP
                </Button>
              </motion.form>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex items-start gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm text-accent-foreground">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <span>
                    For this demo, your OTP is <strong>{DEMO_OTP}</strong>.
                  </span>
                </div>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerifyOtp}
                  shakeTrigger={shakeTrigger}
                  disabled={isVerifyingOtp}
                />
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={isVerifyingOtp || otp.length !== 6}
                  onClick={() => void handleVerifyOtp(otp)}
                >
                  {isVerifyingOtp && <Loader2 className="size-4 animate-spin" />}
                  Verify OTP
                </Button>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  {secondsLeft > 0 ? (
                    <span>Resend OTP in 0:{secondsLeft.toString().padStart(2, "0")}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                    >
                      {isResending ? "Resending..." : "Resend OTP"}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === "password" && (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={passwordForm.handleSubmit(handleSetPassword)}
                className="space-y-5"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="fp-password">New password</Label>
                  <Input
                    id="fp-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!passwordForm.formState.errors.password}
                    {...passwordForm.register("password")}
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fp-confirm-password">Confirm password</Label>
                  <Input
                    id="fp-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={passwordForm.formState.isSubmitting}
                >
                  {passwordForm.formState.isSubmitting && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Reset Password
                </Button>
              </motion.form>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <div className="flex size-16 items-center justify-center rounded-full bg-success text-success-foreground">
                  <CheckCircle2 className="size-9" />
                </div>
                <p className="text-sm text-muted-foreground">Redirecting you to login...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {step !== "success" && (
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Back to login
        </button>
      )}
    </motion.div>
  );
}

export { ForgotPasswordPage };
