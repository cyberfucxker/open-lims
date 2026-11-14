import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/queries/useProfile";

const profileEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]).optional(),
});
type ProfileEditValues = z.infer<typeof profileEditSchema>;

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  defaultEmail: string;
}

function EditProfileSheet({
  open,
  onOpenChange,
  defaultName,
  defaultEmail,
}: EditProfileSheetProps) {
  const updateMutation = useUpdateProfile();
  const { updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    values: { name: defaultName, email: defaultEmail },
  });

  const onSubmit = (values: ProfileEditValues) => {
    updateMutation.mutate(
      { name: values.name, email: values.email || undefined },
      {
        onSuccess: () => {
          updateUser({ name: values.name });
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Edit Profile">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Name</Label>
          <Input id="profile-name" {...register("name")} placeholder="Full name" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            type="email"
            {...register("email")}
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </BottomSheet>
  );
}

export { EditProfileSheet };
