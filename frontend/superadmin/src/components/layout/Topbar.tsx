import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  FlaskConical,
  KeyRound,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { customers, tests } from "@/lib/mock";
import { useThemeStore } from "@/lib/stores/theme-store";
import { initials } from "@/lib/format";
import { isManager } from "@/config/staffModules";

const NOTIFICATIONS = [
  {
    id: 1,
    title: "SLA breach alert",
    detail: "6 reports have crossed their TAT window",
    time: "12m ago",
  },
  {
    id: 2,
    title: "New WhatsApp template pending",
    detail: '"Monsoon Health Checkup Offer" awaits approval',
    time: "40m ago",
  },
  {
    id: 3,
    title: "High refund volume",
    detail: "18 refunds initiated in the last 24 hours",
    time: "2h ago",
  },
];

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.fullName ?? user?.username ?? "Admin";

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length <= 1) return { customers: [], tests: [] };
    return {
      customers: customers
        .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
        .slice(0, 6),
      tests: tests.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 6),
    };
  }, [query]);

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <header className="glass-panel sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileSidebar}>
        <Menu className="size-5" />
      </Button>

      <Breadcrumbs />

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="ml-auto flex w-full max-w-xs items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/40"
      >
        <Search className="size-4" />
        <span className="hidden truncate sm:inline">Search customers, orders, tests…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-[18px]" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <Badge variant="destructive">{NOTIFICATIONS.length} new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NOTIFICATIONS.map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5">
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.detail}</span>
                <span className="text-[11px] text-muted-foreground/70">{n.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-full outline-none"
            >
              <Avatar>
                <AvatarFallback className="bg-primary text-white">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">{displayName}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {user?.email ?? user?.username}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/change-password")}>
              <KeyRound className="size-4" /> Username & Password
            </DropdownMenuItem>
            {!isManager(user) && (
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="size-4" /> Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOut className="size-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog
        open={searchOpen}
        onOpenChange={(open) => (open ? setSearchOpen(true) : closeSearch())}
        title="Global search"
        description="Search customers, orders and tests"
        shouldFilter={false}
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search customers, tests…"
        />
        <CommandList>
          {query.trim().length <= 1 ? (
            <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>
              {results.customers.length > 0 && (
                <CommandGroup heading="Customers">
                  {results.customers.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      onSelect={() => {
                        closeSearch();
                        navigate(`/customers/${c.id}`);
                      }}
                    >
                      <Users className="size-4" />
                      <span>{c.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{c.phone}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.tests.length > 0 && (
                <CommandGroup heading="Tests">
                  {results.tests.map((t) => (
                    <CommandItem
                      key={t.id}
                      value={t.id}
                      onSelect={() => {
                        closeSearch();
                        navigate(`/tests-packages?q=${encodeURIComponent(t.name)}`);
                      }}
                    >
                      <FlaskConical className="size-4" />
                      <span>{t.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">₹{t.price}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </header>
  );
}

export { Topbar };
