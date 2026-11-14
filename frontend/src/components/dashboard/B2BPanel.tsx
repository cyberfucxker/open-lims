import { motion } from "framer-motion";
import { Building2, HandCoins, ReceiptText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface B2BPanelProps {
  business: number;
  collection: number;
  due: number;
}

function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

const ROWS = [
  {
    key: "business" as const,
    label: "Business",
    icon: Building2,
    color: "bg-violet-500",
  },
  {
    key: "collection" as const,
    label: "Collection",
    icon: HandCoins,
    color: "bg-emerald-500",
  },
  { key: "due" as const, label: "Due", icon: ReceiptText, color: "bg-rose-500" },
];

function B2BPanel({ business, collection, due }: B2BPanelProps) {
  const values = { business, collection, due };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">B2B Business</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center gap-2.5">
        {ROWS.map((row, i) => (
          <motion.div
            key={row.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2.5"
          >
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${row.color} text-white shadow-sm`}
            >
              <row.icon className="size-4" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
            <span className="ml-auto text-sm font-bold text-navy-950">
              {formatInr(values[row.key])}
            </span>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

export { B2BPanel };
