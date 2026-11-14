import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { mobileNumberField } from "@/utils/mobileNumberField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddFamilyMember } from "@/hooks/queries/useProfile";
import type { FamilyMemberRelation, FamilyMemberResult } from "@/types";

const RELATIONS: Exclude<FamilyMemberRelation, "Self">[] = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Other",
];

/** Relations with an unambiguous gender auto-select the Gender field the
 *  moment they're picked (still freely overridable afterward) — "Spouse"
 *  and "Other" cover both genders, so those two deliberately leave Gender
 *  wherever the patient last set it instead of guessing. */
const GENDER_BY_RELATION: Partial<Record<(typeof RELATIONS)[number], "Male" | "Female">> = {
  Father: "Male",
  Son: "Male",
  Brother: "Male",
  Mother: "Female",
  Daughter: "Female",
  Sister: "Female",
};

const familyMemberSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    mobile_no: z
      .string()
      .optional()
      .refine((v) => !v || /^\d{10}$/.test(v), "Enter a valid 10-digit mobile number"),
    dob: z.string().optional(),
    age: z
      .string()
      .optional()
      .refine((v) => !v || (/^\d+$/.test(v) && Number(v) <= 120), "Enter a valid age"),
    relation: z.enum([
      "Father",
      "Mother",
      "Spouse",
      "Son",
      "Daughter",
      "Brother",
      "Sister",
      "Other",
    ]),
    gender: z.enum(["Male", "Female", "Other"]),
  })
  .refine((data) => !!data.dob || !!data.age, {
    // Surfaced as the hint line under the two fields, which is already on
    // screen before anyone submits — see its comment in the JSX below.
    message: "Fill either date of birth or age",
    path: ["dob"],
  });
type FamilyMemberFormValues = z.infer<typeof familyMemberSchema>;

interface AddFamilyMemberSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the newly created member once the add succeeds — lets
   *  callers (e.g. the checkout family picker) select the member they just
   *  added directly, without waiting on/guessing at a list refetch. */
  onAdded?: (member: FamilyMemberResult) => void;
}

function AddFamilyMemberSheet({ open, onOpenChange, onAdded }: AddFamilyMemberSheetProps) {
  const addMutation = useAddFamilyMember();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FamilyMemberFormValues>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      name: "",
      mobile_no: "",
      dob: "",
      age: "",
      relation: "Father",
      gender: "Male",
    },
  });

  const relation = useWatch({ control, name: "relation" });
  useEffect(() => {
    const inferred = GENDER_BY_RELATION[relation];
    if (inferred) setValue("gender", inferred);
    // Only react to the patient actually changing Relation — re-running on
    // every render would fight a manual Gender override for Spouse/Other.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relation]);

  const onSubmit = (values: FamilyMemberFormValues) => {
    addMutation.mutate(
      {
        name: values.name,
        mobile_no: values.mobile_no || undefined,
        dob: values.dob || undefined,
        age: values.age ? Number(values.age) : undefined,
        relation: values.relation,
        gender: values.gender,
      },
      {
        onSuccess: (member) => {
          reset();
          onOpenChange(false);
          onAdded?.(member);
        },
      },
    );
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add Family Member"
      desktopVariant="drawer"
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Decoration, not a control — `alt=""` so a screen reader skips
            straight to the first field instead of announcing a picture that
            adds nothing the sheet's own title has not already said. */}
        <img
          src="/family-profile.jpeg"
          alt=""
          aria-hidden
          // Not cropped to a circle: the artwork's own blue disc stops short of
          // the frame, so a round mask left a white sliver around it. Its white
          // field sits on the sheet's own white surface instead.
          className="mx-auto size-28 object-contain"
        />
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input {...register("name")} placeholder="Full name" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Mobile Number (optional)</Label>
          <Input
            {...mobileNumberField(register("mobile_no"))}
            placeholder="10-digit mobile number"
          />
          {errors.mobile_no && (
            <p className="text-xs text-destructive">{errors.mobile_no.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Date of Birth</Label>
            <Input type="date" {...register("dob")} />
          </div>
          <div className="space-y-1.5">
            <Label>Age</Label>
            <Input
              type="number"
              min={0}
              max={120}
              {...register("age")}
              placeholder="Years"
              inputMode="numeric"
            />
          </div>
        </div>
        {/* Standing hint, not an error that only appears once you've already
            been refused. Both fields used to say "(optional)" while the form
            rejected leaving both blank — the label was the part that was
            wrong: a lab report prints age-banded reference ranges, so one of
            the two has to be known. Turns red on a failed submit rather than
            appearing out of nowhere. */}
        <p
          className={cn("-mt-2 text-xs", errors.dob ? "text-destructive" : "text-muted-foreground")}
        >
          Fill either one — reports use age for reference ranges.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Relation</Label>
            <Controller
              control={control}
              name="relation"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={addMutation.isPending}>
          {addMutation.isPending ? "Adding..." : "Add Family Member"}
        </Button>
      </form>
    </BottomSheet>
  );
}

export { AddFamilyMemberSheet };
