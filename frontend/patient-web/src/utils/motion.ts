/** Shared easing curve for entrance animations across the account pages, so hero bands,
 *  stat tiles and list cards all decelerate on the same curve. Matches the `--animate-*`
 *  keyframe easings declared in styles/globals.css. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
