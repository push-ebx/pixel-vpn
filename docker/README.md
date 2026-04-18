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

View API logs:

```bash
pnpm docker:logs:server
```

## Optional environment overrides

You can override values from your shell before `pnpm docker:up`:

- `JWT_SECRET`
- `CORS_ORIGIN`
