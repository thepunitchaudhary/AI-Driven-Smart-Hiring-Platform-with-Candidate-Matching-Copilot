import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const listeners = new Set();
let nextId = 0;

export function toast(message, tone = "success") {
  const item = { id: ++nextId, message, tone };
  listeners.forEach((listener) => listener(item));
  return item.id;
}

const ICONS = {
  success: CheckCircle2,
  danger: AlertTriangle,
  warn: AlertTriangle,
  info: Info,
};

export function Toaster() {
  const [items, setItems] = useState([]);
  const timers = useRef([]);

  useEffect(() => {
    function listener(item) {
      setItems((list) => [...list.slice(-2), item]);
      const timer = setTimeout(() => {
        setItems((list) => list.filter((entry) => entry.id !== item.id));
      }, 4200);
      timers.current.push(timer);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  function dismiss(id) {
    setItems((list) => list.filter((entry) => entry.id !== id));
  }

  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((item) => {
        const Icon = ICONS[item.tone] || Info;
        return (
          <div className={"toast " + item.tone} key={item.id}>
            <span className="toast-icon"><Icon size={17} /></span>
            <p>{item.message}</p>
            <button
              type="button"
              className="icon-btn toast-close"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
