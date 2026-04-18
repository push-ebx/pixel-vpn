# Docker run (API + MySQL + Xray)

From repo root:

```bash
pnpm docker:up
```

Server API will be available at `http://localhost:8787`.

Stop all containers:

```bash
pnpm docker:down
```

If you changed MySQL credentials or got access errors (`P1010`), recreate MySQL volume:

```bash
docker compose -f docker/docker-compose.yml down -v
pnpm docker:up
```

`db-init` now runs before server start and re-applies grants for `${MYSQL_USER}`.

View API logs:

```bash
pnpm docker:logs:server
```

## Optional environment overrides

You can override values from your shell before `pnpm docker:up`:

- `JWT_SECRET`
- `CORS_ORIGIN`
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
