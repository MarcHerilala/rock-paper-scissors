import { useEffect, useRef } from "react";

export const useAnimationFrame = (
  callback: (deltaTime: number) => void,
  shouldAnimate: boolean = false
) => {
  const frameRef = useRef<number | null>(null);
  const timeRef = useRef<number | undefined>(undefined);



  useEffect(() => {
      const animate = (time: number) => {
    if (timeRef.current !== undefined) {
      const deltaTime = time - timeRef.current;
      callback(deltaTime);
    }

    timeRef.current = time;
    frameRef.current = requestAnimationFrame(animate);
  };
    if (shouldAnimate) {
      frameRef.current = requestAnimationFrame(animate);
    } else if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [shouldAnimate,callback]); // 🔹 Ne pas inclure `callback` pour éviter des rendus inutiles
};
