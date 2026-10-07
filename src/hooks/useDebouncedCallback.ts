import { useRef, useCallback, useEffect } from "react";

/**
 * Возвращает функцию, которая откладывает вызов callback
 * до тех пор, пока не пройдёт delay миллисекунд без новых вызовов.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<number | null>(null);

  // Всегда держим актуальный callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}