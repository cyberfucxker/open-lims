import { useEffect, useState } from "react";

/** Search box state for the franchise lists: debounced so typing does not fire
 *  a request per keystroke, and resetting the page whenever the term changes so
 *  a filtered result set never opens on a page that no longer exists. */
export function useDebouncedSearch(delayMs = 300) {
  const [input, setInput] = useState("");
  const [value, setValue] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setValue(input.trim()), delayMs);
    return () => clearTimeout(timer);
  }, [input, delayMs]);

  useEffect(() => {
    setPage(1);
  }, [value]);

  function reset() {
    setInput("");
    setValue("");
    setPage(1);
  }

  return { input, setInput, value, page, setPage, reset };
}
