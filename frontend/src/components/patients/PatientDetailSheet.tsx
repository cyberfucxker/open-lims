import { Mail, MapPin, Phone, Stethoscope } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Patient } from "@/types/patient";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface PatientDetailSheetProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PatientDetailSheet({ patient, open, onOpenChange }: PatientDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-lg">
        {patient && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="text-base">
                    {initials(patient.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle>{patient.fullName}</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    {patient.patientId} · {patient.gender}, {patient.age}y
                  </p>
                </div>
                <StatusBadge status={patient.status} className="ml-auto" />
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" /> {patient.mobile}
                </div>
                {patient.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-4" /> {patient.email}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                  <MapPin className="size-4" /> {patient.addressLine}, {patient.city},{" "}
                  {patient.state} - {patient.pincode}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Stethoscope className="size-4" /> {patient.doctor}
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Registration
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Franchise</p>
                    <p className="font-medium text-foreground">{patient.franchise}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium text-foreground">{patient.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Registered On</p>
                    <p className="font-medium text-foreground">{patient.registrationDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Patient Type</p>
                    <p className="font-medium text-foreground">{patient.patientType}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Tests ({patient.tests.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {patient.tests.map((t) => (
                    <div
                      key={t.testId}
                      className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm"
                    >
                      <span>{t.name}</span>
                      <span className="font-medium">₹{t.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Amount</span>
                  <span className="font-medium text-foreground">
                    ₹{patient.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Paid</span>
                  <span className="font-medium text-emerald-600">
                    ₹{patient.paidAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Due</span>
                  <span className="font-medium text-amber-600">
                    ₹{patient.dueAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <Badge variant="secondary" className="mt-1 w-fit">
                  Payment: {patient.paymentStatus}
                </Badge>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export { PatientDetailSheet };
