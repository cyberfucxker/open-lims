import { useEffect, useState } from "react";
import {
  Bell,
  FlaskConical,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
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
import { useGlobalSearch } from "@/hooks/queries/useGlobalSearch";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Report authorized",
    detail: "CBC report for Aarav Sharma is ready",
    time: "5m ago",
  },
  {
    id: 2,
    title: "New registration",
    detail: "Diya Verma registered at Bandra branch",
    time: "22m ago",
  },
  {
    id: 3,
    title: "Payment pending",
    detail: "3 invoices awaiting payment confirmation",
    time: "1h ago",
  },
];

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isFetching: isSearching } = useGlobalSearch(debouncedSearchQuery);

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  const initials = (user?.fullName ?? user?.username ?? "A")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="glass-panel sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileSidebar}>
        <Menu className="size-5" />
      </Button>

      <Breadcrumbs />

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="ml-auto flex w-full max-w-xs items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/40 sm:flex"
      >
        <Search className="size-4" />
        <span className="hidden truncate sm:inline">Search patients, tests…</span>
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
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <Badge variant="info">{NOTIFICATIONS.length} new</Badge>
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
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {user?.fullName ?? user?.username}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {user?.email ?? user?.role}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void logout()}>
              <LogOut className="size-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog
        open={searchOpen}
        onOpenChange={(open) => (open ? setSearchOpen(true) : closeSearch())}
        title="Global search"
        description="Search patients and tests"
        shouldFilter={false}
      >
        <CommandInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search patients, tests, patient ID…"
        />
        <CommandList>
          {debouncedSearchQuery.trim().length <= 1 ? (
            <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
          ) : isSearching ? (
            <CommandEmpty>Searching…</CommandEmpty>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Patients">
                {searchResults?.patients.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => {
                      closeSearch();
                      navigate(`/admin/patients/search?q=${encodeURIComponent(p.fullName)}`);
                    }}
                  >
                    <Users className="size-4" />
                    <span>{p.fullName}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{p.patientId}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Tests">
                {searchResults?.tests.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={t.id}
                    onSelect={() => {
                      closeSearch();
                      navigate(`/admin/tests?q=${encodeURIComponent(t.name)}`);
                    }}
                  >
                    <FlaskConical className="size-4" />
                    <span>{t.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">₹{t.price}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </header>
  );
}

export { Topbar };
