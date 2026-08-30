/**
 * Migrate `pricePerUnit` from float/int to Decimal128 across the products,
 * stocks and recordings collections.
 *
 * SAFETY:
 *   - Dry-run by default. It only reports what it WOULD do.
 *   - Pass `--commit` to actually write.
 *   - Pass `--rollback` (with `--commit`) to convert Decimal128 back to double.
 *   - Idempotent: only touches fields of the "wrong" BSON type, so re-running
 *     is safe.
 *
 * ALWAYS run against a backup/copy first, verify, then run on production.
 *
 * Usage:
 *   DB_URI='mongodb://...' npx tsx scripts/migrateMoneyToDecimal.ts            # dry run
 *   DB_URI='mongodb://...' npx tsx scripts/migrateMoneyToDecimal.ts --commit   # apply
 *   DB_URI='mongodb://...' npx tsx scripts/migrateMoneyToDecimal.ts --commit --rollback
 */
import mongoose from "mongoose";

const COLLECTIONS = ["products", "stocks", "recordings"];
const FIELD = "pricePerUnit";

async function main() {
  const dbUri = process.env.DB_URI;
  if (!dbUri) throw new Error("DB_URI is not set");

  const commit = process.argv.includes("--commit");
  const rollback = process.argv.includes("--rollback");

  await mongoose.connect(dbUri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No database handle");

  console.log(
    `\n${commit ? "APPLYING" : "DRY RUN"} — ${
      rollback ? "Decimal128 → double (rollback)" : "double/int → Decimal128"
    }\n`
  );

  // Which docs need converting, and how to convert them.
  const sourceTypes = rollback ? ["decimal"] : ["double", "int", "long"];
  const conversion = rollback
    ? { $toDouble: `$${FIELD}` }
    : { $toDecimal: `$${FIELD}` };

  for (const name of COLLECTIONS) {
    const col = db.collection(name);
    const filter = { [FIELD]: { $type: sourceTypes as any } };
    const toConvert = await col.countDocuments(filter);
    const total = await col.countDocuments({ [FIELD]: { $exists: true } });

    if (!commit) {
      console.log(
        `  ${name}: ${toConvert} of ${total} doc(s) would be converted`
      );
      continue;
    }

    if (toConvert === 0) {
      console.log(`  ${name}: nothing to convert (already migrated)`);
      continue;
    }

    const res = await col.updateMany(filter, [
      { $set: { [FIELD]: conversion } },
    ]);
    console.log(
      `  ${name}: converted ${res.modifiedCount} of ${toConvert} doc(s)`
    );
  }

  if (!commit) {
    console.log("\nDry run only. Re-run with --commit to apply.\n");
  } else {
    console.log("\nDone.\n");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
