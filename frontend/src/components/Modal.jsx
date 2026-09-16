// Reusable modal/dialog "shell" used by InquiryModal and EditPropertyModal.
// It only handles the generic pop-up behaviour (dark overlay, box, close
// button, keyboard accessibility) - the caller passes in `children` for
// whatever form/content actually belongs inside.
import React, { useEffect, useRef, useId } from "react";

// CSS selector matching every element type a keyboard user could normally
// Tab to. Used below to find all the focusable things currently inside
// the modal so we can trap Tab/Shift+Tab within it.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Modal({ isOpen, onClose, title, children }) {
  // useRef gives us a plain mutable box that survives re-renders without
  // triggering one when it changes (unlike useState) - perfect for holding
  // a reference to a real DOM node or a value we just need to remember.
  const dialogRef = useRef(null); // the modal's outer <div>, once rendered
  const previouslyFocusedRef = useRef(null); // whatever was focused before opening
  // useId generates a unique, stable id for this component instance, so the
  // <h3> title and the dialog's aria-labelledby can reference each other
  // without risking a clash if two Modals ever rendered at once.
  const titleId = useId();

  // useEffect runs this block after the component renders, and again
  // whenever isOpen/onClose change. It's where we do "side effects" -
  // things that reach outside of just returning JSX, like listening for
  // keyboard events or moving focus around.
  useEffect(() => {
    // Nothing to set up while the modal is closed/not rendered.
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
    // The function returned from useEffect is its "cleanup" - React runs it
    // right before the effect re-runs, and again when the component
    // unmounts. Here that means: stop listening for keydown, and give
    // focus back to whatever the user was on before the modal opened.
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  // While closed, render nothing at all - no hidden DOM sitting around.
  if (!isOpen) return null;

  return (
    // Full-screen semi-transparent backdrop that centers the dialog box.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={dialogRef}
        // role="dialog" + aria-modal="true" tell assistive tech (like screen
        // readers) that this is a modal dialog sitting on top of the page,
        // and aria-labelledby points it at the <h3> below as the dialog's
        // accessible name/title.
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
            aria-label="Close dialog" /* screen readers announce this since the button's only visible content is the × glyph */
            className="text-fg-secondary hover:text-fg text-2xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            ×
          </button>
        </div>
        {/* Whatever the caller (InquiryModal, EditPropertyModal, ...) passed as children renders here */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
