import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFamilyMembers } from "@/hooks/queries/useProfile";
import { useSubmitPrescription } from "@/hooks/queries/usePrescriptions";
import { EASE_OUT_EXPO } from "@/utils/motion";

import { PrescriptionDropzone } from "./PrescriptionDropzone";

const prescriptionSchema = z.object({
  family_member_id: z.string().min(1, "Please select a family member"),
  city_id: z.string().min(1, "Please select a city"),
  query: z.string().optional(),
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

function PrescriptionUploadCard() {
  const { data: familyData, isLoading: familyLoading } = useFamilyMembers();
  const submitMutation = useSubmitPrescription();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: { family_member_id: "", city_id: "", query: "" },
  });

  const cities = familyData?.city ?? [];

  const onSubmit = (values: PrescriptionFormValues) => {
    if (!file) {
      setFileError("Please attach a prescription file");
      return;
    }
    setFileError(null);
    submitMutation.mutate(
      {
        family_member_id: values.family_member_id,
        city_id: values.city_id,
        query: values.query || undefined,
        prescription_file: file,
      },
      {
        onSuccess: () => {
          reset({ family_member_id: "", city_id: "", query: "" });
          setFile(null);
        },
      },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="relative overflow-hidden rounded-[1.5rem] border border-border bg-card p-5 shadow-lg shadow-black/[0.04] sm:p-6"
    >
      <div
        aria-hidden
        className="absolute -top-24 -right-16 size-52 rounded-full bg-primary/[0.07] blur-3xl"
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15"
          >
            <Stethoscope className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-bold tracking-tight">Upload a prescription</h2>
            <p className="text-xs text-muted-foreground">We'll review it and call you back</p>
          </div>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <Controller
              control={control}
              name="family_member_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={familyLoading}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyData?.family_members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.relation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.family_member_id && (
              <p className="text-xs text-destructive">{errors.family_member_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>City</Label>
            <Controller
              control={control}
              name="city_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={familyLoading}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.city_id && <p className="text-xs text-destructive">{errors.city_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prescription-notes">Notes (optional)</Label>
            <Textarea
              id="prescription-notes"
              rows={3}
              placeholder="Anything the pharmacist or lab should know"
              className="resize-none"
              {...register("query")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Prescription photo</Label>
            <PrescriptionDropzone
              file={file}
              onChange={(next) => {
                setFile(next);
                if (next) setFileError(null);
              }}
              error={fileError}
              disabled={submitMutation.isPending}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {submitMutation.isPending ? "Submitting..." : "Submit Prescription"}
          </Button>

          <p className="inline-flex w-full items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Visible only to you and our clinical team
          </p>
        </form>
      </div>
    </motion.div>
  );
}

export { PrescriptionUploadCard };
