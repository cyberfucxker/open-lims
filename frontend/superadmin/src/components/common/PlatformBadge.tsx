import { Badge } from "@/components/ui/badge";

type Platform = "ANDROID" | "IOS" | "WEB" | "WHATSAPP";

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; variant: "success" | "secondary" | "outline" }
> = {
  ANDROID: { label: "Android", variant: "success" },
  IOS: { label: "iOS", variant: "secondary" },
  WEB: { label: "Web", variant: "outline" },
  WHATSAPP: { label: "WhatsApp", variant: "success" },
};

function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export { PlatformBadge };
