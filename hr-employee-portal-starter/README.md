# HR & Employee Portal Starter

Roles:
- Admin
- HR
- Employee

Tech:
- React + TypeScript
- Cloudflare Workers + D1 + R2

This is a starter scaffold. Extend modules:
- Employee Management
- Leave Management
- Attendance
- Payroll
- Documents
- Dashboard

## Cloudflare deployment

The frontend and API run in one Cloudflare Worker. D1 stores HR records, R2 stores uploaded document files, and Cloudflare Access JWTs protect all HR API routes. The public health check is the only unauthenticated API route.

### Local development

Install the API dependencies once:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Apply the schema to local D1:

```bash
npm run db:migrate:local
```

Run `npm run dev:worker` in one terminal and `npm run dev` in another. Vite proxies `/api` requests to the local Worker.

### Cloudflare resources and deploy

1. Authenticate locally with `npx wrangler login` from `frontend/`.
2. The D1 database is already created for the configured Cloudflare account. For a different account, create D1 and update `database_id` in `wrangler.jsonc`. Enable R2 in the Cloudflare dashboard, then create the document bucket:

   ```bash
   npm run r2:create
   ```

3. Copy the D1 `database_id` returned by Wrangler into `database_id` in `wrangler.jsonc`. Create a Cloudflare Access application for `hr-employee-portal.<your-workers-subdomain>.workers.dev` and protect the production URL plus preview/deployment URLs. Until role-level authorization is added, restrict the Access allow policy to trusted HR administrators only.
4. Set the Access team domain and the Access application's audience tag as Worker secrets. Run these commands from `frontend/`; Wrangler prompts for each value locally:

   ```bash
   npx wrangler secret put ACCESS_TEAM_DOMAIN --config ../wrangler.jsonc
   npx wrangler secret put ACCESS_AUD --config ../wrangler.jsonc
   ```

5. Apply the remote schema and deploy:

   ```bash
   npm run db:migrate:remote
   npm run deploy
   ```

The UI login is handled by Cloudflare Access; the starter does not store passwords. App-level Admin/HR/Employee authorization is not implemented yet, so Access users currently have the same API permissions. The D1 migration creates a new database; existing MySQL data must be exported and imported separately before switching production traffic.
