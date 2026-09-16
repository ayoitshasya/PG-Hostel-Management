import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { updateProperty } from "../api/properties";

export default function EditPropertyModal({ isOpen, onClose, property, onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("available");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (property) {
      setTitle(property.title || "");
      setDescription(property.description || "");
      setPrice(property.price || "");
      setStatus(property.status || "available");
    }
  }, [property]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateProperty(property._id, {
        title: title.trim(),
        description: description.trim(),
        price: price ? Number(price) : undefined,
        status,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update property");
    } finally {
      setLoading(false);
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