import { cn } from "@/utils/cn";

/** The two illustrated avatars live in `public/`, so they are referenced by URL
 *  rather than imported — swapping the artwork is dropping a new file in, with
 *  no rebuild of an import graph. Both are square with a circular coloured
 *  field already painted in, which is why a caller gives this a round,
 *  fully-filled slot and no background of its own. */
const GENDER_AVATAR: Record<"male" | "female", string> = {
  male: "/man.png",
  female: "/woman.png",
};

interface GenderAvatarIconProps {
  /** `ProfileResult.sex` / `FamilyMemberResult.gender` — loosely typed since
   *  both are plain `string | null` on the wire. */
  gender?: string | null;
  className?: string;
}

/** The fallback shown wherever a person — the account holder or a family
 *  member — has no uploaded photo of their own yet. A plain initial letter
 *  reads as a placeholder for text, not a person; this reads as one.
 *
 *  Only "male" and "female" get an illustration. Anything else — "Other", or
 *  a profile that simply has not said — keeps the neutral silhouette below
 *  rather than being shown as a man: these avatars are detailed enough to be
 *  read as a statement about the person, and picking one for somebody who
 *  never told us is exactly the kind of small wrongness a patient notices on
 *  their own profile. The silhouette is solid `currentColor`, so it still
 *  takes the tint of whatever it is dropped into (a family member's
 *  per-relation colour, the profile card's own ring). */
function GenderAvatarIcon({ gender, className }: GenderAvatarIconProps) {
  const key = gender?.trim().toLowerCase();
  const src = key === "male" || key === "female" ? GENDER_AVATAR[key] : null;

  // Both branches fill the slot the caller gives them, so a caller sizes one
  // round box and does not have to know which of the two shapes it will get.
  // The illustration goes edge to edge because its own coloured field IS the
  // circle; the silhouette is inset, because a glyph pushed to the rim of its
  // container reads as cropped rather than as an avatar.
  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        // `object-cover` on an already-square source crops nothing; it is here
        // so a replacement file that is not square still fills the slot
        // instead of letter-boxing inside it.
        className={cn("size-full rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span className={cn("flex size-full items-center justify-center", className)} aria-hidden>
      <svg viewBox="0 0 48 48" fill="none" className="size-[62%]">
        <circle cx="24" cy="16" r="7" fill="currentColor" />
        <path d="M16 25a18 18 0 0 1 16 0l5 15H11z" fill="currentColor" />
      </svg>
    </span>
  );
}

export { GenderAvatarIcon };
