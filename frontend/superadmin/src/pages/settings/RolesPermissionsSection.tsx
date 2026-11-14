import { useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STAFF_MODULES } from "@/config/staffModules";
import {
  useCreateManager,
  useResetManagerPassword,
  useStaffUsers,
  useUpdateManager,
} from "@/hooks/queries/useStaffUsers";
import { formatDateTime } from "@/lib/format";
import type { StaffUser } from "@/services/api/staffUserApi";

/** Mirrors the backend's PASSWORD_POLICY_REGEX. */
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_HINT = "8+ characters with an uppercase, a lowercase, a number and a symbol.";
const USERNAME_PATTERN = /^[A-Za-z0-9._@-]{3,100}$/;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function ModuleCheckboxes({
  value,
  onChange,
  idPrefix,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {STAFF_MODULES.map((m) => {
        const id = `${idPrefix}-${m.key}`;
        const checked = value.includes(m.key);
        return (
          <label key={m.key} htmlFor={id} className="flex cursor-pointer items-start gap-2.5">
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={(c) =>
                onChange(c === true ? [...value, m.key] : value.filter((k) => k !== m.key))
              }
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">{m.label}</span>
              <span className="block text-xs text-muted-foreground">{m.description}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function AddManagerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [modules, setModules] = useState<string[]>(STAFF_MODULES.map((m) => m.key));
  const createManager = useCreateManager();

  const usernameOk = USERNAME_PATTERN.test(username.trim());
  const passwordOk = PASSWORD_POLICY.test(password);
  const canSubmit = fullName.trim() && usernameOk && passwordOk && modules.length > 0;

  function reset() {
    setFullName("");
    setUsername("");
    setPassword("");
    setModules(STAFF_MODULES.map((m) => m.key));
  }

  function submit() {
    if (!canSubmit) return;
    createManager.mutate(
      { fullName: fullName.trim(), username: username.trim(), password, staffModules: modules },
      {
        onSuccess: (user) => {
          toast.success(
            `Manager "${user.username}" created. Share the username and password with them.`,
          );
          reset();
          onOpenChange(false);
        },
        onError: (error) => toast.error(errorMessage(error, "Failed to create manager")),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Manager</DialogTitle>
          <DialogDescription>
            A manager logs in to this panel but only sees the modules you tick below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mgr-name">Full Name</Label>
            <Input id="mgr-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mgr-username">Username</Label>
            <Input
              id="mgr-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {username && !usernameOk && (
              <p className="text-xs text-destructive">
                3+ characters; letters, numbers and . _ - @ only, no spaces.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mgr-password">Password</Label>
            <Input
              id="mgr-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <p
              className={
                password && !passwordOk
                  ? "text-xs text-destructive"
                  : "text-xs text-muted-foreground"
              }
            >
              {PASSWORD_HINT}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Module Access</Label>
            <ModuleCheckboxes value={modules} onChange={setModules} idPrefix="new" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || createManager.isPending}>
            {createManager.isPending ? "Creating…" : "Create Manager"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: StaffUser | null; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const resetPassword = useResetManagerPassword();
  const ok = PASSWORD_POLICY.test(password);

  function submit() {
    if (!user || !ok) return;
    resetPassword.mutate(
      { id: user.id, password },
      {
        onSuccess: () => {
          toast.success(`Password reset for "${user.username}". They have been signed out.`);
          setPassword("");
          onClose();
        },
        onError: (error) => toast.error(errorMessage(error, "Failed to reset password")),
      },
    );
  }

  return (
    <Dialog
      open={user !== null}
      onOpenChange={(o) => {
        if (!o) {
          setPassword("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for {user?.fullName ?? user?.username}. They will be signed out of
            every device.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reset-password">New Password</Label>
          <Input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <p
            className={
              password && !ok ? "text-xs text-destructive" : "text-xs text-muted-foreground"
            }
          >
            {PASSWORD_HINT}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!ok || resetPassword.isPending}>
            {resetPassword.isPending ? "Saving…" : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Settings → Team & Access: the admin login(s) plus MANAGER logins, each
 *  scoped to the modules ticked for them. Backed by `/staff-users`. */
function RolesPermissionsSection() {
  const { data: users, isLoading } = useStaffUsers();
  const updateManager = useUpdateManager();
  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffUser | null>(null);

  function update(
    user: StaffUser,
    input: { staffModules?: string[]; isActive?: boolean },
    done: string,
  ) {
    updateManager.mutate(
      { id: user.id, ...input },
      {
        onSuccess: () => toast.success(done),
        onError: (error) => toast.error(errorMessage(error, "Failed to update manager")),
      },
    );
  }

  function toggleModule(user: StaffUser, key: string, on: boolean) {
    const next = on ? [...user.staffModules, key] : user.staffModules.filter((k) => k !== key);
    if (next.length === 0) {
      toast.error("A manager needs at least one module. Deactivate them instead.");
      return;
    }
    update(user, { staffModules: next }, "Access updated");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Team & Access</CardTitle>
          <CardDescription>
            Managers log in here but only see the modules you give them. Deleting orders or phlebos
            always stays with the admin.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> Add Manager
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  {STAFF_MODULES.map((m) => (
                    <TableHead key={m.key} className="text-center">
                      {m.label}
                    </TableHead>
                  ))}
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users ?? []).map((u) => {
                  const admin = u.role === "ADMIN";
                  return (
                    <TableRow key={u.id} className={u.isActive ? undefined : "opacity-60"}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {u.fullName ?? u.username}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">{u.username}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin ? "default" : "secondary"}>
                          {admin ? "Admin" : "Manager"}
                        </Badge>
                      </TableCell>
                      {STAFF_MODULES.map((m) => (
                        <TableCell key={m.key} className="text-center">
                          {admin ? (
                            <span className="text-xs text-muted-foreground">All</span>
                          ) : (
                            <Checkbox
                              checked={u.staffModules.includes(m.key)}
                              disabled={updateManager.isPending}
                              onCheckedChange={(c) => toggleModule(u, m.key, c === true)}
                              aria-label={`${m.label} access for ${u.username}`}
                            />
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-xs text-muted-foreground">
                        {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                      </TableCell>
                      <TableCell className="text-center">
                        {admin ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Switch
                            checked={u.isActive}
                            disabled={updateManager.isPending}
                            onCheckedChange={(on) =>
                              update(
                                u,
                                { isActive: on },
                                on ? "Manager activated" : "Manager deactivated and signed out",
                              )
                            }
                            aria-label={`Active status for ${u.username}`}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!admin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResetTarget(u)}
                            title="Reset password"
                          >
                            <KeyRound className="size-3.5" /> Reset
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AddManagerDialog open={addOpen} onOpenChange={setAddOpen} />
      <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} />
    </Card>
  );
}

export { RolesPermissionsSection };
