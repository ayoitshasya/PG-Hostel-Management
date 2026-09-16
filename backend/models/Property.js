// This is the Mongoose schema/model for a Property listing - the central
// entity of the app. It defines every field a listing can have and the
// validation rules MongoDB/Mongoose enforce before a document is saved
// (required fields, allowed enum values, defaults, etc.).
const mongoose = require("mongoose");
// The canonical lists of allowed values (property types, cities, amenities,
// ...) live in one shared file so the backend, seed script, and frontend
// all agree on exactly the same options - see constants/listingOptions.js.
const { PROPERTY_TYPES, CITIES, AUDIENCES, FURNISHING, STATUSES, AMENITIES } = require("../constants/listingOptions");

// The constants file stores { value, label } pairs (for display purposes),
// but Mongoose's `enum` validator just wants the list of valid raw values -
// so we extract just the `value` from each pair here.
const AUDIENCE_VALUES = AUDIENCES.map((a) => a.value);
const FURNISHING_VALUES = FURNISHING.map((f) => f.value);
const STATUS_VALUES = STATUSES.map((s) => s.value);
const AMENITY_VALUES = AMENITIES.map((a) => a.value);

// A "sub-schema" describing one resized version (width) of an uploaded
// photo. `{ _id: false }` tells Mongoose not to generate its own unique id
// for each variant, since we don't need to reference a variant on its own.
const PhotoVariantSchema = new mongoose.Schema(
  {
    width: { type: Number, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // Cloudinary public_id, needed to delete this exact file later
  },
  { _id: false }
);

// A processed, uploaded photo: several WebP widths of the same image,
// stored as real files on Cloudinary (not Cloudinary on-the-fly
// transforms). `photos` (plain URL strings) is kept as-is alongside this
// for backward compatibility with existing data and manually-pasted URLs.
const PhotoAssetSchema = new mongoose.Schema(
  {
    width: { type: Number, required: true }, // intrinsic width of the original upload
    height: { type: Number, required: true }, // intrinsic height of the original upload
    variants: [PhotoVariantSchema],
  },
  { _id: false }
);

// One rentable room/bed inside a property. A single Property can list
// several rooms (e.g. different room types at different prices), each
// tracked separately as available/booked/unavailable.
const RoomSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    occupancy: Number,
    availableFrom: Date,
    status: {
      type: String,
      enum: ["available", "booked", "unavailable"],
      default: "available",
    },
  },
  { _id: false }
);

const PropertySchema = new mongoose.Schema(
  {
    // A reference to the User who owns/listed this property. `ref: "User"`
    // is what lets Mongoose "populate" this field with the full User
    // document later (e.g. showing the owner's name on a listing page)
    // instead of just the raw ObjectId.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    propertyType: { type: String, enum: PROPERTY_TYPES },
    city: { type: String, enum: CITIES },
    targetAudience: { type: String, enum: AUDIENCE_VALUES },
    furnishing: {
      type: String,
      enum: FURNISHING_VALUES,
      default: "unfurnished",
    },
    petsAllowed: { type: Boolean, default: false },
    // lowercase:true normalizes incoming values ("WiFi" -> "wifi") before
    // the enum check runs, so a client sending old-style casing still
    // works instead of failing validation.
    amenities: [{ type: String, enum: AMENITY_VALUES, lowercase: true, trim: true }],
    rooms: [RoomSchema],
    totalRooms: Number,
    occupancyPerRoom: Number,
    toilets: {
      total: { type: Number, default: 0 },
      attached: { type: Number, default: 0 },
    },
    mealsProvided: { type: Boolean, default: false },
    // Top-level default price shown on listing cards (the frontend falls
    // back to the first room's price if this isn't set).
    price: Number,
    currency: { type: String, default: "INR" },
    location: {
      address: String,
      lat: Number,
      lng: Number,
      googleMapsUrl: String,
    },
    // Legacy field: plain pasted image URLs, kept working for old data.
    photos: [String],
    // Current field: images that went through the real upload pipeline
    // (backend/lib/imagePipeline.js) and live on Cloudinary.
    photoAssets: [PhotoAssetSchema],
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: "available",
    },
  },
  // Adds both createdAt and updatedAt fields automatically, kept in sync
  // by Mongoose on every save.
  { timestamps: true }
);

// Registers the schema as the "Property" model, mapped to MongoDB's
// "properties" collection.
module.exports = mongoose.model("Property", PropertySchema);
