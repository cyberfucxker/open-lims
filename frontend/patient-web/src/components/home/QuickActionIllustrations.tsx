import { motion } from "framer-motion";

/** Hand-drawn flat-style illustrations for the home page's quick-action tiles —
 *  inline SVG (no external assets) so each action reads as a distinct little
 *  scene instead of a single-tone glyph. A couple of small parts loop gently
 *  via framer-motion for a touch of life at rest, on top of the tile's own
 *  hover/tap animation in `QuickActions.tsx`. */

interface IllustrationProps {
  className?: string;
}

export function HomeCollectionIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <path d="M8 22 24 9l16 13v15a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" fill="#FEE2E2" />
      <path
        d="M6 23 24 8l18 15"
        stroke="#EF4444"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="19.5" y="30" width="9" height="9" rx="1.5" fill="#F87171" />
      <rect x="14" y="24" width="5.5" height="5.5" rx="1" fill="#93C5FD" />
      <motion.g
        animate={{ y: [0, -1.5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="34.5" cy="33.5" r="7" fill="white" stroke="#DC2626" strokeWidth="1.5" />
        <path
          d="M34.5 29.5v8M30.5 33.5h8"
          stroke="#DC2626"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </motion.g>
    </svg>
  );
}

export function LabVisitIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <path
        d="M19 7h10v9.5l7.5 15A4 4 0 0 1 32.9 37H15.1a4 4 0 0 1-3.6-5.5L19 16.5z"
        fill="#E0F2FE"
        stroke="#0284C7"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M17 6.5h14" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M14.5 27.5c1.8-1.2 3.6-1.2 5.4 0s3.6 1.2 5.4 0 3.6-1.2 5.4 0 3.2 1.1 4.8.4l1.5 3.1c-2.4 1-4.6.9-6.7-.3-1.8-1.1-3.5-1.1-5.2 0-2 1.3-4 1.3-6 0-1.7-1.1-3.4-1.1-5.1 0z"
        fill="#2DD4BF"
      />
      <motion.circle
        cx="23"
        cy="21"
        r="1.6"
        fill="white"
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="27.5"
        cy="24"
        r="1.1"
        fill="white"
        animate={{ opacity: [0.2, 0.9, 0.2], y: [0, -2.5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </svg>
  );
}

export function NearestLabIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <motion.ellipse
        cx="24"
        cy="40"
        rx="8"
        ry="2.2"
        fill="#DDD6FE"
        animate={{ scaleX: [1, 1.25, 1], opacity: [0.7, 0.35, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <path
        d="M24 6c-7.2 0-13 5.8-13 13 0 9.5 13 22 13 22s13-12.5 13-22c0-7.2-5.8-13-13-13z"
        fill="#8B5CF6"
      />
      <circle cx="24" cy="19" r="8" fill="white" />
      <path
        d="M19 21.5v-4.2L24 14l5 3.3v4.2"
        stroke="#7C3AED"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <rect x="21.3" y="18.5" width="5.4" height="3.6" rx="0.6" fill="#C4B5FD" />
    </svg>
  );
}

export function ReportsIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <path
        d="M12 6h17l7 7v27a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
        fill="#FEF3C7"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M29 6v7h7"
        fill="#FDE68A"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 22h11M15.5 27h15M15.5 32h9"
        stroke="#D97706"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 260, damping: 14 }}
      >
        <circle cx="35" cy="35" r="7.5" fill="#10B981" stroke="white" strokeWidth="1.5" />
        <path
          d="M31.7 35.2l2 2 3.6-4.4"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>
    </svg>
  );
}

export function OrdersIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <rect
        x="11"
        y="9"
        width="26"
        height="33"
        rx="3"
        fill="#D1FAE5"
        stroke="#059669"
        strokeWidth="1.8"
      />
      <rect
        x="18"
        y="6"
        width="12"
        height="6"
        rx="2"
        fill="#34D399"
        stroke="#059669"
        strokeWidth="1.5"
      />
      <rect x="16" y="19" width="5" height="5" rx="1.2" fill="#059669" />
      <path
        d="M17.3 21.5l1 1 1.8-2.2"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24 21.5h8.5" stroke="#047857" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="16" y="27.5" width="5" height="5" rx="1.2" fill="#059669" />
      <path
        d="M17.3 30l1 1 1.8-2.2"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24 30h8.5" stroke="#047857" strokeWidth="1.8" strokeLinecap="round" />
      <rect
        x="16"
        y="35.5"
        width="5"
        height="5"
        rx="1.2"
        fill="white"
        stroke="#10B981"
        strokeWidth="1.5"
      />
      <motion.path
        d="M24 38h8.5"
        stroke="#A7F3D0"
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

export function PrescriptionIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <path
        d="M13 8h16l6 6v25a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"
        fill="#E0F2FE"
        stroke="#0284C7"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M29 8v6h6"
        fill="#BAE6FD"
        stroke="#0284C7"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 22v11.5M16.5 22h3.4a3 3 0 1 1 0 6h-3.4M19.5 28l4 5.5"
        stroke="#0284C7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 37.5h11" stroke="#7DD3FC" strokeWidth="1.8" strokeLinecap="round" />
      <motion.g
        animate={{ y: [0, -2.5, 0] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="35" cy="14" r="8" fill="#0EA5E9" stroke="white" strokeWidth="1.5" />
        <path
          d="M35 18v-8M31.5 13.5 35 10l3.5 3.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>
    </svg>
  );
}
