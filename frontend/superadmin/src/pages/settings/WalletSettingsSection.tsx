import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CashbackRule {
  id: string;
  spendAmount: number;
  cashbackPct: number;
}

interface RechargeSlab {
  id: string;
  amount: number;
  bonus: number;
}

let ruleSeq = 100;
let slabSeq = 100;

function WalletSettingsSection() {
  const [minRecharge, setMinRecharge] = useState(100);
  const [cashbackRules, setCashbackRules] = useState<CashbackRule[]>([
    { id: "r1", spendAmount: 1000, cashbackPct: 2 },
    { id: "r2", spendAmount: 2500, cashbackPct: 4 },
    { id: "r3", spendAmount: 5000, cashbackPct: 6 },
  ]);
  const [rechargeSlabs, setRechargeSlabs] = useState<RechargeSlab[]>([
    { id: "s1", amount: 500, bonus: 0 },
    { id: "s2", amount: 1000, bonus: 50 },
    { id: "s3", amount: 2500, bonus: 150 },
    { id: "s4", amount: 5000, bonus: 400 },
  ]);

  function addCashbackRule() {
    ruleSeq += 1;
    setCashbackRules((prev) => [...prev, { id: `r${ruleSeq}`, spendAmount: 0, cashbackPct: 0 }]);
  }

  function removeCashbackRule(id: string) {
    setCashbackRules((prev) => prev.filter((r) => r.id !== id));
  }

  function updateCashbackRule(id: string, patch: Partial<CashbackRule>) {
    setCashbackRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addSlab() {
    slabSeq += 1;
    setRechargeSlabs((prev) => [...prev, { id: `s${slabSeq}`, amount: 0, bonus: 0 }]);
  }

  function removeSlab(id: string) {
    setRechargeSlabs((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSlab(id: string, patch: Partial<RechargeSlab>) {
    setRechargeSlabs((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function handleSave() {
    toast.success("Wallet settings saved successfully.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Settings</CardTitle>
        <CardDescription>
          System defaults for wallet recharge, cashback and bonus slabs.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <Label htmlFor="min-recharge">Minimum Recharge Amount (₹)</Label>
          <Input
            id="min-recharge"
            type="number"
            value={minRecharge}
            onChange={(e) => setMinRecharge(Number(e.target.value))}
          />
        </div>

        <div className="border-t border-border pt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Cashback Rules</h3>
              <p className="text-xs text-muted-foreground">
                Spend threshold on an order unlocks a wallet cashback percentage.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={addCashbackRule}
            >
              <Plus className="size-4" />
              Add Rule
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {cashbackRules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-secondary/20 p-3"
              >
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Spend Amount (₹)</Label>
                  <Input
                    type="number"
                    className="w-36"
                    value={rule.spendAmount}
                    onChange={(e) =>
                      updateCashbackRule(rule.id, { spendAmount: Number(e.target.value) })
                    }
                  />
                </div>
                <span className="pb-2.5 text-sm text-muted-foreground">get</span>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Cashback %</Label>
                  <Input
                    type="number"
                    className="w-28"
                    value={rule.cashbackPct}
                    onChange={(e) =>
                      updateCashbackRule(rule.id, { cashbackPct: Number(e.target.value) })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={() => removeCashbackRule(rule.id)}
                  aria-label="Remove rule"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {cashbackRules.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No cashback rules configured.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recharge Offer Slabs</h3>
              <p className="text-xs text-muted-foreground">
                Default bonus credited on top of a recharge amount.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addSlab}>
              <Plus className="size-4" />
              Add Slab
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {rechargeSlabs.map((slab) => (
              <div
                key={slab.id}
                className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-secondary/20 p-3"
              >
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Recharge Amount (₹)</Label>
                  <Input
                    type="number"
                    className="w-36"
                    value={slab.amount}
                    onChange={(e) => updateSlab(slab.id, { amount: Number(e.target.value) })}
                  />
                </div>
                <span className="pb-2.5 text-sm text-muted-foreground">bonus</span>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Bonus (₹)</Label>
                  <Input
                    type="number"
                    className="w-28"
                    value={slab.bonus}
                    onChange={(e) => updateSlab(slab.id, { bonus: Number(e.target.value) })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={() => removeSlab(slab.id)}
                  aria-label="Remove slab"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {rechargeSlabs.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No recharge slabs configured.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-5">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { WalletSettingsSection };
