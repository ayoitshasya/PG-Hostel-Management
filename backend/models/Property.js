const mongoose = require("mongoose");

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
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    propertyType: String,
    targetAudience: String, // women/men/co-ed
    furnishing: {
      type: String,
      enum: ["furnished", "semi-furnished", "unfurnished"],
      default: "unfurnished",
    },
    petsAllowed: { type: Boolean, default: false },
    amenities: [String],
    rooms: [RoomSchema],
    totalRooms: Number,
    occupancyPerRoom: Number,
    toilets: {
      total: { type: Number, default: 0 },
      attached: { type: Number, default: 0 },
    },
    mealsProvided: { type: Boolean, default: false },
    price: Number,
    currency: { type: String, default: "INR" },
    location: {
      address: String,
      lat: Number,
      lng: Number,
      googleMapsUrl: String,
    },
    photos: [String],
    photoAssets: [PhotoAssetSchema],
    status: {
      type: String,
      enum: ["available", "rented", "coming_soon"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", PropertySchema);
