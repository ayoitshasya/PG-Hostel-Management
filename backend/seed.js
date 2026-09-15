require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Property = require('./models/Property');
const Inquiry = require('./models/Inquiry');
const { processAndUploadImage } = require('./lib/imagePipeline');
const { PROPERTY_TYPES, AUDIENCES, FURNISHING } = require('./constants/listingOptions');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pg_hostel';
const HAS_CLOUDINARY = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Fixed picsum.photos seeds so images are large (1600x1000, ~realistic
// unoptimized source photo size) but stable across re-seeds instead of
// random each run. Each one is fetched for real and pushed through the
// same sharp -> Cloudinary pipeline as a real upload, so seeded listings
// exercise photoAssets/srcset exactly like production data would.
const PHOTO_SEEDS = [
  'roomie-01', 'roomie-02', 'roomie-03', 'roomie-04', 'roomie-05',
  'roomie-06', 'roomie-07', 'roomie-08', 'roomie-09', 'roomie-10',
  'roomie-11', 'roomie-12', 'roomie-13', 'roomie-14', 'roomie-15',
  'roomie-16', 'roomie-17', 'roomie-18', 'roomie-19', 'roomie-20',
  'roomie-21', 'roomie-22', 'roomie-23', 'roomie-24', 'roomie-25',
];

// The first 20 listing indices (0-19) and their photo counts are
// UNCHANGED from the previous seed - same index, same photoCount formula,
// same picsum seed selection - so re-running this script re-uploads
// identical bytes to identical Cloudinary public_ids for all of them
// (net-zero new assets: Cloudinary overwrites in place). Only index 20
// (the one new listing added to hit 21) is genuinely new, and its photo
// count is kept small (2, not the usual 3-5) specifically to keep new
// uploads minimal. See printPlan() below for the exact math.
function photoCountFor(index) {
  return index < 20 ? 3 + (index % 3) : 2;
}

async function fetchAndProcessPhotos(index, count, listingLabel) {
  const photoAssets = [];
  for (let i = 0; i < count; i++) {
    const seed = PHOTO_SEEDS[(index * 3 + i) % PHOTO_SEEDS.length];
    const sourceUrl = `https://picsum.photos/seed/${seed}/1600/1000`;
    process.stdout.write(`  [${listingLabel}] photo ${i + 1}/${count} (${seed})... `);
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${sourceUrl}: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    // Deterministic per listing-index + photo-slot (not per picsum seed
    // name, since the 25 picsum seeds repeat across listings x photos -
    // keying on the seed name would make unrelated listings share the
    // same Cloudinary asset, so deleting one listing would delete
    // another listing's photo too). This makes re-running the seed
    // idempotent: same slot -> same public_id -> Cloudinary overwrites
    // the old file instead of piling up duplicates.
    const asset = await processAndUploadImage(buffer, {
      folder: 'roomie/properties',
      baseId: `seed-listing${index}-photo${i}`,
      overwrite: true,
    });
    console.log(`done (${asset.variants.map((v) => v.width + 'w').join(', ')})`);
    photoAssets.push(asset);
  }
  return photoAssets;
}

// Fallback used only if Cloudinary isn't configured, so the seed script
// still produces browsable listings (without srcset) rather than failing
// outright.
function plainPhotoUrlsFor(index, count) {
  const photos = [];
  for (let i = 0; i < count; i++) {
    const seed = PHOTO_SEEDS[(index * 3 + i) % PHOTO_SEEDS.length];
    photos.push(`https://picsum.photos/seed/${seed}/1600/1000`);
  }
  return photos;
}

const RENTERS = [
  { name: 'Asha Patil', email: 'asha.renter@example.com', phone: '9820011122' },
  { name: 'Rohan Mehta', email: 'rohan.renter@example.com', phone: '9820033344' },
  { name: 'Kavita Nair', email: 'kavita.renter@example.com', phone: '9820055566' },
  { name: 'Suresh Iyer', email: 'suresh.renter@example.com', phone: '9820077788' },
];

const TENANTS = [
  { name: 'Priya Sharma', email: 'priya.tenant@example.com', phone: '9900011111' },
  { name: 'Arjun Verma', email: 'arjun.tenant@example.com', phone: '9900022222' },
  { name: 'Neha Joshi', email: 'neha.tenant@example.com', phone: '9900033333' },
  { name: 'Karan Singh', email: 'karan.tenant@example.com', phone: '9900044444' },
  { name: 'Divya Rao', email: 'divya.tenant@example.com', phone: '9900055555' },
];

const LOCALITIES = [
  { city: 'Andheri East, Mumbai', lat: 19.1136, lng: 72.8697 },
  { city: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 },
  { city: 'Hinjewadi, Pune', lat: 18.5912, lng: 73.7389 },
  { city: 'Gachibowli, Hyderabad', lat: 17.4401, lng: 78.3489 },
  { city: 'Sector 62, Noida', lat: 28.6274, lng: 77.3716 },
  { city: 'Velachery, Chennai', lat: 12.9791, lng: 80.2211 },
  { city: 'Salt Lake, Kolkata', lat: 22.5850, lng: 88.4075 },
  { city: 'Satellite, Ahmedabad', lat: 23.0272, lng: 72.5075 },
  { city: 'Baner, Pune', lat: 18.5590, lng: 73.7868 },
  { city: 'HSR Layout, Bengaluru', lat: 12.9121, lng: 77.6446 },
];

// Every (propertyType, targetAudience) pair EXCEPT these two is populated
// with 3 listings below - these two are deliberately left with zero
// listings so the "No results found" empty state has a real combination
// to test against, not just an out-of-range price.
const EMPTY_COMBOS = [
  { propertyType: 'Hostel', targetAudience: 'co-ed' },
  { propertyType: 'Apartment', targetAudience: 'women' },
];

function isEmptyCombo(propertyType, targetAudience) {
  return EMPTY_COMBOS.some((c) => c.propertyType === propertyType && c.targetAudience === targetAudience);
}

// All 9 propertyType x audience pairs, minus the 2 deliberately-empty
// ones = 7 populated combos, x3 listings each = 21 listings (indices 0-20).
// This replaces the old seed's bug: it picked propertyType and audience
// with the same `i % 3` modulus (both arrays have length 3), so type and
// audience always advanced in lockstep and only 3 of the 9 possible pairs
// were ever generated (PG+women, Hostel+men, Apartment+co-ed) - e.g.
// "Apartment + Men" never existed, regardless of any other filter.
const COMBOS = PROPERTY_TYPES.flatMap((propertyType) =>
  AUDIENCES.map((a) => ({ propertyType, targetAudience: a.value }))
).filter((c) => !isEmptyCombo(c.propertyType, c.targetAudience));

const LISTINGS_PER_COMBO = 3;
const TOTAL_LISTINGS = COMBOS.length * LISTINGS_PER_COMBO; // 7 * 3 = 21

// 7 realistic amenity combinations, cycled by listing index (21 listings /
// 7 sets = each set used exactly 3 times). Designed so that:
// - every one of the 12 canonical amenities appears on multiple listings
//   ("several", per the brief) - the thinnest (refrigerator) still gets 2
//   sets x 3 listings = 6.
// - sets A and F both include wifi+parking+ac together (6 listings total),
//   so a multi-amenity filter on those three returns a real result.
// - {geyser, cctv} never co-occurs in any set - a real, verifiable
//   "returns nothing" combination (used in the curl checks below).
const AMENITY_SETS = [
  ['wifi', 'parking', 'ac', 'laundry'],                       // A
  ['wifi', 'housekeeping', 'geyser'],                          // B
  ['ac', 'cctv', 'lift', 'power-backup', 'refrigerator'],      // C
  ['wifi', 'parking', 'gym', 'tv'],                            // D
  ['laundry', 'refrigerator', 'geyser', 'housekeeping'],       // E
  ['wifi', 'ac', 'parking', 'cctv', 'lift'],                   // F
  ['power-backup', 'gym', 'tv', 'cctv'],                       // G
];

function amenitiesFor(i) {
  return AMENITY_SETS[i % AMENITY_SETS.length];
}

// 3000 to 25000 across 21 listings, evenly spread, so minPrice/maxPrice
// filters at different thresholds actually produce different result sets
// instead of clustering in one narrow band (the old 6000-16800 range).
function priceFor(i) {
  return 3000 + i * 1100;
}

function furnishingFor(i) {
  return FURNISHING[i % FURNISHING.length].value;
}

function statusFor(i) {
  if (i % 6 === 0) return 'rented';
  if (i % 5 === 0) return 'coming_soon';
  return 'available';
}

function pick(arr, i) {
  return arr[i % arr.length];
}

async function buildListings(renterDocs) {
  const listings = [];
  for (let i = 0; i < TOTAL_LISTINGS; i++) {
    const combo = COMBOS[Math.floor(i / LISTINGS_PER_COMBO)];
    const { propertyType, targetAudience: audience } = combo;
    const locality = pick(LOCALITIES, i);
    const furnishing = furnishingFor(i);
    const basePrice = priceFor(i);
    const roomCount = 2 + (i % 3);

    const rooms = Array.from({ length: roomCount }, (_, r) => ({
      name: `Room ${r + 1}`,
      price: basePrice + r * 800,
      occupancy: 1 + (r % 3),
      availableFrom: new Date(Date.now() + r * 86400000 * 5),
      status: r === 0 && i % 6 === 0 ? 'booked' : 'available',
    }));

    const photoCount = photoCountFor(i);
    const photoAssets = HAS_CLOUDINARY
      ? await fetchAndProcessPhotos(i, photoCount, `listing ${i + 1}/${TOTAL_LISTINGS}`)
      : [];

    listings.push({
      owner: renterDocs[i % renterDocs.length]._id,
      title: `${propertyType === 'Hostel' ? 'Cozy Hostel' : propertyType === 'Apartment' ? 'Shared Apartment' : 'Comfortable PG'} near ${locality.city.split(',')[0]}`,
      description: `A well-maintained ${propertyType.toLowerCase()} in ${locality.city}, ideal for ${audience === 'co-ed' ? 'working professionals and students' : audience === 'women' ? 'working women and female students' : 'working men and male students'}. Close to public transport, cafes, and IT parks. ${furnishing === 'furnished' ? 'Fully furnished with bed, wardrobe, and study table.' : furnishing === 'semi-furnished' ? 'Semi-furnished with bed and wardrobe.' : 'Unfurnished, ready for move-in.'}`,
      propertyType,
      targetAudience: audience,
      furnishing,
      petsAllowed: i % 4 === 0,
      amenities: amenitiesFor(i),
      rooms,
      totalRooms: rooms.length,
      occupancyPerRoom: rooms[0].occupancy,
      toilets: { total: roomCount, attached: Math.max(1, roomCount - 1) },
      mealsProvided: i % 3 !== 0,
      price: basePrice,
      currency: 'INR',
      location: {
        address: `${100 + i}, ${locality.city}`,
        lat: locality.lat + i * 0.001,
        lng: locality.lng + i * 0.001,
        googleMapsUrl: `https://maps.google.com/?q=${locality.lat},${locality.lng}`,
      },
      photos: HAS_CLOUDINARY ? [] : plainPhotoUrlsFor(i, photoCount),
      photoAssets,
      status: statusFor(i),
    });
  }
  return listings;
}

// Pure computation, zero I/O (no Mongo connection, no Cloudinary, no
// network fetch) - safe to run without any credentials configured.
// Prints exactly what `node seed.js` would create, computed from the
// same COMBOS/amenitiesFor/priceFor/photoCountFor functions the real run
// uses, so this can't drift out of sync with actual behavior.
function printPlan() {
  console.log(`Would wipe MONGODB_URI's database: ${MONGODB_URI}\n`);
  console.log(`Would create: ${RENTERS.length} renters, ${TENANTS.length} tenants, ${TOTAL_LISTINGS} listings, 8 inquiries.\n`);

  console.log('Listings per propertyType x audience:');
  const counts = {};
  for (let i = 0; i < TOTAL_LISTINGS; i++) {
    const combo = COMBOS[Math.floor(i / LISTINGS_PER_COMBO)];
    const key = `${combo.propertyType} + ${combo.targetAudience}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  Object.entries(counts).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  EMPTY_COMBOS.forEach((c) => {
    const key = `${c.propertyType} + ${c.targetAudience}`;
    console.log(`  ${key}: 0 (deliberately empty)`);
  });

  console.log('\nListings per amenity (how many of the 21 listings include each):');
  const amenityCounts = {};
  for (let i = 0; i < TOTAL_LISTINGS; i++) {
    amenitiesFor(i).forEach((a) => { amenityCounts[a] = (amenityCounts[a] || 0) + 1; });
  }
  Object.entries(amenityCounts).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log(`\nPrice range: INR ${priceFor(0)} to INR ${priceFor(TOTAL_LISTINGS - 1)}`);

  console.log('\nCloudinary photo plan (only relevant if CLOUDINARY_* env vars are set):');
  let existingPublicIds = 0;
  let newPublicIds = 0;
  for (let i = 0; i < TOTAL_LISTINGS; i++) {
    const count = photoCountFor(i);
    if (i < 20) existingPublicIds += count; else newPublicIds += count;
  }
  console.log(`  Listings 0-19 (existing): ${existingPublicIds} photo public_ids re-uploaded in place (same content, same IDs - net-zero new assets, up to 3 variants each = up to ${existingPublicIds * 3} assets refreshed).`);
  console.log(`  Listing 20 (new): ${newPublicIds} photo public_ids never used before - genuinely new, up to 3 variants each = up to ${newPublicIds * 3} new assets.`);
  console.log(`  Total distinct Cloudinary assets after seeding: up to ${(existingPublicIds + newPublicIds) * 3} (up from 237 today), of which only up to ${newPublicIds * 3} are actually new uploads.`);

  console.log('\nThis was computed with zero network/database calls. Run without --plan to actually seed (you run that step).');
}

async function seed() {
  if (!HAS_CLOUDINARY) {
    console.warn('CLOUDINARY_* env vars not set - listings will use plain picsum.photos URLs (photos field) instead of the real upload pipeline (photoAssets). Set them in backend/.env to seed with real processed/optimized images.\n');
  }

  console.log(`Connecting to ${MONGODB_URI} ...`);
  await mongoose.connect(MONGODB_URI);

  console.log('Clearing existing Users, Properties, and Inquiries...');
  await Promise.all([
    User.deleteMany({}),
    Property.deleteMany({}),
    Inquiry.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('Password123!', 10);

  console.log('Creating renters...');
  const renterDocs = await User.insertMany(
    RENTERS.map((r) => ({ ...r, passwordHash, role: 'renter' }))
  );

  console.log('Creating tenants...');
  const tenantDocs = await User.insertMany(
    TENANTS.map((t) => ({ ...t, passwordHash, role: 'tenant' }))
  );

  console.log(`Creating listings${HAS_CLOUDINARY ? ' (processing and uploading photos - this takes a while)' : ''}...`);
  const listings = await buildListings(renterDocs);
  const listingDocs = await Property.insertMany(listings);

  console.log('Creating sample inquiries...');
  const sampleInquiries = listingDocs.slice(0, 8).map((listing, i) => ({
    property: listing._id,
    tenant: tenantDocs[i % tenantDocs.length]._id,
    message: `Hi, I'm interested in this ${listing.propertyType.toLowerCase()}. Is it still available? Could we schedule a visit this week?`,
    status: i % 3 === 0 ? 'new' : i % 3 === 1 ? 'contacted' : 'closed',
  }));
  await Inquiry.insertMany(sampleInquiries);

  console.log(`\nDone. Created ${renterDocs.length} renters, ${tenantDocs.length} tenants, ${listingDocs.length} listings, ${sampleInquiries.length} inquiries.`);

  console.log('\nListings per propertyType x audience:');
  const counts = {};
  listingDocs.forEach((l) => {
    const key = `${l.propertyType} + ${l.targetAudience}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  Object.entries(counts).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  EMPTY_COMBOS.forEach((c) => {
    const key = `${c.propertyType} + ${c.targetAudience}`;
    if (!counts[key]) console.log(`  ${key}: 0 (deliberately empty)`);
  });

  console.log('\nSample login: any seeded email above with password "Password123!"');
  console.log(`Example listing id for manual testing: ${listingDocs[0]._id}`);

  await mongoose.disconnect();
}

if (process.argv.includes('--plan')) {
  printPlan();
} else {
  seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
