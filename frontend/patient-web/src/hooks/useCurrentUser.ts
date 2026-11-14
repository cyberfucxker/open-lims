import { useProfile } from "@/hooks/queries/useProfile";
import { useAuth } from "@/hooks/useAuth";

export interface CurrentUserIdentity {
  /** Full name, or null when the account has none on record yet. */
  name: string | null;
  /** First word of the name — for compact spots like the navbar trigger. */
  firstName: string | null;
  mobile: string | null;
  avatarUrl: string | null;
  /** 1–2 uppercase letters, or "" when there's no name to derive them from. Callers should
   *  render an icon rather than inventing a placeholder letter when this is empty. */
  initials: string;
}

function computeInitials(name: string | null): string {
  if (!name) return "";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Resolves the signed-in patient's display identity for chrome like the navbar.
 *
 *  The auth store can't be the source of truth here: `POST /verify-otp` returns only
 *  `{ id, mobile, is_profile_complete }`, so OtpPage seeds `name: null` and it stays null
 *  until the patient happens to open Edit Profile — which is why the navbar avatar used to
 *  render a hardcoded "U" for everyone. `GET /user/profile` is the authoritative record and
 *  ProfilePage already keeps it in the react-query cache under ["profile"], so reading it
 *  here adds no request of its own. The store's copy stays as a fallback for the brief
 *  window before that query settles. */
export function useCurrentUser(): CurrentUserIdentity {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const name = profile?.name?.trim() || user?.name?.trim() || null;

  return {
    name,
    firstName: name ? name.trim().split(/\s+/)[0] : null,
    mobile: profile?.mobile ?? user?.mobile ?? null,
    avatarUrl: profile?.profile_pic ?? null,
    initials: computeInitials(name),
  };
}
