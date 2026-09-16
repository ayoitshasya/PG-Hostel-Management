import React, { useEffect, useRef, useId } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Modal({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    // Remember what had focus before the modal opened, so it can be
    // restored when the modal closes (keyboard users shouldn't lose
    // their place in the page).
    previouslyFocusedRef.current = document.activeElement;

    const dialogNode = dialogRef.current;
    const getFocusable = () =>
      Array.from(dialogNode.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );

    const initial = getFocusable();
    (initial[0] || dialogNode).focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      // Trap focus inside the modal: Tab from the last focusable element
      // wraps to the first, Shift+Tab from the first wraps to the last -
      // otherwise Tab would escape into the (supposedly hidden) page
      // behind the modal.
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-surface text-fg rounded-md shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto focus:outline-none"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 id={titleId} className="text-xl font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-fg-secondary hover:text-fg text-2xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
