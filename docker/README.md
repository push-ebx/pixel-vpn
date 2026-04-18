# Docker run (API + MySQL + Xray)

From repo root:

```bash
pnpm docker:up
```

Server API will be available at `http://localhost:8787`.

`server` container reads extra app variables from `apps/server/.env`
(for example `YOOKASSA_SHOP_ID` and `YOOKASSA_SECRET_KEY`).
For 3x-ui auto provisioning after payment, configure:
`XUI_ENABLED`, `HOST_X_UI`, `PORT_X_UI`, `WEBBASEPATH`, `XUI_USERNAME`, `XUI_PASSWORD`,
and Reality link params (`XRAY_HOST`, `XRAY_PORT`, `XRAY_PUBLIC_KEY`, `XRAY_SNI`, `XRAY_SHORT_ID`).
You can also set `XUI_BASE_URL` (for example `https://host:port/webbasepath`) to override host/port/path in one variable.

Stop all containers:

```bash
pnpm docker:down
```

If you changed Docker config for server image (for example OpenSSL fix), rebuild server image:

```bash
docker compose -f docker/docker-compose.yml build --no-cache server
```

If you got access errors (`P1010`):

- `db-init` now connects to MySQL via socket as `root@localhost` and re-applies grants automatically.
- If your data is disposable, the clean fallback is still full reset:

```bash
docker compose -f docker/docker-compose.yml down -v
pnpm docker:up
```

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
