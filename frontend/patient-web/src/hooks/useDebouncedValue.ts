import { useEffect, useState } from "react";

/** Delays reflecting `value` until it's stayed still for `delayMs` — use to
 *  keep a search-as-you-type input from firing a server request per keystroke. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
