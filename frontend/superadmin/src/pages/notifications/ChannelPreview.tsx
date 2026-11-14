import {
  ChevronLeft,
  FlaskConical,
  Mail,
  MoreVertical,
  Phone as PhoneIcon,
  Video,
} from "lucide-react";

import type { NotificationChannel } from "@/lib/types";

import { PhoneFrame } from "./PhoneFrame";
import { renderBodyWithVariables, WhatsAppPreview } from "./WhatsAppPreview";

function PushPreview({ body, title }: { body: string; title: string }) {
  return (
    <PhoneFrame statusBarClassName="bg-slate-950 text-white">
      <div className="flex h-full flex-col justify-start bg-slate-800 px-3 pt-10">
        <p className="mb-3 text-center text-4xl font-light text-white">9:41</p>
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-white">
              <FlaskConical className="size-3.5" />
            </div>
            <span className="text-[11px] font-semibold text-white/90">Open LIMS</span>
            <span className="ml-auto text-[10px] text-white/60">now</span>
          </div>
          <p className="mt-1.5 text-[12px] font-semibold text-white">{title}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/80">
            {body
              ? renderBodyWithVariables(body)
              : "Your push notification message will appear here…"}
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}

function SmsPreview({ body }: { body: string }) {
  return (
    <PhoneFrame statusBarClassName="bg-white text-slate-900">
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <ChevronLeft className="size-4 text-slate-500" />
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600">
            SL
          </div>
          <div className="flex-1 leading-tight">
            <p className="text-[13px] font-semibold text-slate-900">Open LIMS</p>
            <p className="text-[10px] text-slate-400">SMS</p>
          </div>
          <PhoneIcon className="size-3.5 text-slate-400" />
          <Video className="size-4 text-slate-400" />
        </div>
        <div className="flex-1 space-y-2 bg-slate-50 px-3 py-4">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-200 px-3 py-2 text-[12px] leading-snug text-slate-800 shadow-sm">
            {body ? renderBodyWithVariables(body) : "Your SMS message will appear here…"}
          </div>
          <p className="text-center text-[9px] text-slate-400">Delivered · 9:41 AM</p>
        </div>
      </div>
    </PhoneFrame>
  );
}

function EmailPreview({ body, subject }: { body: string; subject: string }) {
  return (
    <PhoneFrame statusBarClassName="bg-white text-slate-900">
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <ChevronLeft className="size-4 text-slate-500" />
          <span className="flex-1 text-[12px] font-semibold text-slate-900">Inbox</span>
          <MoreVertical className="size-4 text-slate-400" />
        </div>
        <div className="border-b border-border px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
              SL
            </div>
            <div className="leading-tight">
              <p className="text-[12px] font-semibold text-slate-900">Example Diagnostics Lab</p>
              <p className="text-[10px] text-slate-400">to me</p>
            </div>
            <Mail className="ml-auto size-3.5 text-slate-300" />
          </div>
          <p className="mt-2 text-[13px] font-semibold text-slate-900">
            {subject || "Notification from Open LIMS"}
          </p>
        </div>
        <div className="flex-1 px-3 py-3 text-[12px] leading-relaxed text-slate-700">
          {body ? renderBodyWithVariables(body) : "Your email body will appear here…"}
        </div>
      </div>
    </PhoneFrame>
  );
}

interface ChannelPreviewProps {
  channel: NotificationChannel;
  body: string;
  title?: string;
}

function ChannelPreview({ channel, body, title = "Open LIMS" }: ChannelPreviewProps) {
  if (channel === "whatsapp") return <WhatsAppPreview body={body} />;
  if (channel === "sms") return <SmsPreview body={body} />;
  if (channel === "email") return <EmailPreview body={body} subject={title} />;
  return <PushPreview body={body} title={title} />;
}

export { ChannelPreview };
