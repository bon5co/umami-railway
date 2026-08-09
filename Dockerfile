FROM umamisoftware/umami:3.2

USER root

# bcryptjs + pg are used by the boot-time admin seeder. They are dependencies of
# the app source but the standalone Next.js bundle does not necessarily trace
# them into the runtime image. Install them into their own prefix rather than
# /app, whose pnpm-resolved tree npm refuses to touch (ERESOLVE on react).
RUN mkdir -p /opt/railway-seed \
    && cd /opt/railway-seed \
    && npm install --no-package-lock --no-audit --no-fund bcryptjs pg

COPY railway-seed-admin.cjs /app/scripts/railway-seed-admin.cjs
COPY railway-entrypoint.sh /usr/local/bin/railway-entrypoint.sh
RUN chmod +x /usr/local/bin/railway-entrypoint.sh \
    && chown -R nextjs:nodejs /app/scripts

USER nextjs

EXPOSE 3000

CMD ["/usr/local/bin/railway-entrypoint.sh"]
