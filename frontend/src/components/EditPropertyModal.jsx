// Popup form (built on the generic Modal shell) that lets a renter edit a
// few key fields of a listing they own - title, description, price,
// status - without leaving the dashboard. Rendered from
// RenterDashboard.jsx / ListingDetail.jsx's "Edit Property" action.
import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { updateProperty } from "../api/properties";

// `property`: the listing being edited, passed in by the parent so this
// modal can be pre-filled with its current values.
export default function EditPropertyModal({ isOpen, onClose, property, onSuccess }) {
  // Local form state - starts empty and gets filled in by the effect
  // below once `property` is available (this modal can mount before the
  // property data has loaded).
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("available");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Whenever the `property` prop changes (e.g. the modal is opened for a
  // different listing, or the data finishes loading), copy its values
  // into the form fields above. Without this, the form would just stay
  // blank/stale after the first render.
  useEffect(() => {
    if (property) {
      setTitle(property.title || "");
      setDescription(property.description || "");
      setPrice(property.price || "");
      setStatus(property.status || "available");
    }
  }, [property]);

  // Runs when the form is submitted (Enter key or clicking "Save Changes").
  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser's default full-page-reload submit
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // PUT the changed fields to the backend (see
      // frontend/src/api/properties.js). Price is converted to a Number
      // (form inputs are always strings) or left undefined if blank, so
      // the backend doesn't try to save an empty string as a price.
      await updateProperty(property._id, {
        title: title.trim(),
        description: description.trim(),
        price: price ? Number(price) : undefined,
        status,
      });
      onSuccess(); // let the parent screen know it worked (e.g. refetch)
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update property");
    } finally {
      setLoading(false); // always stop loading, success or failure
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Property">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</div>}

        <div>
          <label htmlFor="edit-title" className="block text-sm font-medium text-fg mb-2">
            Property Name
          </label>
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface text-fg border border-border rounded-sm px-4 py-3 focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="edit-description" className="block text-sm font-medium text-fg mb-2">
            Description
          </label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            className="w-full bg-surface text-fg border border-border rounded-sm px-4 py-3 focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-price" className="block text-sm font-medium text-fg mb-2">
              Price (per month)
            </label>
            <input
              id="edit-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-surface text-fg border border-border rounded-sm px-4 py-3 focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="edit-status" className="block text-sm font-medium text-fg mb-2">
              Status
            </label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-surface text-fg border border-border rounded-sm px-4 py-3 focus:ring-2 focus:ring-accent/40 focus:border-accent focus:outline-none"
            >
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </div>
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
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}