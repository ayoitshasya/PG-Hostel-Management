// One-time migration: rewrites existing Property.amenities values from the
// old seed script's casing/wording ("WiFi", "Power Backup") to the new
// canonical lowercase-hyphenated values in constants/listingOptions.js
// ("wifi", "power-backup"). Needed because the mismatch isn't just casing
// for multi-word amenities - "Power Backup" -> "power-backup" changes the
// character content too, so schema-level lowercase:true alone can't fix
// already-stored documents.
//
// Only touches Property.amenities. Does not touch propertyType,
// targetAudience, furnishing, status, or anything Cloudinary-related -
// those fields already use consistent values between the old seed and the
// new constants file, so no migration is needed for them.
//
// Safe to run more than once: already-canonical values pass through the
// mapping unchanged (LEGACY_TO_CANONICAL keys are matched case-
// insensitively, and the fallback for anything unmapped is just
// lowercase+trim). A second run finds 0 documents differ and writes
// nothing.
//
// Usage:
//   node migrate-amenities.js --dry-run   # prints planned changes, saves nothing
//   node migrate-amenities.js             # applies the changes
require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./models/Property');
const { AMENITIES } = require('./constants/listingOptions');

const DRY_RUN = process.argv.includes('--dry-run');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pg_hostel';
const CANONICAL_VALUES = new Set(AMENITIES.map((a) => a.value));

const LEGACY_TO_CANONICAL = {
  'wifi': 'wifi',
  'ac': 'ac',
  'laundry': 'laundry',
  'housekeeping': 'housekeeping',
  'power backup': 'power-backup',
  'lift': 'lift',
  'cctv': 'cctv',
  'parking': 'parking',
  'refrigerator': 'refrigerator',
  'geyser': 'geyser',
  'tv': 'tv',
  'gym': 'gym',
};

function normalize(raw) {
  const key = String(raw).trim().toLowerCase();
  return LEGACY_TO_CANONICAL[key] || key;
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE (will write changes)'}`);
  console.log(`Connecting to ${MONGODB_URI} ...`);
  await mongoose.connect(MONGODB_URI);

  const properties = await Property.find({});
  console.log(`Checking ${properties.length} properties...\n`);

  let changed = 0;
  let dedupedCount = 0;
  const unmapped = new Set();
  const sampleChanges = [];

  for (const prop of properties) {
    const before = prop.amenities || [];
    const normalized = before.map(normalize);
    const deduped = normalized.filter((v, i, arr) => arr.indexOf(v) === i);
    if (deduped.length !== normalized.length) dedupedCount++;

    deduped.forEach((v) => {
      if (!CANONICAL_VALUES.has(v)) unmapped.add(v);
    });

    const after = deduped.filter((v) => CANONICAL_VALUES.has(v));
    const isDifferent = before.length !== after.length || before.some((v, i) => v !== after[i]);

    if (isDifferent) {
      changed++;
      if (sampleChanges.length < 30) {
        sampleChanges.push({ title: prop.title, id: prop._id.toString(), before, after });
      }
      if (!DRY_RUN) {
        prop.amenities = after;
        await prop.save();
      }
    }
  }

  console.log(`${DRY_RUN ? 'Would change' : 'Changed'}: ${changed}/${properties.length} properties`);
  console.log(`Documents where normalization produced a duplicate that got merged: ${dedupedCount}`);
  if (unmapped.size) {
    console.warn(`Values with no canonical mapping (dropped):`, [...unmapped]);
  } else {
    console.log('No unmapped values found - every stored amenity has a canonical match.');
  }

  console.log(`\nSample of ${sampleChanges.length} change(s)${changed > sampleChanges.length ? ` (showing first ${sampleChanges.length} of ${changed})` : ''}:`);
  sampleChanges.forEach((c) => {
    console.log(`  [${c.id}] ${c.title}`);
    console.log(`    before: ${JSON.stringify(c.before)}`);
    console.log(`    after:  ${JSON.stringify(c.after)}`);
  });

  if (DRY_RUN) {
    console.log('\nDry run only - nothing was saved. Re-run without --dry-run to apply.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
