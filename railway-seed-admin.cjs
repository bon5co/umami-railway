/*
 * Set the built-in admin account's credentials from the environment, every boot.
 *
 * Umami creates its admin user inside migration 01_init with a hardcoded bcrypt
 * hash of the password "umami" and a fixed user_id, so every stock deployment
 * ships with publicly known credentials from the moment its URL is live. There
 * is no upstream environment variable for this; the documented flow is "log in
 * and change it", which is a race with the whole internet.
 *
 * This runs after `prisma migrate deploy` and before the HTTP server binds, so
 * the first request the public port ever serves is against a claimed instance.
 * It is idempotent and re-applies on every boot, which also makes the password
 * rotatable by editing the Railway variable and redeploying.
 */
const bcrypt = require('/opt/railway-seed/node_modules/bcryptjs');
const { Client } = require('/opt/railway-seed/node_modules/pg');

const SALT_ROUNDS = 10; // matches src/lib/password.ts

// The admin row created by migration 01_init. Targeting it by id rather than by
// role means an extra admin the deployer creates later is never touched.
const SEEDED_ADMIN_ID = '41e2b680-648e-4b09-bcd7-3e2b10c06264';

async function main() {
  const password = process.env.UMAMI_ADMIN_PASSWORD;
  const username = process.env.UMAMI_ADMIN_USERNAME || 'admin';

  if (!password) {
    console.error('[railway] UMAMI_ADMIN_PASSWORD is empty - refusing to start.');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const hash = bcrypt.hashSync(password, SALT_ROUNDS);
    const res = await client.query(
      `UPDATE "user"
          SET username = $1, password = $2, updated_at = now()
        WHERE user_id = $3
          AND deleted_at IS NULL`,
      [username, hash, SEEDED_ADMIN_ID],
    );

    if (res.rowCount === 0) {
      console.error('[railway] no admin user found to seed - refusing to start.');
      process.exit(1);
    }

    console.log(`[railway] admin credentials seeded (username=${username}, rows=${res.rowCount}).`);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error(`[railway] admin seed failed: ${err.message}`);
  process.exit(1);
});
