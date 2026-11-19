# Admin jersey API (contract)

The admin app (`Frontend/Web/admin`) adds and manages the jerseys shown on the customer site's rack. The backend (Node + SQL, in `Backend/`) must implement the endpoints below; the admin screens call them through `src/lib/api/jerseys.ts`, so only that file changes when the backend arrives.

## Until the backend exists: local bridge

The admin app currently implements this API itself in its own server routes (`src/app/api/jerseys/…`, logic in `src/lib/server/bridge.ts`). On save, it does this:

1. Validates the details and photos again on the server.
2. Runs `tools/cutout.py` (rembg) to remove backgrounds, trim, and resize to 640 px WebP.
3. Writes the photos to `Customer/public/jerseys/<slug>/0..3.webp`.
4. Adds the jersey to `Customer/content/jerseys.json`. The customer home page reads that file on every request, so the jersey appears straight away.

The bridge is for local development only:
- It refuses to run when `NODE_ENV=production`.
- It only answers requests addressed to `localhost`, and the admin dev server listens only on `127.0.0.1`.
- It rejects changes that don't come from the admin's own pages (Origin check, against CSRF).
- It has no login, so it must never be deployed. The real backend replaces it.

Settings: `CUSTOMER_APP_DIR` sets where the customer app is (default `../Customer`), and `REMBG_PYTHON` sets which Python runs the cut-out tool (default `tools/.venv`). See `Frontend/Web/admin/tools/README.md` for setting up the tool.

## Endpoints

All endpoints are under `/api/admin` and require an authenticated admin session.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/jerseys` | List jerseys, newest first |
| `GET` | `/api/admin/jerseys/:id` | One jersey |
| `POST` | `/api/admin/jerseys` | Create a jersey (multipart, see below) |
| `PATCH` | `/api/admin/jerseys/:id` | Update details or rack settings (JSON) |
| `DELETE` | `/api/admin/jerseys/:id` | Remove a jersey and its photos |

The customer site reads published jerseys from a public, read-only endpoint (`GET /api/jerseys?onRack=true`) that returns only customer-safe fields.

### Create: `POST /api/admin/jerseys` (multipart/form-data)

| Field | Type | Notes |
|---|---|---|
| `team` | text | Required, max 60 chars |
| `name` | text | Required, max 80 chars, e.g. "Chelsea home jersey" |
| `season` | text | Required, format `YYYY/YY`, e.g. `2025/26` |
| `sport` | text | `football`, `cricket` or `basketball` |
| `price` | integer | Rupees, required, > 0 |
| `mrp` | integer | Optional original price, must be greater than `price` |
| `sizes` | text, repeated | Any of `S`, `M`, `L`, `XL`, `XXL`; at least one |
| `customisable` | boolean | Name and number printing available |
| `onRack` | boolean | Show on the landing-page rack |
| `rackMirror` | boolean | Mirror the side photo so it faces left on the rack |
| `removeBackground` | boolean | Run background removal on the photos |
| `photo_front` | file | Required |
| `photo_side` | file | Required; side view, front facing left (or set `rackMirror`) |
| `photo_back_side` | file | Optional |
| `photo_back` | file | Required |

The response is the stored jersey (same shape as `GET /:id`), including the processed photo URLs in spin order: front, side, back-side (if given), back.

## Server-side requirements

- **Auth:** admin-only. Check the role on the server on every request; never trust the client.
- **Uploads:**
  - Accept only PNG, JPEG and WebP, checked by file content (magic bytes), not by extension or `Content-Type`.
  - Max 10 MB per file and 4 files per request.
  - Re-encode every image to WebP on the server, which also strips EXIF/metadata.
  - Store under generated names; never use the uploaded filename in a path.
- **Background removal:** run the self-hosted rembg service (`isnet-general-use` model) when `removeBackground` is true. It's an internal service, never exposed publicly. Fill enclosed holes and keep the original colours, as in the prototype script. White or very pale kits need clean photos (real transparency or a plain backdrop).
- **Output images:** trimmed to the jersey, 640 px tall, WebP, transparent background.
- **Validation:** same rules as the table above; reject unknown fields (no mass assignment).
- **Rate limits:** apply limits to uploads.
