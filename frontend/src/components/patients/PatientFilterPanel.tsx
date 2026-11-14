import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/common/DatePicker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS } from "@/data/departments";
import { DOCTORS } from "@/data/doctors";
import { FRANCHISES } from "@/data/franchises";
import type { PatientSearchFilters } from "@/types/patient";

interface PatientFilterPanelProps {
  filters: PatientSearchFilters;
  onChange: (filters: PatientSearchFilters) => void;
  onReset: () => void;
}

const STATUSES = ["Registered", "Sample Collected", "Processing", "Completed", "Authorized"];
const PATIENT_TYPES = ["Retail", "B2B"];

function PatientFilterPanel({ filters, onChange, onReset }: PatientFilterPanelProps) {
  const set = <K extends keyof PatientSearchFilters>(key: K, value: PatientSearchFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Patient Name"
          value={filters.query ?? ""}
          onChange={(e) => set("query", e.target.value)}
        />
        <Input
          placeholder="Patient ID"
          value={filters.patientId ?? ""}
          onChange={(e) => set("patientId", e.target.value)}
        />
        <Input
          placeholder="Mobile"
          value={filters.mobile ?? ""}
          onChange={(e) => set("mobile", e.target.value)}
        />
        <DatePicker
          value={filters.dateFrom}
          onChange={(v) => set("dateFrom", v)}
          placeholder="Registered from"
        />

        <Select value={filters.doctor ?? "all"} onValueChange={(v) => set("doctor", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Doctor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Doctors</SelectItem>
            {DOCTORS.map((d) => (
              <SelectItem key={d.id} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.franchise ?? "all"} onValueChange={(v) => set("franchise", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Franchise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Franchises</SelectItem>
            {FRANCHISES.map((f) => (
              <SelectItem key={f.id} value={f.name}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.department ?? "all"} onValueChange={(v) => set("department", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status ?? "all"} onValueChange={(v) => set("status", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.patientType ?? "all"} onValueChange={(v) => set("patientType", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Patient Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PATIENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" variant="ghost" onClick={onReset} className="text-muted-foreground">
          <RotateCcw className="size-3.5" /> Reset filters
        </Button>
      </div>
    </motion.div>
  );
}

export { PatientFilterPanel };
