import { CheckCheck, ChevronLeft, MoreVertical, Video, Phone as PhoneIcon } from "lucide-react";
import { Fragment } from "react";

import { PhoneFrame } from "./PhoneFrame";

function renderBodyWithVariables(body: string) {
  const parts = body.split(/(\{[a-zA-Z0-9_]+\})/g).filter((p) => p.length > 0);
  return parts.map((part, i) => {
    const isVariable = /^\{[a-zA-Z0-9_]+\}$/.test(part);
    return (
      <Fragment key={i}>
        {isVariable ? <span className="font-semibold text-emerald-900/90">{part}</span> : part}
      </Fragment>
    );
  });
}

// WhatsApp's own brand chrome (chat wallpaper / bubble tint) is deliberately
// hardcoded here rather than themed — this widget simulates a real WhatsApp
// screenshot, not this app's own surfaces.
function WhatsAppPreview({ body }: { body: string }) {
  return (
    <PhoneFrame statusBarClassName="bg-[#f0f0f0] text-slate-900">
      <div className="flex h-full flex-col bg-[#f0f0f0]">
        <div className="flex items-center gap-2 bg-[#075e54] px-3 py-2.5 text-white">
          <ChevronLeft className="size-4" />
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
            SL
          </div>
          <div className="flex-1 leading-tight">
            <p className="flex items-center gap-1 text-[13px] font-semibold">
              Example Diagnostics Lab
              <span className="rounded-full bg-white/15 px-1 py-px text-[8px] font-medium">
                Business
              </span>
            </p>
            <p className="text-[10px] text-white/70">online</p>
          </div>
          <VideoAndCallIcons />
        </div>

        <div className="flex-1 space-y-2 bg-[#e5ddd5] bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.035)_1px,transparent_0)] bg-[length:14px_14px] px-3 py-4">
          <div className="mx-auto w-fit rounded bg-[#e1f2fb] px-2.5 py-1 text-[10px] text-[#4a4a4a] shadow-sm">
            Today
          </div>

          <div className="flex justify-end">
            <div className="relative max-w-[82%] rounded-lg rounded-tr-none bg-[#dcf8c6] px-2.5 py-2 text-[12px] leading-snug text-[#1f2c33] shadow-sm">
              <p className="break-words whitespace-pre-wrap">
                {body
                  ? renderBodyWithVariables(body)
                  : "Your message body will appear here as you type…"}
              </p>
              <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-[#5c8a63]">
                <span>9:41 AM</span>
                <CheckCheck className="size-3 text-[#53bdeb]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-black/5 bg-[#f0f0f0] px-3 py-2">
          <div className="flex-1 rounded-full bg-white px-3 py-1.5 text-[11px] text-slate-400 shadow-sm">
            Type a message
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function VideoAndCallIcons() {
  return (
    <div className="flex items-center gap-3 text-white/90">
      <Video className="size-4" />
      <PhoneIcon className="size-3.5" />
      <MoreVertical className="size-4" />
    </div>
  );
}

export { WhatsAppPreview, renderBodyWithVariables };
