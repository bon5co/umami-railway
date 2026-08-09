# umami-railway

Railway-tuned [Umami](https://umami.is) 3.2.0 image.

Two changes over `umamisoftware/umami:3.2`, both of which exist because of how
Railway deploys behave:

1. **The admin account is claimed at boot instead of shipped with a public
   password.** Umami creates its admin user inside migration `01_init` with a
   hardcoded bcrypt hash of the password `umami` and a fixed `user_id`
   (`41e2b680-…`), so every stock deployment is reachable by anyone who knows the
   default the moment its URL goes live. Upstream exposes no environment variable
   for this — the documented flow is "log in and change it", which is a race with
   the internet. This image sets the credentials from `UMAMI_ADMIN_PASSWORD` /
   `UMAMI_ADMIN_USERNAME` after `prisma migrate deploy` and **before** the server
   binds its port, and refuses to start on an empty password. It re-applies on
   every boot, so the password is rotatable by editing the variable and
   redeploying, and it targets the seeded row by id so an admin the deployer
   creates later is never touched.

2. **Pinned.** Upstream's `postgresql-latest` / `latest` tags move, and Umami
   applies one-way Prisma migrations on boot, so tracking a rolling tag turns
   every redeploy into an unrequested upgrade.

## Variables

| Variable | Required | Notes |
|---|---|---|
| `UMAMI_ADMIN_PASSWORD` | yes | container refuses to boot when empty |
| `UMAMI_ADMIN_USERNAME` | no | defaults to `admin` |
| `DATABASE_URL` | yes | Postgres connection string |
| `REDIS_URL` | no | when set, auth tokens are stored in Redis (`src/lib/redis.ts`) |
| `APP_SECRET`, `HASH_SALT` | yes | standard Umami secrets |

Everything else is upstream's.
