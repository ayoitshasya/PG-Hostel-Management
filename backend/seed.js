require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Property = require('./models/Property');
const Inquiry = require('./models/Inquiry');
const { processAndUploadImage } = require('./lib/imagePipeline');

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
    // name, since the 25 picsum seeds repeat across 20 listings x up to 5
    // photos - keying on the seed name would make unrelated listings
    // share the same Cloudinary asset, so deleting one listing would
    // delete another listing's photo too). This makes re-running the seed
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

const AMENITY_POOL = [
  'WiFi', 'AC', 'Laundry', 'Housekeeping', 'Power Backup', 'Lift',
  'CCTV', 'Parking', 'Refrigerator', 'Geyser', 'TV', 'Gym',
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

const PROPERTY_TYPES = ['PG', 'Hostel', 'Apartment'];
const AUDIENCES = ['women', 'men', 'co-ed'];
const FURNISHING = ['furnished', 'semi-furnished', 'unfurnished'];

function pick(arr, i) {
  return arr[i % arr.length];
}

function amenitiesFor(index) {
  const shuffled = [...AMENITY_POOL].sort((a, b) => ((index * 7 + a.length) % 5) - ((index * 3 + b.length) % 5));
  return shuffled.slice(0, 4 + (index % 4));
}

async function buildListings(renterDocs) {
  const listings = [];
  for (let i = 0; i < 20; i++) {
    const locality = pick(LOCALITIES, i);
    const propertyType = pick(PROPERTY_TYPES, i);
    const audience = pick(AUDIENCES, i);
    const furnishing = pick(FURNISHING, i);
    const basePrice = 6000 + (i % 10) * 1200;
    const roomCount = 2 + (i % 3);

    const rooms = Array.from({ length: roomCount }, (_, r) => ({
      name: `Room ${r + 1}`,
      price: basePrice + r * 800,
      occupancy: 1 + (r % 3),
      availableFrom: new Date(Date.now() + r * 86400000 * 5),
      status: r === 0 && i % 6 === 0 ? 'booked' : 'available',
    }));

    const photoCount = 3 + (i % 3); // 3-5 photos per listing
    const photoAssets = HAS_CLOUDINARY
      ? await fetchAndProcessPhotos(i, photoCount, `listing ${i + 1}/20`)
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
      status: i % 9 === 0 ? 'rented' : i % 7 === 0 ? 'coming_soon' : 'available',
    });
  }
  return listings;
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

  console.log('Creating a few sample inquiries...');
  const sampleInquiries = listingDocs.slice(0, 6).map((listing, i) => ({
    property: listing._id,
    tenant: tenantDocs[i % tenantDocs.length]._id,
    message: `Hi, I'm interested in this ${listing.propertyType.toLowerCase()}. Is it still available? Could we schedule a visit this week?`,
    status: i % 3 === 0 ? 'new' : i % 3 === 1 ? 'contacted' : 'closed',
  }));
  await Inquiry.insertMany(sampleInquiries);

  console.log(`\nDone. Created ${renterDocs.length} renters, ${tenantDocs.length} tenants, ${listingDocs.length} listings, ${sampleInquiries.length} inquiries.`);
  console.log('Sample login: any seeded email above with password "Password123!"');
  console.log(`Example listing id for manual testing: ${listingDocs[0]._id}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
