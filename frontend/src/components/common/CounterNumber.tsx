import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

interface CounterNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/** Animates a number counting up/down to `value` whenever it changes. */
function CounterNumber({
  value,
  duration = 1.1,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CounterNumberProps) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString("en-IN", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export { CounterNumber };
