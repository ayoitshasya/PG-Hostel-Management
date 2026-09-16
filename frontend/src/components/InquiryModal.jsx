import React, { useState } from "react";
import Modal from "./Modal";
import { createInquiry } from "../api/inquiries";

export default function InquiryModal({ isOpen, onClose, propertyId, onSuccess }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createInquiry({ propertyId, message: message.trim() });
      setMessage("");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send inquiry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Inquiry">
      <form onSubmit={handleSubmit} className="space-y-4">
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