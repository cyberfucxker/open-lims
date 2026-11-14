import { useEffect, useState } from "react";
import { Copy, Eye, EyeOff, Info } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePaymentGatewayConfig,
  useUpdatePaymentGatewayConfig,
} from "@/hooks/queries/usePaymentGatewayConfig";

const WEBHOOK_URL = "https://api.example.com/v1/app/webhooks/razorpay";

function MaskedField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10 font-mono"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide value" : "Reveal value"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function PaymentGatewaySection() {
  const { data: config, isLoading } = usePaymentGatewayConfig();
  const updateConfig = useUpdatePaymentGatewayConfig();

  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");

  useEffect(() => {
    if (config) {
      setKeyId(config.razorpayKeyId ?? "");
    }
  }, [config]);

  function handleCopyWebhook() {
    navigator.clipboard.writeText(WEBHOOK_URL);
    toast.success("Webhook URL copied to clipboard.");
  }

  function handleSave() {
    if (!keyId.trim()) {
      toast.error("Razorpay Key ID is required.");
      return;
    }
    updateConfig.mutate(
      { razorpayKeyId: keyId.trim(), razorpayKeySecret: keySecret.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Payment gateway settings saved successfully.");
          setKeySecret("");
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to save."),
      },
    );
  }

  const isTestMode = keyId.startsWith("rzp_test_");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Gateway</CardTitle>
        <CardDescription>
          Razorpay credentials used for wallet recharge and order payments in the patient app.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rzp-key-id">Razorpay Key ID</Label>
            <Input
              id="rzp-key-id"
              className="font-mono"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="rzp_test_xxxxxxxxxxxx"
            />
          </div>
          <MaskedField
            id="rzp-key-secret"
            label="Razorpay Key Secret"
            value={keySecret}
            onChange={setKeySecret}
            placeholder={
              config?.razorpayKeySecretConfigured
                ? `Currently set (${config.razorpayKeySecretMasked}) — leave blank to keep`
                : "Not set yet"
            }
          />
        </div>

        {keyId && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Mode (derived from Key ID):</span>
            <Badge variant={isTestMode ? "secondary" : "default"}>
              {isTestMode ? "Test" : "Live"}
            </Badge>
          </div>
        )}

        <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-info" />
          <p>
            Webhook signature verification isn't wired up yet — only the Create Order/Verify flow is
            live right now. This URL is shown for reference; registering it in the Razorpay
            dashboard won't do anything until the webhook handler is enabled.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <div className="flex items-center gap-2">
            <Input
              id="webhook-url"
              readOnly
              value={WEBHOOK_URL}
              className="font-mono text-xs text-muted-foreground"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopyWebhook}
              aria-label="Copy webhook URL"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-5">
          <Button onClick={handleSave} disabled={updateConfig.isPending}>
            {updateConfig.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { PaymentGatewaySection };
