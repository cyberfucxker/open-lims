import { motion } from "framer-motion";
import { FlaskConical, ListChecks, UserPlus, UserSearch } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIONS = [
  {
    label: "Register Patient",
    description: "Add a new patient record",
    icon: UserPlus,
    to: "/admin/patients/register",
    color: "bg-primary",
  },
  {
    label: "Search Patients",
    description: "Find and manage records",
    icon: UserSearch,
    to: "/admin/patients/search",
    color: "bg-violet-500",
  },
  {
    label: "Add Test",
    description: "Create a new lab test",
    icon: FlaskConical,
    to: "/admin/tests/add",
    color: "bg-emerald-500",
  },
  {
    label: "Test Catalogue",
    description: "Browse all lab tests",
    icon: ListChecks,
    to: "/admin/tests",
    color: "bg-amber-500",
  },
];

function QuickActionsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to={action.to}
              className="group flex h-full flex-col gap-2.5 rounded-xl border border-border p-3.5 transition-colors hover:border-primary/30 hover:bg-accent/40"
            >
              <div
                className={`flex size-9 items-center justify-center rounded-lg text-white shadow-md transition-transform duration-200 group-hover:scale-110 ${action.color}`}
              >
                <action.icon className="size-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

export { QuickActionsWidget };
