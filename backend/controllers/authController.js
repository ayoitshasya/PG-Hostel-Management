const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

exports.signup = async (req, res) => {
  const { name, email, password, role, phone, avatarUrl } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "name, email and password required" });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    return res.status(400).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role === "renter" ? "renter" : "tenant",
    phone,
    avatarUrl,
  });

  const token = generateToken(user);
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

exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role)
    return res.status(400).json({ error: "email, password, and role required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  if (user.role.toLowerCase() !== role.toLowerCase())
    return res.status(403).json({ error: `Access denied: This account is registered as '${user.role} and ${role}'` });

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

