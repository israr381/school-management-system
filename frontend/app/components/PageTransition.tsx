import { useEffect, useRef, useState } from "react";
import { useLocation, useOutlet } from "react-router";

interface PageTransitionProps {
  context: unknown;
}

export default function PageTransition({ context }: PageTransitionProps) {
  const location = useLocation();
  const outlet = useOutlet(context);
  const [displayed, setDisplayed] = useState(outlet);
  const [phase, setPhase] = useState<"in" | "out" | "idle">("in");
  const pathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== pathRef.current) {
      setPhase("out");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (phase === "idle") {
      setDisplayed(outlet);
      pathRef.current = location.pathname;
    }
  }, [outlet, location.pathname, phase]);

  const handleAnimationEnd = () => {
    if (phase === "out") {
      pathRef.current = location.pathname;
      setDisplayed(outlet);
      setPhase("in");
      return;
    }
    if (phase === "in") {
      setPhase("idle");
    }
  };

  const animationClass =
    phase === "out" ? "page-fade-out" : phase === "in" ? "page-fade-in" : "";

  return (
    <div className={animationClass} onAnimationEnd={handleAnimationEnd}>
      {displayed}
    </div>
  );
}
