import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Camera, Loader2, User } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/services/api/authApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";

const CITY_OPTIONS = [
  { value: "jaipur", label: "Jaipur" },
  { value: "udaipur", label: "Udaipur" },
];

const TODAY = format(new Date(), "yyyy-MM-dd");

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  sex: z.enum(["Male", "Female", "Other"], { required_error: "Select your sex." }),
  dob: z
    .string()
    .min(1, "Select your date of birth.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()) && new Date(value) <= new Date(), {
      message: "Enter a valid date of birth.",
    }),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  city: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function CompleteProfilePage() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", dob: "", email: "" },
  });

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await authApi.completeProfile({
        name: values.name,
        sex: values.sex,
        d_o_b: values.dob,
        email: values.email || undefined,
        patient_city: values.city,
        profile_photo: photoFile ?? undefined,
      });
      updateUser({ isProfileComplete: true, name: values.name });
      toast.success("Profile completed successfully.");
      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.";
      toast.error(message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-xl">Complete your profile</CardTitle>
          <CardDescription>
            A few details help us personalise your reports and bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Avatar className="size-24 border-2 border-border">
                  {photoPreview && <AvatarImage src={photoPreview} alt="Profile preview" />}
                  <AvatarFallback>
                    <User className="size-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload profile photo"
                  className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-background transition-transform active:scale-95"
                >
                  <Camera className="size-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">Add a profile photo (optional)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="e.g. Priya Sharma"
                autoComplete="name"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Controller
                  control={control}
                  name="sex"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="sex" aria-invalid={!!errors.sex}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.sex && <p className="text-sm text-destructive">{errors.sex.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  max={TODAY}
                  aria-invalid={!!errors.dob}
                  {...register("dob")}
                />
                {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City (optional)</Label>
              <Controller
                control={control}
                name="city"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITY_OPTIONS.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save &amp; Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { CompleteProfilePage };
