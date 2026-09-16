// This file holds the "controller" functions for authentication: signup and
// login. A controller function is the code that actually runs when a
// matching route (see backend/routes/auth.js) receives a request - it reads
// the incoming request, talks to the database/other logic, and sends back a
// response. Passwords are never stored in plain text: we hash them with
// bcrypt, and instead of sessions we hand out a signed JWT (JSON Web Token)
// that the frontend attaches to future requests to prove who it is.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Secret key used to sign/verify JWTs. Must be set in the .env file - if a
// token is signed with this and later verified with a different secret (or
// no secret), verification will fail.
const JWT_SECRET = process.env.JWT_SECRET;

// Builds a signed JWT that encodes the user's id, role, and email.
// The frontend stores this token and sends it back as
// "Authorization: Bearer <token>" on requests that need to know who's
// logged in. expiresIn: "7d" means the token stops being valid after 7 days,
// so the user has to log in again.
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Handles POST /api/auth/signup.
// Expects { name, email, password, role, phone, avatarUrl } in the request
// body. Creates a new User with a bcrypt-hashed password (never store the
// raw password!), then immediately logs them in by returning a fresh JWT
// plus the public-safe user fields (no passwordHash in the response).
exports.signup = async (req, res) => {
  const { name, email, password, role, phone, avatarUrl } = req.body;
  // Minimal required-field check - if any of these are missing, fail fast
  // with a 400 (Bad Request) instead of letting a confusing DB error happen.
  if (!name || !email || !password)
    return res.status(400).json({ error: "name, email and password required" });

  // Emails are stored lowercase so "User@x.com" and "user@x.com" are treated
  // as the same account - look up using the same lowercased form.
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    return res.status(400).json({ error: "Email already registered" });

  // bcrypt.hash(password, 10) turns the plain password into a one-way hash
  // (10 = "salt rounds", i.e. how much computational work goes into the
  // hash - higher is slower but harder to brute-force). We only ever save
  // this hash, never the original password.
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    // Only "renter" is accepted as an explicit opt-in; anything else
    // (missing, typo'd, tampered with) safely defaults to "tenant".
    role: role === "renter" ? "renter" : "tenant",
    phone,
    avatarUrl,
  });

  const token = generateToken(user);
  // 201 = "Created". We return the token so the frontend can log the user in
  // immediately without making them submit the login form separately.
  res
    .status(201)
    .json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    });
};

// Handles POST /api/auth/login.
// Expects { email, password, role } in the request body. `role` here isn't
// just informational - the frontend's login form asks the user to pick
// "renter" or "tenant", and login fails with 403 if that doesn't match what
// the account was actually registered as. This stops a tenant account from
// accidentally (or deliberately) logging into the renter-only parts of the
// UI just by picking the other tab.
exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role)
    return res.status(400).json({ error: "email, password, and role required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  // Deliberately vague "Invalid credentials" for both "no such user" and
  // "wrong password" (below) - telling an attacker which one failed would
  // leak whether an email is registered at all.
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  // verifyPassword (defined on the User model) compares the plaintext
  // password against the stored bcrypt hash - bcrypt re-hashes the input
  // with the same salt and checks if the result matches.
  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  // Case-insensitive compare since role values are consistently lowercase
  // internally, but this guards against any stray casing differences.
  if (user.role.toLowerCase() !== role.toLowerCase())
    return res.status(403).json({ error: `Access denied: This account is registered as '${user.role}'` });

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    },
  });
};
