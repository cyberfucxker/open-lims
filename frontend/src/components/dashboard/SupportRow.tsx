import { useState } from "react";
import { motion } from "framer-motion";
import {
  Facebook,
  HelpCircle,
  Instagram,
  Linkedin,
  MessageCircle,
  Star,
  Twitter,
  Youtube,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";

const CONTACT_LINKS = [
  { label: "Video Tutorial", icon: Youtube, href: "#", color: "bg-red-500" },
  { label: "WhatsApp", icon: MessageCircle, href: "#", color: "bg-emerald-500" },
  { label: "Help Center", icon: HelpCircle, href: "#", color: "bg-sky-500" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", icon: Facebook, href: "#" },
  { label: "Twitter", icon: Twitter, href: "#" },
  { label: "Instagram", icon: Instagram, href: "#" },
  { label: "LinkedIn", icon: Linkedin, href: "#" },
  { label: "YouTube", icon: Youtube, href: "#" },
];

function ContactSupportCard() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Contact Support</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {CONTACT_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="group flex items-center gap-2.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-accent/40"
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg text-white transition-transform duration-200 group-hover:scale-110",
                link.color,
              )}
            >
              <link.icon className="size-3.5" />
            </span>
            {link.label}
          </a>
        ))}
      </CardContent>
    </Card>
  );
}

function ReviewCard() {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Give Us a Review</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-2 text-center">
        <p className="text-xs text-muted-foreground">Your feedback helps us improve</p>
        <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              type="button"
              whileTap={{ scale: 0.85 }}
              onMouseEnter={() => setHovered(star)}
              onClick={() => setSelected(star)}
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "size-6 transition-colors",
                  (hovered || selected) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-muted-foreground/50",
                )}
              />
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FollowUsCard() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Follow Us</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center gap-2.5">
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            aria-label={link.label}
            className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <link.icon className="size-4" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
}

function SupportRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <ContactSupportCard />
      <ReviewCard />
      <FollowUsCard />
    </div>
  );
}

export { SupportRow };
