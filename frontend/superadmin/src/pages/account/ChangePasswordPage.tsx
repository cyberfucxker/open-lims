import { useState } from "react";
import { AtSign, Check, KeyRound, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword, useChangeUsername } from "@/hooks/queries/useFranchise";
import { useAuth } from "@/hooks/useAuth";
import { setAccessToken } from "@/services/api/tokenStore";
import { updateStoredRefreshToken } from "@/utils/authStorage";
import { cn } from "@/utils/cn";

/** Mirrors the backend policy so the operator sees what is wrong before
 *  submitting rather than after a round trip. */
const RULES: { label: string; test: (value: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "A number", test: (v) => /\d/.test(v) },
  { label: "A special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const USERNAME_PATTERN = /^[A-Za-z0-9._@-]+$/;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** Keeps this tab signed in after the server mints a fresh token pair. */
function adoptTokens(tokens: { accessToken: string; refreshToken: string }) {
  setAccessToken(tokens.accessToken);
  updateStoredRefreshToken(tokens.refreshToken);
}

function ChangeUsernameCard() {
  const { user, updateUser } = useAuth();
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const changeMutation = useChangeUsername();

  const trimmed = newUsername.trim();
  const formatError =
    trimmed.length === 0
      ? null
      : trimmed.length < 3
        ? "At least 3 characters."
        : !USERNAME_PATTERN.test(trimmed)
          ? "Only letters, numbers and . _ - @ — no spaces."
          : trimmed === user?.username
            ? "This is already your username."
            : null;
  const canSubmit = trimmed.length >= 3 && !formatError && currentPassword.length > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    changeMutation.mutate(
      { currentPassword, newUsername: trimmed },
      {
        onSuccess: (result) => {
          adoptTokens(result);
          updateUser({ username: result.username });
          toast.success(
            `Username changed to "${result.username}". Use it the next time you log in.`,
          );
          setNewUsername("");
          setCurrentPassword("");
        },
        onError: (error) => toast.error(errorMessage(error, "Failed to change username")),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Username</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label>Current Username</Label>
            <p className="rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 font-mono text-sm text-foreground">
              {user?.username ?? "—"}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cu-new">New Username</Label>
            <Input
              id="cu-new"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              autoComplete="username"
              spellCheck={false}
            />
            {formatError && <p className="text-xs text-destructive">{formatError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cu-password">Current Password</Label>
            <Input
              id="cu-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div>
            <Button type="submit" disabled={!canSubmit || changeMutation.isPending}>
              <AtSign className="size-4" />
              {changeMutation.isPending ? "Changing…" : "Change Username"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface ChangePasswordPageProps {
  description?: string;
}

/** Self-service username + password change for whoever is signed in — admin or
 *  franchise. `POST /auth/change-username` / `change-password` act on the session's own user,
 *  so the page needs no role awareness beyond its subtitle. */
function ChangePasswordPage({
  description = "Update the username and password for your admin login.",
}: ChangePasswordPageProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changeMutation = useChangePassword();

  const meetsPolicy = RULES.every((rule) => rule.test(newPassword));
  const matches = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = currentPassword.length > 0 && meetsPolicy && matches;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    changeMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: (tokens) => {
          // The server revokes every existing session and mints a fresh pair.
          // Swapping them in keeps THIS tab signed in while other devices are
          // logged out — without this the next request would 401.
          adoptTokens(tokens);

          toast.success("Password changed. Other devices have been signed out.");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (error) => toast.error(errorMessage(error, "Failed to change password")),
      },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Username & Password" description={description} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5">
          <ChangeUsernameCard />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cp-current">Current Password</Label>
                  <Input
                    id="cp-current"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cp-new">New Password</Label>
                  <Input
                    id="cp-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cp-confirm">Confirm New Password</Label>
                  <Input
                    id="cp-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {confirmPassword.length > 0 && !matches && (
                    <p className="text-xs text-destructive">Passwords do not match.</p>
                  )}
                </div>

                <div>
                  <Button type="submit" disabled={!canSubmit || changeMutation.isPending}>
                    <KeyRound className="size-4" />
                    {changeMutation.isPending ? "Changing…" : "Change Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" />
              Password requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {RULES.map((rule) => {
              const ok = rule.test(newPassword);
              return (
                <div key={rule.label} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "flex size-4.5 shrink-0 items-center justify-center rounded-full",
                      ok ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {ok ? <Check className="size-3" /> : <X className="size-3" />}
                  </span>
                  <span className={ok ? "text-foreground" : "text-muted-foreground"}>
                    {rule.label}
                  </span>
                </div>
              );
            })}
            <p className="mt-2 border-t border-border pt-3 text-xs text-muted-foreground">
              Changing your password signs you out everywhere else. This tab stays signed in.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { ChangePasswordPage };
