import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole, LogIn, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToggle } from "@/hooks/useToggle";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { cn } from "@/utils/cn";
import { loginSchema, type LoginFormValues } from "@/utils/loginSchema";
import { dashboardPathForRole } from "@/utils/roleRoutes";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="animate-fade-in-up flex items-center gap-1.5 text-xs font-medium text-destructive">
      <AlertCircle className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, toggleShowPassword] = useToggle(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
    mode: "onTouched",
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const user = await login(values);
      navigate(dashboardPathForRole(user.role), { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {formError && (
          <div className="animate-fade-in-up flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {formError}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              invalid={Boolean(errors.username)}
              className="pl-10"
              {...register("username")}
            />
          </div>
          <FieldError message={errors.username?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-xs font-medium text-primary transition-colors hover:text-primary/80 hover:underline underline-offset-4"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              invalid={Boolean(errors.password)}
              className="px-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-primary/15 outline-none"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>

        <div className="flex items-center gap-2.5">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setValue("rememberMe", checked === true)}
          />
          <Label htmlFor="rememberMe" className="cursor-pointer font-normal text-muted-foreground">
            Remember me
          </Label>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className={cn("mt-1 w-full", isSubmitting && "cursor-wait")}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              Login
            </>
          )}
        </Button>
      </form>

      <ForgotPasswordDialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
    </>
  );
}

export { LoginForm };
