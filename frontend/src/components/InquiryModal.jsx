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
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi, I'm interested in this property..."
            rows="5"
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sky-200 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Inquiry"}
          </button>
        </div>
      </form>
    </Modal>
  );
}