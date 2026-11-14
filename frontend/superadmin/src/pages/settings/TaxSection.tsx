import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

function TaxSection() {
  const [gstPercentage, setGstPercentage] = useState(18);
  const [gstNumber, setGstNumber] = useState("00AAAAA0000A1Z0");
  const [inclusive, setInclusive] = useState(true);
  const [invoiceFooter, setInvoiceFooter] = useState(
    "This is a computer-generated invoice and does not require a signature. For queries, contact support@example.com.",
  );

  function handleSave() {
    toast.success("Tax settings saved successfully.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax / GST Settings</CardTitle>
        <CardDescription>
          Configure how GST is applied and displayed across invoices.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gst-pct">GST Percentage (%)</Label>
            <Input
              id="gst-pct"
              type="number"
              value={gstPercentage}
              onChange={(e) => setGstPercentage(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gst-number">GST Number</Label>
            <Input
              id="gst-number"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              className="font-mono"
              placeholder="00AAAAA0000A1Z0"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Prices are GST-inclusive</p>
            <p className="text-xs text-muted-foreground">
              Displayed test/package prices already include GST.
            </p>
          </div>
          <Switch checked={inclusive} onCheckedChange={setInclusive} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invoice-footer">Invoice Footer Note</Label>
          <Textarea
            id="invoice-footer"
            rows={3}
            value={invoiceFooter}
            onChange={(e) => setInvoiceFooter(e.target.value)}
            placeholder="Note printed at the bottom of every generated invoice."
          />
        </div>

        <div className="flex justify-end border-t border-border pt-5">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { TaxSection };
