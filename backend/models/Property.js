const mongoose = require("mongoose");

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
    status: {
      type: String,
      enum: ["available", "rented", "coming_soon"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", PropertySchema);
