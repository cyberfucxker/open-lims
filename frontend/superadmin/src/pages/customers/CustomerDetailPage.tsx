import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Cake,
  Home,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  UserX,
  Wallet,
} from "lucide-react";

import { AvatarChip } from "@/components/common/AvatarChip";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusPill } from "@/components/common/StatusPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppUser } from "@/hooks/queries/useAppUsers";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import type {
  AppUserAddress,
  AppUserOrder,
  AppUserWalletTransaction,
} from "@/services/api/appUserApi";
import { cn } from "@/utils/cn";

import { CustomerEditDialog } from "./CustomerEditDialog";

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-9 w-40 rounded-lg" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-10 w-72 rounded-xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function formatAddressLine(address: AppUserAddress): string {
  return [address.houseNo, address.apartment, address.address].filter(Boolean).join(", ");
}

function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useAppUser(id);

  const totalOrderValue = useMemo(
    () => (data?.orders ?? []).reduce((sum, o) => sum + o.totalPayable, 0),
    [data?.orders],
  );

  const backButton = (
    <Button variant="outline" size="sm" className="w-fit" onClick={() => navigate("/customers")}>
      <ArrowLeft className="size-4" /> Back to Customers
    </Button>
  );

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-5">
        {backButton}
        <EmptyState
          icon={UserX}
          title="Customer not found"
          description={
            error instanceof Error ? error.message : `No customer with ID "${id}" could be loaded.`
          }
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const { profile, addresses, wallet, orders } = data;

  const orderColumns: DataTableColumn<AppUserOrder>[] = [
    {
      key: "orderNumber",
      header: "Order #",
      render: (o) => <span className="font-mono text-xs">{o.orderNumber}</span>,
    },
    {
      key: "orderDate",
      header: "Order Date",
      render: (o) => (
        <span className="text-sm text-muted-foreground">{formatDate(o.orderDate)}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (o) => (
        <span className="font-medium tabular-nums">{formatCurrency(o.totalPayable)}</span>
      ),
    },
    {
      key: "paymentMode",
      header: "Payment Mode",
      render: (o) => <StatusPill status={o.paymentMode.toLowerCase()} />,
    },
    {
      key: "paymentStatus",
      header: "Payment Status",
      render: (o) =>
        o.paymentStatus ? (
          <StatusPill status={o.paymentStatus.toLowerCase()} />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <StatusPill status={o.status.toLowerCase()} />,
    },
  ];

  const walletColumns: DataTableColumn<AppUserWalletTransaction>[] = [
    {
      key: "date",
      header: "Date",
      render: (t) => <span className="text-sm">{formatDateTime(t.createdAt)}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (t) => (
        <span
          className={cn(
            "text-sm font-semibold capitalize",
            t.type === "CREDIT" ? "text-success" : "text-destructive",
          )}
        >
          {t.type.toLowerCase()}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (t) => (
        <span
          className={cn(
            "font-medium tabular-nums",
            t.type === "CREDIT" ? "text-success" : "text-destructive",
          )}
        >
          {t.type === "CREDIT" ? "+" : "-"}
          {formatCurrency(t.amount)}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (t) => <span className="text-sm text-muted-foreground">{t.source}</span>,
    },
    {
      key: "balance",
      header: "Balance After",
      render: (t) => (
        <span className="font-medium tabular-nums">{formatCurrency(t.balanceAfter)}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {backButton}

      <Card>
        <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <AvatarChip name={profile.name} size="md" />
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{profile.name}</h1>
                {profile.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="destructive">Blocked</Badge>
                )}
                {!profile.isProfileComplete && <Badge variant="warning">Profile Incomplete</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {profile.mobile}
                </span>
                {profile.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" /> {profile.email}
                  </span>
                )}
                {profile.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {profile.city.name}
                  </span>
                )}
                {profile.dob && (
                  <span className="flex items-center gap-1.5">
                    <Cake className="size-3.5" /> {formatDate(profile.dob)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> Registered {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:border-l sm:border-border sm:pl-6">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Orders</span>
              <span className="text-lg font-bold tabular-nums">{formatNumber(orders.length)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Total Order Value</span>
              <span className="text-lg font-bold tabular-nums">
                {formatCurrency(totalOrderValue)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Wallet Balance</span>
              <span className="text-lg font-bold tabular-nums">
                {formatCurrency(wallet.balance)}
              </span>
            </div>
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3.5" /> Edit Customer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="wallet">Wallet Ledger</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="pt-1">
          {orders.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No orders yet"
              description="This customer hasn't placed any orders."
            />
          ) : (
            <DataTable columns={orderColumns} data={orders} rowKey={(o) => o.id} pageSize={8} />
          )}
        </TabsContent>

        <TabsContent value="wallet" className="pt-1">
          {wallet.transactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No wallet activity"
              description="No credits or debits recorded for this customer yet."
            />
          ) : (
            <DataTable
              columns={walletColumns}
              data={wallet.transactions}
              rowKey={(t) => t.id}
              pageSize={8}
            />
          )}
        </TabsContent>

        <TabsContent value="addresses" className="pt-1">
          {addresses.length === 0 ? (
            <EmptyState
              icon={Home}
              title="No saved addresses"
              description="This customer has not added a service address yet."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {addresses.map((address) => (
                <Card
                  key={address.id}
                  className={cn(address.isDefault && "border-primary/40 ring-1 ring-primary/15")}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base capitalize">
                      <Home className="size-4 text-muted-foreground" />
                      {address.type.toLowerCase()}
                      {address.isDefault && <Badge variant="gradient">Default</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1 pt-0 text-sm text-muted-foreground">
                    <span>{formatAddressLine(address)}</span>
                    {address.locality && <span>{address.locality}</span>}
                    {address.landmark && <span>Landmark: {address.landmark}</span>}
                    <span>
                      {address.city}, {address.state} - {address.pincode}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CustomerEditDialog open={editOpen} onOpenChange={setEditOpen} profile={profile} />
    </div>
  );
}

export { CustomerDetailPage };
