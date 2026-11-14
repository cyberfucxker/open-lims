import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToggle } from "@/hooks/useToggle";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "@/utils/passwordSchema";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Two-step flow (request token -> submit token + new password) implemented
 * as a dialog rather than dedicated routes, since only the login page and
 * the two dashboard placeholders exist as routes in this app.
 */
function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [showNewPassword, toggleShowNewPassword] = useToggle(false);

  const requestForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { username: "" },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: "", newPassword: "", confirmPassword: "" },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep(1);
      requestForm.reset();
      resetForm.reset();
    }
    onOpenChange(nextOpen);
  };

  const onRequestSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(values.username);
      toast.success("If that account exists, reset instructions have been generated.");
      setStep(2);
    } catch {
      // The global axios interceptor already surfaced an error toast.
    }
  };

  const onResetSubmit = async (values: ResetPasswordFormValues) => {
    try {
      await resetPassword(values.token, values.newPassword);
      toast.success("Password reset successfully. You can now log in.");
      handleOpenChange(false);
    } catch {
      // The global axios interceptor already surfaced an error toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Reset your password</DialogTitle>
              <DialogDescription>
                Enter your username and we&apos;ll generate password reset instructions.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={requestForm.handleSubmit(onRequestSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="forgot-username">Username</Label>
                <Input
                  id="forgot-username"
                  autoComplete="username"
                  placeholder="Enter your username"
                  invalid={Boolean(requestForm.formState.errors.username)}
                  {...requestForm.register("username")}
                />
                {requestForm.formState.errors.username && (
                  <p className="text-xs font-medium text-destructive">
                    {requestForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={requestForm.formState.isSubmitting}>
                  {requestForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset instructions"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Enter reset token</DialogTitle>
              <DialogDescription>
                Paste the reset token you received and choose a new password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="reset-token">Reset token</Label>
                <Input
                  id="reset-token"
                  placeholder="Paste your reset token"
                  invalid={Boolean(resetForm.formState.errors.token)}
                  {...resetForm.register("token")}
                />
                {resetForm.formState.errors.token && (
                  <p className="text-xs font-medium text-destructive">
                    {resetForm.formState.errors.token.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    invalid={Boolean(resetForm.formState.errors.newPassword)}
                    className="pr-10"
                    {...resetForm.register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={toggleShowNewPassword}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {resetForm.formState.errors.newPassword && (
                  <p className="text-xs font-medium text-destructive">
                    {resetForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  invalid={Boolean(resetForm.formState.errors.confirmPassword)}
                  {...resetForm.register("confirmPassword")}
                />
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-xs font-medium text-destructive">
                    {resetForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={resetForm.formState.isSubmitting}>
                  {resetForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { ForgotPasswordDialog };
