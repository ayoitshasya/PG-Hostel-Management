// Popup form (built on the generic Modal shell) that lets a logged-in
// tenant send an inquiry message to a property's owner. Rendered from
// ListingDetail.jsx when the tenant clicks "Send Inquiry".
import React, { useState } from "react";
import Modal from "./Modal";
import { createInquiry } from "../api/inquiries";

// propertyId: which listing this inquiry is about.
// onSuccess: callback the parent passes in so it can react afterwards
// (e.g. show a confirmation, refresh data) once the inquiry is sent.
export default function InquiryModal({ isOpen, onClose, propertyId, onSuccess }) {
  // useState gives each of these a current value plus a setter function;
  // calling the setter re-renders the component with the new value. This
  // is a "controlled" textarea - the message state is the single source
  // of truth, and the textarea always reflects it (see value={message}
  // below).
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // true while the request is in flight
  const [error, setError] = useState(null); // holds an error message to display, if any

  // Runs when the form is submitted (Enter key or clicking "Send Inquiry").
  async function handleSubmit(e) {
    // Forms reload the page by default on submit - this stops that so we
    // can handle it with JavaScript/Axios instead.
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter a message");
      return; // stop here - don't hit the API with an empty message
    }

    setLoading(true);
    setError(null);
    try {
      // Send the inquiry to the backend (POST /api/inquiries - see
      // frontend/src/api/inquiries.js). `await` pauses this function
      // until the request finishes, without blocking the rest of the app.
      await createInquiry({ propertyId, message: message.trim() });
      setMessage(""); // clear the textarea for next time
      onSuccess(); // let the parent screen know it worked
      onClose(); // close the modal
    } catch (err) {
      // Show the backend's error message if it sent one, otherwise a
      // generic fallback (e.g. for a network failure with no response).
      setError(err.response?.data?.error || "Failed to send inquiry");
    } finally {
      // Runs whether the request succeeded or failed - always stop
      // showing the loading state.
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Inquiry">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* `error && <div>...</div>` only renders the div when error is
            truthy - a common JSX shorthand for "render this if condition".
            role="alert" tells screen readers to announce it immediately. */}
        {error && <div className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</div>}

        <div>
          <label htmlFor="inquiry-message" className="block text-sm font-medium text-fg mb-2">
            Your Message
          </label>
          <textarea
            id="inquiry-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi, I'm interested in this property..."
            rows="5"
            className="w-full bg-surface text-fg border border-border rounded-sm px-4 py-3 focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-sm text-fg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-accent text-accent-fg rounded-sm hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {loading ? "Sending..." : "Send Inquiry"}
          </button>
        </div>
      </form>
    </Modal>
  );
}