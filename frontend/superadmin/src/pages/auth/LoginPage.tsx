import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { homeForUser } from "@/routes/roleHome";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login({ username, password, rememberMe });
      // A remembered "from" is only useful if this role can actually see it —
      // a franchise bounced off an admin URL would otherwise be sent straight
      // back to it and ping-pong through the role gate.
      const home = homeForUser(user);
      const from = (location.state as { from?: string } | null)?.from;
      const redirectTo = from && from.startsWith(home) ? from : home;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unable to log in. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-secondary/40 p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-float-slow absolute -top-32 -left-24 size-[28rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="animate-float absolute top-1/3 -right-32 size-[24rem] rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo />
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Sign in to Superadmin
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground">
              Remember me on this device
            </Label>
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export { LoginPage };
