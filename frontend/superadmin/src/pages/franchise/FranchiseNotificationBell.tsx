import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useFranchiseNotifications,
  useMarkAllFranchiseNotificationsRead,
  useMarkFranchiseNotificationRead,
} from "@/hooks/queries/useFranchise";
import type { OrganizationNotification } from "@/services/api/franchiseApi";

/** Mirrors the admin `Topbar`'s bell, but wired to the real
 *  `OrganizationNotification` feed instead of a hardcoded array — see
 *  `organizationNotification.service.ts` on the backend for what writes to
 *  it (currently just "New booking", on every order that resolves to this
 *  franchise). Polls every 30s rather than pushing; there's no
 *  websocket/SSE channel into the portal yet. */
function FranchiseNotificationBell() {
  const navigate = useNavigate();
  const { data } = useFranchiseNotifications();
  const markRead = useMarkFranchiseNotificationRead();
  const markAllRead = useMarkAllFranchiseNotificationsRead();

  const rows = data?.rows ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function handleSelect(notification: OrganizationNotification) {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    if (notification.type === "NEW_BOOKING") {
      navigate("/franchise/orders");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 ? (
            <Badge variant="destructive">{unreadCount} new</Badge>
          ) : (
            <span className="text-xs font-normal text-muted-foreground">All caught up</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {rows.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            {rows.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex-col items-start gap-0.5"
                onSelect={() => handleSelect(notification)}
              >
                <span className="flex w-full items-center gap-1.5 text-sm font-medium">
                  {!notification.isRead && (
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  {notification.title}
                </span>
                <span className="text-xs text-muted-foreground">{notification.message}</span>
                <span className="text-[11px] text-muted-foreground/70">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        {unreadCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center gap-1.5 text-xs font-medium text-primary"
              onSelect={(event) => {
                event.preventDefault();
                markAllRead.mutate();
              }}
            >
              <CheckCheck className="size-3.5" />
              Mark all as read
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { FranchiseNotificationBell };
