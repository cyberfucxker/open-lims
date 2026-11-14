import { useCallback, useRef } from "react";
import type { KeyboardEvent } from "react";

/**
 * ARIA radiogroup keyboard pattern: only the active item is a tab stop,
 * Arrow keys move selection + focus within the group.
 */
export function useRovingTabIndex<T extends HTMLElement = HTMLButtonElement>(
  length: number,
  activeIndex: number,
  onChange: (index: number) => void,
) {
  const itemRefs = useRef<(T | null)[]>([]);

  const setRef = useCallback(
    (index: number) => (el: T | null) => {
      itemRefs.current[index] = el;
    },
    [],
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: setRef(index),
      tabIndex: index === activeIndex ? 0 : -1,
      onKeyDown: (e: KeyboardEvent<T>) => {
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + length) % length;
        else return;
        e.preventDefault();
        onChange(next);
        itemRefs.current[next]?.focus();
      },
    }),
    [length, activeIndex, onChange, setRef],
  );

  return { getItemProps };
}
