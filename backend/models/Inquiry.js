// This is the Mongoose schema/model for an Inquiry - a message a tenant
// sends to express interest in a Property. It links one tenant (User) to
// one property, and tracks a simple status lifecycle the renter can
// update as they follow up.
const mongoose = require("mongoose");

const InquirySchema = new mongoose.Schema(
  {
    // The listing this inquiry is about. `ref: "Property"` lets Mongoose
    // "populate" the full Property document from this id when needed.
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    // The User (with role "tenant") who sent this inquiry.
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: String,
    // Lifecycle: a new inquiry starts as "new", the renter marks it
    // "contacted" once they've reached out, and either side can mark it
    // "closed" once it's resolved.
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
  },
  // Only track createdAt, not updatedAt.
  { timestamps: { createdAt: "createdAt" } }
);

module.exports = mongoose.model("Inquiry", InquirySchema);
