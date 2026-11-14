import { useRef, useState } from "react";
import { ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function GeneralSection() {
  const [appName, setAppName] = useState("Open LIMS");
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [supportPhone, setSupportPhone] = useState("+91 98765 43210");
  const [supportEmail, setSupportEmail] = useState("support@example.com");
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("20:00");
  const [daysOpen, setDaysOpen] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleDay(day: string) {
    setDaysOpen((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function handleSave() {
    toast.success("General settings saved successfully.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>
          App identity, support contact and business hours shown to patients.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="app-name">App Name</Label>
            <Input
              id="app-name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Open LIMS"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                <ImageIcon className="size-5" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="flex-1 justify-start gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" />
                <span className="truncate">{logoFileName ?? "Choose logo file..."}</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setLogoFileName(e.target.files?.[0]?.name ?? null)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="support-phone">Support Phone</Label>
            <Input
              id="support-phone"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="support-email">Support Email</Label>
            <Input
              id="support-email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@example.com"
            />
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Business Hours</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="open-time">Opens At</Label>
              <Input
                id="open-time"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="close-time">Closes At</Label>
              <Input
                id="close-time"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Label>Days Open</Label>
            <div className="flex flex-wrap gap-4">
              {WEEKDAYS.map((day) => (
                <label key={day} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={daysOpen.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-5">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { GeneralSection };
