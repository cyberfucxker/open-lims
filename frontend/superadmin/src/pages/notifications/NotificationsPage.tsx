import { useMemo, useState } from "react";
import { isThisMonth } from "date-fns";
import { BellRing, CheckCircle2, Clock3, FileText } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/format";
import { notificationCampaigns, notificationTemplates } from "@/lib/mock";
import type { UserAppNotificationCampaign, UserAppNotificationTemplate } from "@/lib/types";

import { HistoryTab } from "./HistoryTab";
import { SendNotificationTab } from "./SendNotificationTab";
import { TemplatesTab } from "./TemplatesTab";

function NotificationsPage() {
  const [templates, setTemplates] = useState<UserAppNotificationTemplate[]>(notificationTemplates);
  const [campaigns, setCampaigns] = useState<UserAppNotificationCampaign[]>(notificationCampaigns);

  const stats = useMemo(() => {
    const approved = templates.filter((t) => t.approval === "approved").length;
    const pending = templates.filter((t) => t.approval === "pending").length;
    const sentThisMonth = campaigns.filter((c) => isThisMonth(new Date(c.sentAt))).length;
    return { total: templates.length, approved, pending, sentThisMonth };
  }, [templates, campaigns]);

  function handleTemplateSave(template: UserAppNotificationTemplate, isNew: boolean) {
    setTemplates((prev) =>
      isNew ? [template, ...prev] : prev.map((t) => (t.id === template.id ? template : t)),
    );
  }

  function handleCampaignSend(campaign: UserAppNotificationCampaign) {
    setCampaigns((prev) => [campaign, ...prev]);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Notifications & WhatsApp Templates"
        description="Build message templates, broadcast campaigns, and track delivery across push, SMS, WhatsApp and email."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Templates"
          value={formatNumber(stats.total)}
          icon={FileText}
          gradient="bg-primary"
          index={0}
        />
        <StatCard
          title="Approved Templates"
          value={formatNumber(stats.approved)}
          icon={CheckCircle2}
          gradient="bg-emerald-500"
          index={1}
        />
        <StatCard
          title="Pending Approval"
          value={formatNumber(stats.pending)}
          icon={Clock3}
          gradient="bg-amber-500"
          index={2}
          alert={stats.pending > 0}
        />
        <StatCard
          title="Campaigns Sent (This Month)"
          value={formatNumber(stats.sentThisMonth)}
          icon={BellRing}
          gradient="bg-sky-500"
          index={3}
        />
      </div>

      <Tabs defaultValue="templates" className="gap-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="send">Send Notification</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <TemplatesTab templates={templates} onSave={handleTemplateSave} />
        </TabsContent>

        <TabsContent value="send">
          <SendNotificationTab templates={templates} onSend={handleCampaignSend} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab campaigns={campaigns} templates={templates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { NotificationsPage };
