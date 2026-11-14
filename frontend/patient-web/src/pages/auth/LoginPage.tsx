import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/api/authApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { mobileNumberField } from "@/utils/mobileNumberField";

const loginSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Set by `ProtectedRoute` (direct hit on a gated page) or `useAddToCart`
  // (guest tapped "Add to Cart") — carried through to `/otp` so a successful
  // verify can send the patient back to where they actually were.
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { mobile: "" },
  });

  const onSubmit = async ({ mobile }: LoginFormValues) => {
    try {
      await authApi.login(mobile);
      toast.success("OTP sent successfully.");
      navigate("/otp", { state: { mobile, from } });
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.";
      toast.error(message);
    }
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
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your mobile number to book diagnostic tests at home or at a lab near you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile number</Label>
              <div className="flex items-center gap-2">
                <span className="flex h-11 items-center rounded-lg border border-input bg-muted px-3.5 text-sm text-muted-foreground">
                  +91
                </span>
                <Input
                  id="mobile"
                  placeholder="98765 43210"
                  aria-invalid={!!errors.mobile}
                  {...mobileNumberField(register("mobile"))}
                />
              </div>
              {errors.mobile && <p className="text-sm text-destructive">{errors.mobile.message}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Get OTP
            </Button>

            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Trouble logging in?
            </button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        New here? By continuing you agree to our{" "}
        <span className="font-medium text-foreground">Terms</span> &amp;{" "}
        <span className="font-medium text-foreground">Privacy Policy</span>.
      </p>
    </motion.div>
  );
}

export { LoginPage };
