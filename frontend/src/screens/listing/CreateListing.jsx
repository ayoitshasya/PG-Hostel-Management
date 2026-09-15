import React, { useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import { uploadPropertyPhotos } from "../../api/uploads";
import useListingOptions from "../../hooks/useListingOptions";
import Seo from "../../components/Seo";

const MAX_UPLOAD_MB = 8;

export default function CreateListing() {
  const nav = useNavigate();
  const { options, loading: optionsLoading } = useListingOptions();

  // Stepper
  const steps = ["Basic", "Amenities", "Rooms & Pricing", "Photos", "Location & Contact"];
  const [step, setStep] = useState(0);

  // Basic info
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [description, setDescription] = useState("");

  // Amenities: array of selected canonical slugs (from GET /api/meta/options),
  // matching Find.jsx's filter state so the same values round-trip cleanly.
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Rooms
  const [rooms, setRooms] = useState([
    { name: "A1", price: "", occupancy: 1, availableFrom: "", status: "available" },
  ]);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("INR");

  // Photos: manually pasted URLs (photos: [String] on Property) and real
  // uploads processed server-side into WebP variants (photoAssets on
  // Property). Both are optional and both can be used together.
  const [photoUrls, setPhotoUrls] = useState([]);
  const [uploadedAssets, setUploadedAssets] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  // Location & contact
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [status, setStatus] = useState("available");
  const [mealsProvided, setMealsProvided] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // helpers
  function toggleAmenity(value) {
    setSelectedAmenities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  }

  function addRoom() {
    setRooms((r) => [...r, { name: `R${r.length + 1}`, price: "", occupancy: 1, availableFrom: "", status: "available" }]);
  }
  function updateRoom(i, patch) {
    setRooms((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeRoom(i) {
    setRooms((r) => r.filter((_, idx) => idx !== i));
  }

  function addPhotoUrl(url) {
    if (!url) return;
    setPhotoUrls((p) => [...p, url]);
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file(s) again later
    if (!files.length) return;

    const oversized = files.find((f) => f.size > MAX_UPLOAD_MB * 1024 * 1024);
    if (oversized) {
      setUploadError(`"${oversized.name}" is over ${MAX_UPLOAD_MB}MB - please use a smaller image.`);
      return;
    }

    setUploadError(null);
    setUploading(true);
    setUploadProgress(0);
    try {
      const assets = await uploadPropertyPhotos(files, setUploadProgress);
      setUploadedAssets((p) => [...p, ...assets]);
    } catch (err) {
      setUploadError(err.response?.data?.error || "Upload failed - check your connection and try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function removeUploadedAsset(idx) {
    setUploadedAssets((p) => p.filter((_, i) => i !== idx));
  }
  function removePhotoUrl(idx) {
    setPhotoUrls((p) => p.filter((_, i) => i !== idx));
  }

  function validateStep() {
    setError(null);
    if (step === 0) {
      if (!title.trim()) { setError("Property name is required."); return false; }
      if (!propertyType) { setError("Please select a property type."); return false; }
    } else if (step === 2) {
      const hasRoomWithPrice = rooms.some((r) => r.price && Number(r.price) > 0);
      if (!hasRoomWithPrice) { setError("Please add at least one room with price."); return false; }
    } else if (step === 4) {
      if (!address.trim()) { setError("Please provide location address."); return false; }
    }
    return true;
  }

  async function handleNext() {
    if (!validateStep()) return;
    if (step < steps.length - 1) setStep((s) => s + 1);
  }
  function handleBack() {
    setError(null);
    if (step > 0) setStep((s) => s - 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateStep()) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      propertyType,
      targetAudience,
      furnishing,
      petsAllowed,
      mealsProvided,
      amenities: selectedAmenities,
      rooms: rooms.map((r) => ({
        name: r.name,
        price: Number(r.price || 0),
        occupancy: Number(r.occupancy || 1),
        availableFrom: r.availableFrom || undefined,
        status: r.status || "available",
      })),
      totalRooms: rooms.length,
      occupancyPerRoom: rooms[0]?.occupancy || 1,
      price: price ? Number(price) : (rooms[0] ? Number(rooms[0].price || 0) : 0),
      currency,
      photos: photoUrls,
      photoAssets: uploadedAssets,
      status,
      location: {
        address: address.trim(),
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        googleMapsUrl: googleMapsUrl || undefined,
      },
    };

    setLoading(true);
    setError(null);
    try {
      const res = await API.post("/properties", payload);
      const created = res.data;
      setSuccessMsg("Property created successfully.");

      const id = created._id || created.id || (res.data && res.data._id);
      if (id) {
        setTimeout(() => nav(`/listing/${id}`), 700);
      } else {
        setTimeout(() => nav("/renter-dashboard"), 700);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create property.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] max-w-6xl mx-auto px-6 py-10">
      <Seo title="List Your Property" description="List your PG, hostel, or apartment on Roomie in a few steps." noindex />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">List Your Property</h1>
        <p className="text-sm text-slate-500 mt-1">Fill details about your property in a few steps</p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-6 border-b border-slate-100 pb-4 mb-6" aria-label="Form steps">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3" aria-current={i === step ? "step" : undefined}>
            <div
              aria-hidden="true"
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                ${i === step ? "bg-primary-dark text-white" : i < step ? "bg-slate-200 text-slate-700" : "bg-white text-slate-500 border border-slate-200"}`}
            >
              {i + 1}
            </div>
            <div className={`text-sm ${i === step ? "text-primary-dark font-medium" : "text-slate-600"}`}>{s}</div>
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
        {/* Error / Success */}
        {error && <div className="mb-4 text-sm text-red-600" role="alert">{error}</div>}
        {successMsg && <div className="mb-4 text-sm text-green-700" role="status">{successMsg}</div>}

        {/* Step content */}
        {step === 0 && (
          <div className="space-y-4">
            <label className="block">
              <div className="text-sm font-medium text-slate-700">Property Name</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Cozy Student Residence" className="mt-2 w-full border border-slate-200 rounded-md px-4 py-3 focus:ring-2 focus:ring-sky-200" />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label>
                <div className="text-sm font-medium text-slate-700">Property Type</div>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-3">
                  <option value="">Select Property Type</option>
                  {options.propertyTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label>
                <div className="text-sm font-medium text-slate-700">Target Audience</div>
                <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-3">
                  <option value="">Select Target Audience</option>
                  {options.audiences.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <div className="text-sm font-medium text-slate-700">Property Description</div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your property in detail" rows="6" className="mt-2 w-full border border-slate-200 rounded-md px-4 py-3 focus:ring-2 focus:ring-sky-200" />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="text-sm text-slate-700 font-medium">Amenities</div>
            {optionsLoading && <div className="text-sm text-slate-500">Loading amenities...</div>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {options.amenities.map(a => (
                <label key={a.value} className="flex items-center gap-3 bg-slate-50 rounded-md px-3 py-2 border border-transparent hover:border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={selectedAmenities.includes(a.value)} onChange={() => toggleAmenity(a.value)} />
                  <span className="text-sm text-slate-700">{a.label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <label>
                <div className="text-sm font-medium text-slate-700">Furnishing</div>
                <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-3">
                  <option value="">Select Furnishing</option>
                  {options.furnishing.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </label>

              <label>
                <div className="text-sm font-medium text-slate-700">Meals Provided</div>
                <select value={mealsProvided ? "yes" : "no"} onChange={(e) => setMealsProvided(e.target.value === "yes")} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-3">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} />
                <span className="text-sm text-slate-700">Pets Allowed</span>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-700">Rooms & Pricing</div>
              <button type="button" onClick={addRoom} className="text-sm bg-primary-dark text-white px-3 py-1 rounded">Add Room</button>
            </div>

            <div className="space-y-4">
              {rooms.map((r, i) => (
                <fieldset key={i} className="border border-slate-100 p-4 rounded-md">
                  <legend className="flex items-center justify-between w-full px-0">
                    <span className="font-medium">Room {i + 1}</span>
                  </legend>
                  <div className="flex justify-end -mt-8 mb-2">
                    <button type="button" onClick={() => removeRoom(i)} className="text-sm text-red-600">
                      Remove room {i + 1}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <label className="block">
                      <span className="sr-only">Room {i + 1} name</span>
                      <input value={r.name} onChange={(e) => updateRoom(i, { name: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-2" placeholder="Room name (A1)" />
                    </label>
                    <label className="block">
                      <span className="sr-only">Room {i + 1} price per month</span>
                      <input value={r.price} onChange={(e) => updateRoom(i, { price: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-2" placeholder="Price per month" />
                    </label>
                    <label className="block">
                      <span className="sr-only">Room {i + 1} occupancy</span>
                      <input value={r.occupancy} onChange={(e) => updateRoom(i, { occupancy: e.target.value })} type="number" className="w-full border border-slate-200 rounded px-3 py-2" placeholder="Occupancy" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <label className="block">
                      <span className="sr-only">Room {i + 1} available from</span>
                      <input value={r.availableFrom} onChange={(e) => updateRoom(i, { availableFrom: e.target.value })} type="date" className="w-full border border-slate-200 rounded px-3 py-2" />
                    </label>
                    <label className="block">
                      <span className="sr-only">Room {i + 1} status</span>
                      <select value={r.status} onChange={(e) => updateRoom(i, { status: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-2">
                        <option value="available">Available</option>
                        <option value="booked">Booked</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </label>
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="mt-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Default Price (optional)</span>
                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Default price e.g. 6000" className="mt-2 w-48 border border-slate-200 rounded px-3 py-2" />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="photo-url-input" className="text-sm font-medium text-slate-700">Add Photos (URLs)</label>
              <div className="flex gap-2 mt-2">
                <input placeholder="https://..." className="flex-1 border border-slate-200 rounded px-3 py-2" id="photo-url-input" />
                <button type="button" onClick={()=>{
                  const el = document.getElementById("photo-url-input");
                  if(el?.value) {
                    addPhotoUrl(el.value.trim());
                    el.value = "";
                  }
                }} className="px-3 py-2 bg-slate-800 text-white rounded">Add</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {photoUrls.map((u, idx) => (
                  <div key={idx} className="w-28 h-20 rounded overflow-hidden relative border">
                    <img src={u} alt={`photo-${idx}`} className="w-full h-full object-cover" />
                    <button onClick={() => removePhotoUrl(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="photo-file-input" className="text-sm font-medium text-slate-700">Upload photos</label>
              <input
                id="photo-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="mt-2 disabled:opacity-50"
              />

              {uploading && (
                <div className="mt-3" role="status" aria-live="polite">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-dark transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Uploading... {uploadProgress}%</div>
                </div>
              )}

              {uploadError && (
                <div className="text-sm text-red-600 mt-2" role="alert">{uploadError}</div>
              )}

              <div className="mt-3 flex flex-wrap gap-3">
                {uploadedAssets.map((asset, idx) => {
                  const smallest = [...asset.variants].sort((a, b) => a.width - b.width)[0];
                  return (
                    <div key={idx} className="w-28 h-20 rounded overflow-hidden relative border">
                      <img src={smallest.url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeUploadedAsset(idx)}
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 text-xs"
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                JPEG, PNG, or WebP, up to {MAX_UPLOAD_MB}MB each. Resized and optimized automatically.
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label>
                <div className="text-sm font-medium text-slate-700">Address</div>
                <input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="Near X, City" className="mt-2 w-full border border-slate-200 rounded px-3 py-2" />
              </label>
              <label>
                <div className="text-sm font-medium text-slate-700">Google Maps URL</div>
                <input value={googleMapsUrl} onChange={(e)=>setGoogleMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." className="mt-2 w-full border border-slate-200 rounded px-3 py-2" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="block">
                <span className="sr-only">Latitude</span>
                <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="Latitude" className="w-full border border-slate-200 rounded px-3 py-2" />
              </label>
              <label className="block">
                <span className="sr-only">Longitude</span>
                <input value={lng} onChange={e=>setLng(e.target.value)} placeholder="Longitude" className="w-full border border-slate-200 rounded px-3 py-2" />
              </label>
              <label className="block">
                <span className="sr-only">Listing status</span>
                <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2">
                  {options.statuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-4">
                <span className="text-sm font-medium">Currency</span>
                <select value={currency} onChange={(e)=>setCurrency(e.target.value)} className="border border-slate-200 rounded px-3 py-2">
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {step > 0 && <button type="button" onClick={handleBack} className="px-4 py-2 border rounded-md">Back</button>}
          </div>

          <div className="flex items-center gap-3">
            {step < steps.length - 1 ? (
              <button type="button" onClick={handleNext} className="px-5 py-2 bg-primary-dark text-white rounded-md">Next</button>
            ) : (
              <button type="submit" disabled={loading} className="px-5 py-2 bg-primary-dark text-white rounded-md">
                {loading ? "Creating..." : "Create listing"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
