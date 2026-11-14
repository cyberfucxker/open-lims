import { useState } from "react";
import { Info, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Platform = "ios" | "android";

interface PlatformConfig {
  currentLiveVersion: string;
  minSupportedVersion: string;
  rolloutPct: number;
}

const INITIAL_CONFIG: Record<Platform, PlatformConfig> = {
  ios: { currentLiveVersion: "2.4.1", minSupportedVersion: "2.2.0", rolloutPct: 100 },
  android: { currentLiveVersion: "2.4.3", minSupportedVersion: "2.3.0", rolloutPct: 75 },
};

function AppVersionSection() {
  const [platform, setPlatform] = useState<Platform>("ios");
  const [config, setConfig] = useState<Record<Platform, PlatformConfig>>(INITIAL_CONFIG);

  const current = config[platform];

  function updateCurrent(patch: Partial<PlatformConfig>) {
    setConfig((prev) => ({ ...prev, [platform]: { ...prev[platform], ...patch } }));
  }

  function handlePublish() {
    toast.success(
      `Version config published for ${platform === "ios" ? "iOS" : "Android"} — min supported ${current.minSupportedVersion}, rollout ${current.rolloutPct}%.`,
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Version / Force Update</CardTitle>
        <CardDescription>
          Control the minimum app version allowed and stage rollouts by platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-info" />
          <p>
            This is the config the mobile app reads on launch to decide whether to force an
            update. Any installed build below the{" "}
            <span className="font-medium">Minimum Supported Version</span> will be blocked with a
            mandatory update prompt. This backend endpoint does not exist yet — this panel gives it
            a UI home ahead of the API being wired up.
          </p>
        </div>

        <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
          <TabsList>
            <TabsTrigger value="ios">iOS</TabsTrigger>
            <TabsTrigger value="android">Android</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Current Live Version</Label>
            <div className="flex h-11 items-center rounded-lg border border-input bg-secondary/30 px-3.5 text-sm text-muted-foreground">
              <Badge variant="secondary" className="font-mono">
                v{current.currentLiveVersion}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="min-version">Minimum Supported Version</Label>
            <Input
              id="min-version"
              className="font-mono"
              value={current.minSupportedVersion}
              onChange={(e) => updateCurrent({ minSupportedVersion: e.target.value })}
              placeholder="2.2.0"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="rollout-pct">Update Rollout %</Label>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {current.rolloutPct}%
            </span>
          </div>
          <input
            id="rollout-pct"
            type="range"
            min={0}
            max={100}
            step={5}
            value={current.rolloutPct}
            onChange={(e) => updateCurrent({ rolloutPct: Number(e.target.value) })}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
          />
          <p className="text-xs text-muted-foreground">
            Percentage of {platform === "ios" ? "iOS" : "Android"} users prompted to update to the
            latest build right now.
          </p>
        </div>

        <div className="flex justify-end border-t border-border pt-5">
          <Button className="gap-1.5" onClick={handlePublish}>
            <Rocket className="size-4" />
            Publish Version Config
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { AppVersionSection };
