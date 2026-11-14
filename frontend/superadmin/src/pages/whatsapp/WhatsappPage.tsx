import { AlertTriangle, Bot, CalendarCheck, MessagesSquare, UserRound } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useWhatsappStats } from "@/hooks/queries/useWhatsapp";
import { formatNumber } from "@/lib/format";

import { AiLogTab } from "./AiLogTab";
import { ConversationsTab } from "./ConversationsTab";
import { FollowUpsTab } from "./FollowUpsTab";
import { KnowledgeTab } from "./KnowledgeTab";
import { MappingTab } from "./MappingTab";
import { SettingsTab } from "./SettingsTab";
import { TryItTab } from "./TryItTab";

/** Conversations, handoffs and the AI log are open to managers granted the
 *  `whatsapp` module; settings, keys, knowledge, mapping and Try-it are
 *  admin only (the API enforces the same split). */
function WhatsappPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { data: stats } = useWhatsappStats();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="WhatsApp Assistant"
        description="AI booking assistant on your WhatsApp Business number — conversations, handoffs, knowledge and settings."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Conversations"
          value={formatNumber(stats?.conversations ?? 0)}
          icon={MessagesSquare}
          index={0}
        />
        <StatCard
          title="Waiting for a human"
          value={formatNumber(stats?.handoffs ?? 0)}
          icon={UserRound}
          index={1}
          alert={(stats?.handoffs ?? 0) > 0}
        />
        <StatCard
          title="AI replies (24h)"
          value={formatNumber(stats?.repliesToday ?? 0)}
          icon={Bot}
          index={2}
        />
        <StatCard
          title="Bookings (24h)"
          value={formatNumber(stats?.bookingsToday ?? 0)}
          icon={CalendarCheck}
          index={3}
          breakdown={
            stats?.errorsToday
              ? [{ label: "AI errors", value: String(stats.errorsToday), tone: "danger" }]
              : undefined
          }
        />
      </div>

      <Tabs defaultValue="conversations">
        <TabsList className="flex-wrap">
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="handoff">
            Handoff queue
            {(stats?.handoffs ?? 0) > 0 && (
              <AlertTriangle className="ml-1 size-3.5 text-amber-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="log">AI answer log</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-up reminders</TabsTrigger>
          {isAdmin && <TabsTrigger value="try">Try it</TabsTrigger>}
          {isAdmin && <TabsTrigger value="knowledge">Knowledge base</TabsTrigger>}
          {isAdmin && <TabsTrigger value="mapping">Concern mapping</TabsTrigger>}
          {isAdmin && <TabsTrigger value="settings">Settings & connection</TabsTrigger>}
        </TabsList>

        <TabsContent value="conversations" className="pt-1">
          <ConversationsTab view="all" />
        </TabsContent>
        <TabsContent value="handoff" className="pt-1">
          <ConversationsTab view="handoff" />
        </TabsContent>
        <TabsContent value="log" className="pt-1">
          <AiLogTab />
        </TabsContent>
        <TabsContent value="follow-ups" className="pt-1">
          <FollowUpsTab />
        </TabsContent>
        {isAdmin && (
          <>
            <TabsContent value="try" className="pt-1">
              <TryItTab />
            </TabsContent>
            <TabsContent value="knowledge" className="pt-1">
              <KnowledgeTab />
            </TabsContent>
            <TabsContent value="mapping" className="pt-1">
              <MappingTab />
            </TabsContent>
            <TabsContent value="settings" className="pt-1">
              <SettingsTab />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

export { WhatsappPage };
