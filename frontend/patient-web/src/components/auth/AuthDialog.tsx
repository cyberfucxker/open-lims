import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck, UserRound, Zap } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { OtpInput, type OtpStatus } from "@/components/auth/OtpInput";
import brandLogo from "@/assets/logo.png";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/services/api/authApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { useAuthDialogStore } from "@/store/authDialogStore";
import { mobileNumberField } from "@/utils/mobileNumberField";

/**
 * The whole sign-in flow — mobile, OTP, complete profile — in one sheet.
 *
 * Mounted once in `AppShell`, opened from anywhere through
 * `authDialogStore`/`useAuthGate`. The point is that a guest who taps "Add to
 * Cart" or "Book" never leaves the page they were on: no route change, no
 * losing their place in a long catalogue, no bounce-back logic to get wrong.
 * When they finish, the action they originally tried simply runs.
 *
 * `/login`, `/otp` and `/complete-profile` still exist as routes for deep
 * links and for anyone who navigates there directly; this is the in-app path,
 * not a replacement for them.
 */

const RESEND_SECONDS = 30;
const TODAY = format(new Date(), "yyyy-MM-dd");

const CITY_OPTIONS = [
  { value: "jaipur", label: "Jaipur" },
  { value: "udaipur", label: "Udaipur" },
];

const mobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
});
type MobileFormValues = z.infer<typeof mobileSchema>;

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  sex: z.enum(["Male", "Female", "Other"], { required_error: "Select your sex." }),
  dob: z
    .string()
    .min(1, "Select your date of birth.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()) && new Date(value) <= new Date(), {
      message: "Enter a valid date of birth.",
    }),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  city: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

function maskMobile(mobile: string) {
  return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
}

function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  return error instanceof ApiRequestError ? error.message : fallback;
}

/** Each step animates in from the right, so moving forward feels like moving
 *  forward rather than the sheet's contents being swapped underneath you. */
function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="space-y-5"
    >
      {children}
    </motion.div>
  );
}

/** Left-aligned on desktop, where the brand panel beside it already carries the
 *  centred identity; centred on mobile, where this IS the top of the sheet and
 *  the brand panel is hidden. */
function StepHeading({ title, subtitle }: { title: string; subtitle: React.ReactNode }) {
  return (
    <div className="text-center md:text-left">
      {/* Phone only: there's no brand panel beside the sheet there, so the
          wordmark carries the identity that panel would — a generic padlock
          glyph said nothing about whose sheet this is. */}
      <img
        src={brandLogo}
        alt="Example Diagnostics Lab"
        className="mx-auto mb-4 h-8 w-auto md:hidden"
      />
      <h2 className="text-lg font-semibold text-foreground md:text-xl">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Secure & Safe" },
  { icon: Zap, label: "Quick Login" },
  { icon: UserRound, label: "Your Cart" },
] as const;

/** Reassurance at the exact moment a stranger is asked for their phone number.
 *  Desktop only: on a phone this would push the fields themselves below the
 *  fold, and the sheet's whole job there is the fields. */
function TrustStrip() {
  return (
    <div className="mt-6 hidden items-center justify-between border-t border-border pt-4 md:flex">
      {TRUST_POINTS.map(({ icon: Icon, label }) => (
        <span key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-3.5" />
          </span>
          {label}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- mobile ---

function MobileStep({ reason }: { reason: string | null }) {
  const setStep = useAuthDialogStore((s) => s.setStep);
  const setMobile = useAuthDialogStore((s) => s.setMobile);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MobileFormValues>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile: "" },
  });

  const onSubmit = async ({ mobile }: MobileFormValues) => {
    try {
      await authApi.login(mobile);
      toast.success("OTP sent successfully.");
      setMobile(mobile);
      setStep("otp");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Step>
      <StepHeading
        title="Log in to continue"
        subtitle={reason ?? "Enter your mobile number to book tests at home or at a lab near you."}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2.5">
          <Label htmlFor="auth-mobile">Mobile number</Label>
          <div className="flex items-center gap-2">
            <span className="flex h-11 shrink-0 items-center rounded-lg border border-input bg-muted px-3.5 text-sm text-muted-foreground">
              +91
            </span>
            <Input
              id="auth-mobile"
              placeholder="98765 43210"
              autoFocus
              // Input carries `w-full`, which inside this row means 100% of the
              // row on top of the "+91" prefix. `flex-1 min-w-0` lets it size
              // to the space actually left instead.
              className="min-w-0 flex-1"
              aria-invalid={!!errors.mobile}
              {...mobileNumberField(register("mobile"))}
            />
          </div>
          {errors.mobile && <p className="text-sm text-destructive">{errors.mobile.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Get OTP
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to our <span className="font-medium text-foreground">Terms</span>{" "}
        &amp; <span className="font-medium text-foreground">Privacy Policy</span>.
      </p>
    </Step>
  );
}

// ------------------------------------------------------------------- otp ---

function OtpStep({ onAuthenticated }: { onAuthenticated: (profileComplete: boolean) => void }) {
  const mobile = useAuthDialogStore((s) => s.mobile);
  const setStep = useAuthDialogStore((s) => s.setStep);
  const { setSession } = useAuth();

  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resendCycle, setResendCycle] = useState(0);

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
      if (code.length !== 6 || status === "verifying" || status === "success") return;
      setStatus("verifying");
      try {
        const result = await authApi.verifyOtp(mobile, code);
        setSession(result.token, {
          id: result.user.id,
          mobile: result.user.mobile,
          name: null,
          isProfileComplete: result.user.is_profile_complete,
        });
        setStatus("success");
        toast.success("Mobile number verified.");
        onAuthenticated(result.user.is_profile_complete);
      } catch (error) {
        toast.error(errorMessage(error));
        setOtp("");
        setStatus("error");
        setShakeTrigger((n) => n + 1);
      }
    },
    [mobile, status, setSession, onAuthenticated],
  );

  /** Clears the "didn't match" line the moment they start correcting the
   *  code, rather than leaving it under a field they've already fixed. */
  const handleOtpChange = (next: string) => {
    setOtp(next);
    if (status === "error") setStatus("idle");
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;
    setIsResending(true);
    try {
      await authApi.login(mobile);
      toast.success("OTP resent.");
      setOtp("");
      setResendCycle((c) => c + 1);
    } catch (error) {
      toast.error(errorMessage(error, "Could not resend OTP."));
    } finally {
      setIsResending(false);
    }
  };

  const isBusy = status === "verifying" || status === "success";

  return (
    <Step>
      <StepHeading
        title="Verify your number"
        subtitle={
          <>
            OTP sent to <span className="font-medium text-foreground">{maskMobile(mobile)}</span>
          </>
        }
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleVerify(otp);
        }}
        className="space-y-4"
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

        <Button type="submit" size="lg" className="w-full" disabled={isBusy || otp.length !== 6}>
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
            {isResending ? "Resending…" : "Resend OTP"}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setStep("mobile")}
        className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Change mobile number
      </button>
    </Step>
  );
}

// --------------------------------------------------------------- profile ---

function ProfileStep({ onDone }: { onDone: () => void }) {
  const { updateUser } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", dob: "", email: "" },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await authApi.completeProfile({
        name: values.name,
        sex: values.sex,
        d_o_b: values.dob,
        email: values.email || undefined,
        patient_city: values.city,
      });
      updateUser({ isProfileComplete: true, name: values.name });
      toast.success("Profile completed successfully.");
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Step>
      <StepHeading
        title="Complete your profile"
        subtitle="A few details so we can put the right name on your reports."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="auth-name">Full name</Label>
          <Input
            id="auth-name"
            placeholder="Your full name"
            autoFocus
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="auth-sex">Sex</Label>
            <Controller
              control={control}
              name="sex"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="auth-sex" aria-invalid={!!errors.sex}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.sex && <p className="text-sm text-destructive">{errors.sex.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-dob">Date of birth</Label>
            <Input
              id="auth-dob"
              type="date"
              max={TODAY}
              aria-invalid={!!errors.dob}
              {...register("dob")}
            />
            {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="auth-email">Email (optional)</Label>
          <Input
            id="auth-email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="auth-city">City (optional)</Label>
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="auth-city">
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  {CITY_OPTIONS.map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Save &amp; Continue
        </Button>
      </form>
    </Step>
  );
}

// ------------------------------------------------------------------ root ---

function AuthDialog() {
  const isOpen = useAuthDialogStore((s) => s.isOpen);
  const step = useAuthDialogStore((s) => s.step);
  const reason = useAuthDialogStore((s) => s.reason);

  /** Closing and running the pending action are one operation — the action
   *  has to read the store's `onSuccess` BEFORE `close()` clears it. */
  const finish = useCallback(() => {
    const { onSuccess, close } = useAuthDialogStore.getState();
    close();
    onSuccess?.();
  }, []);

  const handleAuthenticated = useCallback(
    (profileComplete: boolean) => {
      if (profileComplete) {
        finish();
        return;
      }
      // Signed in, but nothing can be booked against a half-built patient
      // record — so the profile step is part of the same flow, not a
      // separate screen they have to find later.
      useAuthDialogStore.getState().setStep("profile");
    },
    [finish],
  );

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) useAuthDialogStore.getState().close();
      }}
      // Padding is stripped so the brand panel can run edge to edge; each half
      // pads itself instead. `overflow-hidden` keeps that panel inside the
      // sheet's rounded corners.
      className="p-0 md:max-w-3xl md:overflow-hidden md:p-0"
    >
      {/* Two panels only exist on desktop; on a phone there is a single child
          and nothing to lay side by side. */}
      <div className="block md:flex md:min-h-[27rem]">
        <AuthBrandPanel step={step} />

        {/* `max-w-sm` on the inner column: at full panel width a 10-digit
            field and its button stretch to ~26rem, which reads as a form that
            wants far more input than it does. */}
        <div className="min-w-0 flex-1 px-5 pt-3 pb-[calc(1rem+var(--safe-area-bottom))] md:flex md:flex-col md:justify-center md:px-8 md:py-8">
          <div className="mx-auto w-full md:max-w-sm">
            <AnimatePresence mode="wait">
              {step === "mobile" && <MobileStep key="mobile" reason={reason} />}
              {step === "otp" && <OtpStep key="otp" onAuthenticated={handleAuthenticated} />}
              {step === "profile" && <ProfileStep key="profile" onDone={finish} />}
            </AnimatePresence>

            <TrustStrip />
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

export { AuthDialog };
