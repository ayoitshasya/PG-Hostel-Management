// The "List Your Property" wizard - a renter fills this out to publish a
// new Property. It's a 5-step form (Basic -> Amenities -> Rooms & Pricing ->
// Photos -> Location & Contact); all the data is kept in this one
// component's state and only assembled into a single POST /api/properties
// request on final submit (nothing is saved between steps).
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

  // Stepper: `step` is just an index into `steps`, controlling which
  // section of the form is rendered below and which step marker is
  // highlighted in the progress bar.
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

  // Rooms: a property can have multiple rooms, each with its own
  // price/occupancy/availability - starts with one blank room by default.
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
  const [city, setCity] = useState("");
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

  // ---- helpers ----

  // Adds/removes one amenity slug from the selected list.
  function toggleAmenity(value) {
    setSelectedAmenities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  }

  // Appends a new blank room row, auto-naming it "R<n>" so it doesn't
  // collide with the default "A1" or previously added rooms.
  function addRoom() {
    setRooms((r) => [...r, { name: `R${r.length + 1}`, price: "", occupancy: 1, availableFrom: "", status: "available" }]);
  }
  // Merges a partial update into one room by index (e.g. updateRoom(0, { price: "5000" })).
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

  // Handles the <input type="file"> change event for real photo uploads:
  // validates file size client-side, then sends the files to the backend's
  // image pipeline (resize/optimize/store) via uploadPropertyPhotos().
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
      // setUploadProgress is passed straight through as the progress
      // callback, so uploadPropertyPhotos can report upload % as it happens.
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

  // Checks only the fields relevant to the *current* step before letting
  // the user move forward - not a full-form validation, since later steps
  // haven't been filled in yet at this point.
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

  // Final submit - runs on the last step only. Builds one Property payload
  // out of all the state collected across every step, then POSTs it.
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateStep()) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      propertyType,
      // These selects all have an unselected "" default and none are
      // enforced as required by validateStep(), but the Property model's
      // enum validation rejects "" outright (it's a defined value, not
      // absent, so it still gets checked against the enum and fails -
      // found by an E2E test that didn't bother picking a furnishing
      // option, exactly like a real user might not). Sending undefined
      // instead of "" makes the field genuinely absent from the request
      // body, so furnishing falls back to the schema's 'unfurnished'
      // default and targetAudience/city are simply left unset, instead
      // of erroring out.
      city: city || undefined,
      targetAudience: targetAudience || undefined,
      furnishing: furnishing || undefined,
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
      // occupancyPerRoom is a single summary number on Property even though
      // rooms can technically each have their own occupancy - just uses the
      // first room's value as a representative figure.
      occupancyPerRoom: rooms[0]?.occupancy || 1,
      // Explicit "Default Price" wins if the renter set one; otherwise fall
      // back to the first room's price so the listing always has a
      // top-level price to show on cards.
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

      // Try to read the new property's id from whatever shape the response
      // came back in, then redirect to its detail page; if for some reason
      // no id is found, fall back to the renter's dashboard instead.
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
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-6xl mx-auto px-6 py-10">
      <Seo title="List Your Property" description="List your PG, hostel, or apartment on Roomie in a few steps." noindex />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">List Your Property</h1>
        <p className="text-sm text-fg-secondary mt-1">Fill details about your property in a few steps</p>
      </div>

      {/* Stepper - circular step markers are a genuine "current position on
          a numbered sequence" indicator, not a decorative rounded-full
          default, so they keep rounded-full. */}
      <ol className="flex items-center gap-6 border-b border-border pb-4 mb-6" aria-label="Form steps">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3" aria-current={i === step ? "step" : undefined}>
            <div
              aria-hidden="true"
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                ${i === step ? "bg-accent text-accent-fg" : i < step ? "bg-neutral-200 dark:bg-neutral-700 text-fg" : "bg-surface text-fg-secondary border border-border"}`}
            >
              {i + 1}
            </div>
            <div className={`text-sm ${i === step ? "text-accent font-medium" : "text-fg-secondary"}`}>{s}</div>
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit} className="bg-surface rounded-md shadow p-6">
        {/* Error / Success */}
        {error && <div className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">{error}</div>}
        {successMsg && <div className="mb-4 text-sm text-green-700 dark:text-green-400" role="status">{successMsg}</div>}

        {/* Step content - only one of these five blocks renders at a time,
            based on the `step` index. Note this is a single <form> the
            whole time; "Next"/"Back" just change which fields are visible,
            they don't actually submit anything until the final step. */}
        {step === 0 && (
          <div className="space-y-4">
            <label className="block">
              <div className="text-sm font-medium text-fg">Property Name</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Cozy Student Residence" className="mt-2 w-full bg-surface text-fg border border-border rounded-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label>
                <div className="text-sm font-medium text-fg">Property Type</div>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="mt-2 w-full bg-surface text-fg border border-border rounded-sm px-3 py-3 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent">
                  <option value="">Select Property Type</option>
                  {options.propertyTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label>
                <div className="text-sm font-medium text-fg">Target Audience</div>
                <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="mt-2 w-full bg-surface text-fg border border-border rounded-sm px-3 py-3 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent">
                  <option value="">Select Target Audience</option>
                  {options.audiences.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <div className="text-sm font-medium text-fg">Property Description</div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your property in detail" rows="6" className="mt-2 w-full bg-surface text-fg border border-border rounded-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="text-sm text-fg font-medium">Amenities</div>
            {optionsLoading && <div className="text-sm text-fg-secondary">Loading amenities...</div>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {options.amenities.map(a => (
                <label key={a.value} className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-800 rounded-sm px-3 py-2 border border-transparent hover:border-border cursor-pointer">
                  <input type="checkbox" checked={selectedAmenities.includes(a.value)} onChange={() => toggleAmenity(a.value)} />
                  <span className="text-sm text-fg">{a.label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <label>
                <div className="text-sm font-medium text-fg">Furnishing</div>
                <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className="mt-2 w-full bg-surface text-fg border border-border rounded-sm px-3 py-3 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent">
                  <option value="">Select Furnishing</option>
                  {options.furnishing.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </label>

              <label>
                <div className="text-sm font-medium text-fg">Meals Provided</div>
                <select value={mealsProvided ? "yes" : "no"} onChange={(e) => setMealsProvided(e.target.value === "yes")} className="mt-2 w-full bg-surface text-fg border border-border rounded-sm px-3 py-3 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} />
                <span className="text-sm text-fg">Pets Allowed</span>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-fg">Rooms & Pricing</div>
              <button type="button" onClick={addRoom} className="text-sm bg-accent text-accent-fg hover:bg-accent-hover px-3 py-1 rounded-sm transition-colors">Add Room</button>
            </div>

            {/* One <fieldset> per room, so screen readers announce each
                group of inputs (name/price/occupancy/etc.) as belonging
                together under "Room N". */}
            <div className="space-y-4">
              {rooms.map((r, i) => (
                <fieldset key={i} className="border border-border p-4 rounded-sm">
                  <legend className="flex items-center justify-between w-full px-0">
                    <span className="font-medium text-fg">Room {i + 1}</span>
                  </legend>
                  <div className="flex justify-end -mt-8 mb-2">
                    <button type="button" onClick={() => removeRoom(i)} className="text-sm text-red-600 dark:text-red-400">
                      Remove room {i + 1}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <label className="block">
                      <span className="sr-only">Room {i + 1} name</span>
                      <input value={r.name} onChange={(e) => updateRoom(i, { name: e.target.value })} className="w-full bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" placeholder="Room name (A1)" />
                    </label>
                    <label className="block">
                      <span className="sr-only">Room {i + 1} price per month</span>
                      <input value={r.price} onChange={(e) => updateRoom(i, { price: e.target.value })} className="w-full bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" placeholder="Price per month" />
                    </label>
                    <label className="block">
                      <span className="sr-only">Room {i + 1} occupancy</span>
                      <input value={r.occupancy} onChange={(e) => updateRoom(i, { occupancy: e.target.value })} type="number" className="w-full bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" placeholder="Occupancy" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <label className="block">
                      <span className="sr-only">Room {i + 1} available from</span>
                      <input value={r.availableFrom} onChange={(e) => updateRoom(i, { availableFrom: e.target.value })} type="date" className="w-full bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
                    </label>
                    <label className="block">
                      <span className="sr-only">Room {i + 1} status</span>
                      <select value={r.status} onChange={(e) => updateRoom(i, { status: e.target.value })} className="w-full bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent">
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
                <span className="text-sm font-medium text-fg">Default Price (optional)</span>
                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Default price e.g. 6000" className="mt-2 w-48 bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {/* Manual "paste a photo URL" path - reads straight from a plain
                DOM element (not React state) since it's a one-off "type,
                click Add, clear" interaction rather than something that
                needs to be controlled continuously. */}
            <div>
              <label htmlFor="photo-url-input" className="text-sm font-medium text-fg">Add Photos (URLs)</label>
              <div className="flex gap-2 mt-2">
                <input placeholder="https://..." className="flex-1 bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" id="photo-url-input" />
                <button type="button" onClick={()=>{
                  const el = document.getElementById("photo-url-input");
                  if(el?.value) {
                    addPhotoUrl(el.value.trim());
                    el.value = "";
                  }
                }} className="px-3 py-2 bg-fg text-bg rounded-sm hover:opacity-90 transition-opacity">Add</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {photoUrls.map((u, idx) => (
                  <div key={idx} className="w-28 h-20 rounded-sm overflow-hidden relative border border-border">
                    <img src={u} alt={`photo-${idx}`} className="w-full h-full object-cover" />
                    {/* Small circular icon-button overlaying a thumbnail - a
                        genuine circle, not a default pill shape, so
                        rounded-full stays here. */}
                    <button onClick={() => removePhotoUrl(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Real file upload path - goes through handleFileUpload(),
                which sends the files to the backend's image-processing
                pipeline (resize/optimize/store on Cloudinary). */}
            <div>
              <label htmlFor="photo-file-input" className="text-sm font-medium text-fg">Upload photos</label>
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
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-fg-secondary mt-1">Uploading... {uploadProgress}%</div>
                </div>
              )}

              {uploadError && (
                <div className="text-sm text-red-600 dark:text-red-400 mt-2" role="alert">{uploadError}</div>
              )}

              <div className="mt-3 flex flex-wrap gap-3">
                {uploadedAssets.map((asset, idx) => {
                  // Each uploaded photo comes back as several resized
                  // variants (see backend/lib/imagePipeline.js) - use the
                  // smallest one here since this is just a thumbnail preview.
                  const smallest = [...asset.variants].sort((a, b) => a.width - b.width)[0];
                  return (
                    <div key={idx} className="w-28 h-20 rounded-sm overflow-hidden relative border border-border">
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
              <div className="text-xs text-fg-secondary mt-2">
                JPEG, PNG, or WebP, up to {MAX_UPLOAD_MB}MB each. Resized and optimized automatically.
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label>
                <div className="text-sm font-medium text-fg">City</div>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 w-full bg-surface text-fg border border-border rounded-sm px-3 py-3 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent">
                  <option value="">Select City</option>
                  {options.cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                <div className="text-sm font-medium text-fg">Address</div>
                <input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="Near X, City" className="mt-2 w-full bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label>
                <div className="text-sm font-medium text-fg">Google Maps URL</div>
                <input value={googleMapsUrl} onChange={(e)=>setGoogleMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." className="mt-2 w-full bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="block">
                <span className="sr-only">Latitude</span>
                <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="Latitude" className="w-full bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
              </label>
              <label className="block">
                <span className="sr-only">Longitude</span>
                <input value={lng} onChange={e=>setLng(e.target.value)} placeholder="Longitude" className="w-full bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
              </label>
              <label className="block">
                <span className="sr-only">Listing status</span>
                <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent">
                  {options.statuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-4">
                <span className="text-sm font-medium text-fg">Currency</span>
                <select value={currency} onChange={(e)=>setCurrency(e.target.value)} className="bg-surface text-fg border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent">
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Navigation buttons - Back is hidden on the first step, and the
            last step swaps "Next" for the real submit button. */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {step > 0 && <button type="button" onClick={handleBack} className="px-4 py-2 border border-border rounded-sm text-fg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Back</button>}
          </div>

          <div className="flex items-center gap-3">
            {step < steps.length - 1 ? (
              <button type="button" onClick={handleNext} className="px-5 py-2 bg-accent text-accent-fg hover:bg-accent-hover rounded-sm transition-colors">Next</button>
            ) : (
              <button type="submit" disabled={loading} className="px-5 py-2 bg-accent text-accent-fg hover:bg-accent-hover rounded-sm disabled:opacity-50 transition-colors">
                {loading ? "Creating..." : "Create listing"}
              </button>
            )}
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}
