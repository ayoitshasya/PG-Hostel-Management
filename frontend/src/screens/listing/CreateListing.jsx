// src/screens/listing/CreateListing.jsx
import React, { useState, useContext } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

/**
 * CreateListing - multi-step form for renters to create a property
 *
 * Notes:
 * - Uses your API instance (src/api/api.js) which injects the token.
 * - Server expects property shape similar to docs:
 *   { title, description, propertyType, targetAudience, furnishing, petsAllowed,
 *     amenities:[], rooms:[{name, price, occupancy, availableFrom}], price, currency,
 *     location:{address, lat, lng, googleMapsUrl}, photos:[], status:"available" }
 */
export default function CreateListing() {
  const { user } = useContext(AuthContext);
  const nav = useNavigate();

  // Stepper
  const steps = ["Basic", "Amenities", "Rooms & Pricing", "Photos", "Location & Contact"];
  const [step, setStep] = useState(0);

  // Basic info
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [description, setDescription] = useState("");

  // Amenities
  const [amenities, setAmenities] = useState({
    wifi: false,
    parking: false,
    laundry: false,
    gas: false,
    ac: false,
    hotWater: false,
  });

  // Rooms
  const [rooms, setRooms] = useState([
    { name: "A1", price: "", occupancy: 1, availableFrom: "", status: "available" },
  ]);
  const [price, setPrice] = useState(""); // default price (can be derived from rooms)
  const [currency, setCurrency] = useState("INR");

  // Photos (urls + local previews)
  const [photoUrls, setPhotoUrls] = useState([]);
  const [localPreviews, setLocalPreviews] = useState([]); // File previews

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
  function toggleAmenity(key) {
    setAmenities((s) => ({ ...s, [key]: !s[key] }));
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

  function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // create local preview URLs
    const previews = files.map((f) => {
      return { name: f.name, url: URL.createObjectURL(f), file: f };
    });
    setLocalPreviews((p) => [...p, ...previews]);
    // Note: in this version we do not upload files to server; instead you can convert to FormData or upload to S3.
  }

  function removeLocalPreview(idx) {
    setLocalPreviews((p) => p.filter((_, i) => i !== idx));
  }
  function removePhotoUrl(idx) {
    setPhotoUrls((p) => p.filter((_, i) => i !== idx));
  }

  // validation per step
  function validateStep() {
    setError(null);
    if (step === 0) {
      if (!title.trim()) { setError("Property name is required."); return false; }
      if (!propertyType) { setError("Please select a property type."); return false; }
      // description optional
    } else if (step === 2) {
      // ensure at least one room with price
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

  // final submit
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateStep()) return;

    // Build payload
    const payload = {
      title: title.trim(),
      description: description.trim(),
      propertyType,
      targetAudience,
      furnishing,
      petsAllowed,
      mealsProvided,
      amenities: Object.keys(amenities).filter((k) => amenities[k]),
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
      photos: photoUrls, // localPreviews not uploaded in this example
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
      // optional: navigate to renter dashboard or listing detail
      // if created._id exists then go to listing page
      const id = created._id || created.id || (res.data && res.data._id);
      if (id) {
        // small delay so user sees success
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

  // small UI helpers
  const amenityList = [
    { key: "wifi", label: "Wi-Fi" },
    { key: "parking", label: "Parking" },
    { key: "laundry", label: "Laundry" },
    { key: "gas", label: "Gas" },
    { key: "ac", label: "AC" },
    { key: "hotWater", label: "Hot Water" },
  ];

  return (
    <div className="min-h-[70vh] max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">List Your Property</h1>
        <p className="text-sm text-slate-500 mt-1">Fill details about your property in a few steps</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-6 border-b border-slate-100 pb-4 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                ${i === step ? "bg-sky-500 text-white" : i < step ? "bg-slate-200 text-slate-700" : "bg-white text-slate-400 border border-slate-200"}`}
            >
              {i + 1}
            </div>
            <div className={`text-sm ${i === step ? "text-sky-600 font-medium" : "text-slate-600"}`}>{s}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
        {/* Error / Success */}
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        {successMsg && <div className="mb-4 text-sm text-green-600">{successMsg}</div>}

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
                  <option value="PG">PG</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Hostel">Hostel</option>
                </select>
              </label>

              <label>
                <div className="text-sm font-medium text-slate-700">Target Audience</div>
                <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-3">
                  <option value="">Select Target Audience</option>
                  <option value="women">Women</option>
                  <option value="men">Men</option>
                  <option value="co-ed">Co-ed</option>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {amenityList.map(a => (
                <label key={a.key} className="flex items-center gap-3 bg-slate-50 rounded-md px-3 py-2 border border-transparent hover:border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={amenities[a.key]} onChange={() => toggleAmenity(a.key)} />
                  <span className="text-sm text-slate-700">{a.label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <label>
                <div className="text-sm font-medium text-slate-700">Furnishing</div>
                <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-3">
                  <option value="">Select Furnishing</option>
                  <option value="furnished">Furnished</option>
                  <option value="semi-furnished">Semi-furnished</option>
                  <option value="unfurnished">Unfurnished</option>
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
              <button type="button" onClick={addRoom} className="text-sm bg-sky-500 text-white px-3 py-1 rounded">Add Room</button>
            </div>

            <div className="space-y-4">
              {rooms.map((r, i) => (
                <div key={i} className="border border-slate-100 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Room {i + 1}</div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => removeRoom(i)} className="text-sm text-red-500">Remove</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <input value={r.name} onChange={(e) => updateRoom(i, { name: e.target.value })} className="border border-slate-200 rounded px-3 py-2" placeholder="Room name (A1)" />
                    <input value={r.price} onChange={(e) => updateRoom(i, { price: e.target.value })} className="border border-slate-200 rounded px-3 py-2" placeholder="Price per month" />
                    <input value={r.occupancy} onChange={(e) => updateRoom(i, { occupancy: e.target.value })} type="number" className="border border-slate-200 rounded px-3 py-2" placeholder="Occupancy" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <input value={r.availableFrom} onChange={(e) => updateRoom(i, { availableFrom: e.target.value })} type="date" className="border border-slate-200 rounded px-3 py-2" />
                    <select value={r.status} onChange={(e) => updateRoom(i, { status: e.target.value })} className="border border-slate-200 rounded px-3 py-2">
                      <option value="available">Available</option>
                      <option value="booked">Booked</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-slate-700">Default Price (optional)</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Default price e.g. 6000" className="mt-2 w-48 border border-slate-200 rounded px-3 py-2" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-700">Add Photos (URLs)</div>
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
              <div className="text-sm font-medium text-slate-700">Upload files (optional)</div>
              <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="mt-2" />
              <div className="mt-3 flex flex-wrap gap-3">
                {localPreviews.map((p, idx) => (
                  <div key={idx} className="w-28 h-20 rounded overflow-hidden relative border">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    <button onClick={() => removeLocalPreview(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 text-xs">✕</button>
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-400 mt-2">Note: file uploads need server support (multipart) or S3 signed uploads. This form currently keeps file previews client-side.</div>
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
              <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="Latitude" className="border border-slate-200 rounded px-3 py-2" />
              <input value={lng} onChange={e=>setLng(e.target.value)} placeholder="Longitude" className="border border-slate-200 rounded px-3 py-2" />
              <select value={status} onChange={e=>setStatus(e.target.value)} className="border border-slate-200 rounded px-3 py-2">
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="coming_soon">Coming soon</option>
              </select>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <div className="text-sm font-medium">Currency</div>
              <select value={currency} onChange={(e)=>setCurrency(e.target.value)} className="border border-slate-200 rounded px-3 py-2">
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
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
              <button type="button" onClick={handleNext} className="px-5 py-2 bg-sky-500 text-white rounded-md">Next</button>
            ) : (
              <button type="submit" disabled={loading} className="px-5 py-2 bg-sky-600 text-white rounded-md">
                {loading ? "Creating..." : "Create listing"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
