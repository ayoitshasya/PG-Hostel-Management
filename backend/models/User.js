// This is the Mongoose schema/model for a User document in MongoDB.
// Mongoose is an ODM (Object-Document Mapper) - it lets us define the
// shape of our data as a JS object (with validation rules like `required`
// and `enum`) and gives us back a `User` object with helper methods for
// querying/creating/updating documents in the "users" collection.
//
// A User can be either a "renter" (lists properties) or a "tenant"
// (browses/inquires about properties) - see the `role` field below.
const mongoose = require("mongoose");
// bcryptjs hashes and compares passwords. We never store a plaintext
// password anywhere - only a one-way hash (see passwordHash below), so
// even if the database were leaked, the original passwords aren't exposed.
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true, // MongoDB will reject a second user with the same email
      lowercase: true, // normalizes "User@Example.com" -> "user@example.com" before saving
      trim: true, // strips leading/trailing whitespace
    },
    // The bcrypt hash of the user's password (created at signup time in
    // authController.js). Never store the raw password itself.
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["renter", "tenant"], default: "tenant" },
    phone: { type: String },
    avatarUrl: { type: String },
  },
  // Only track createdAt (not updatedAt, which Mongoose's default
  // `timestamps: true` would also add) - this schema doesn't need it.
  { timestamps: { createdAt: "createdAt" } }
);

// Instance method - available on every User document as `user.verifyPassword(...)`.
// Compares a plaintext password (e.g. typed into the login form) against
// the stored hash, without ever needing to "decrypt" the hash (bcrypt
// hashing is one-way by design). Returns a Promise<boolean>.
userSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Registers the schema as the "User" model. Mongoose automatically maps
// this to a MongoDB collection named "users" (lowercased + pluralized).
module.exports = mongoose.model("User", userSchema);
