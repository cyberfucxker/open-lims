import { useCallback, useState } from "react";

/** Simple boolean toggle hook, used for the show/hide password control. */
export function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((prev) => !prev), []);
  return [value, toggle];
}
