---
name: showcase-deploy
description: Build applications for Showcase deployment platform. Use when creating showcase.config.json, setting up databases, configuring Docker containers, implementing SPAs with routing, or working with Showcase-specific features.
---

# Showcase Deployment Guide

Building applications for the Showcase deployment platform - a secure, multi-tenant hosting platform with SSO, automatic database provisioning, and persistent storage.

## Supported Runtimes

- **node**: Node.js applications (v18, v20, v22)
- **python**: Python applications (3.9+)
- **docker**: Custom Dockerfiles
- **static**: Pure HTML/CSS/JS (no server)

## Configuration File

Create `showcase.config.json` in project root:

```json
{
    "appName": "my-app",
    "displayName": "My Application",
    "description": "App description",
    "visibility": "listed",
    "runtime": "node",
    "version": "22",
    "database": "postgres" | "mongo",
    "assetsDir": ".",
    "buildCommand": "npm run build",
    "startCommand": "npm start",
    "internalPort": 3000
}
```

**appName rules:** kebab-case only (my-app, not myApp or my_app)

## Database Credentials

When database configured, these env vars are injected:

- `DB_CONNECTION_STRING` - Use this for connections
- `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_NAME`, `DB_PORT` - Also available

You can freely use these variable names in your `.env` file for local development — at runtime, Showcase automatically provides the correct values for your provisioned database, so there's no risk of conflict.

```javascript
// Node
const pool = new Pool({ connectionString: process.env.DB_CONNECTION_STRING })

// Python
conn = psycopg2.connect(os.environ['DB_CONNECTION_STRING'])
```

## User Authentication Headers

Available on all requests:

- `x-user-id` - Unique user ID
- `x-user-email` - User email
- `x-user-name` - Full name
- `x-user-given-name` - First name
- `x-user-family-name` - Last name

## Sending Emails

Send emails to CapTech users via the internal email API. The `to` field supports multiple recipients as a comma-delimited string — each recipient receives their own individual email with a personalized unsubscribe link.

```javascript
// Node.js - single recipient
const response = await fetch(process.env.SHOWCASE_EMAIL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        to: 'user@captechconsulting.com',
        subject: 'Hello!',
        body: '<h1>Welcome</h1><p>Email content here</p>',
        contentType: 'html', // or 'text'
    }),
})

// Node.js - multiple recipients
const response = await fetch(process.env.SHOWCASE_EMAIL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        to: 'user1@captechconsulting.com, user2@captechconsulting.com',
        subject: 'Hello everyone!',
        body: '<h1>Welcome</h1>',
        contentType: 'html',
    }),
})
```

```python
# Python
import os
import requests
response = requests.post(
    os.environ['SHOWCASE_EMAIL_URL'],
    json={
        'to': 'user1@captechconsulting.com, user2@captechconsulting.com',
        'subject': 'Hello!',
        'body': '<h1>Welcome</h1>',
        'contentType': 'html'
    }
)
```

**Environment variables (auto-injected):**

- `SHOWCASE_EMAIL_URL` - URL for sending emails
- `SHOWCASE_EMAIL_STATUS_URL` - URL for checking rate limit status

**Restrictions:**

- Recipients must have CapTech email (@captechconsulting.com or @captechventures.com)
- Rate limit: 100 emails/hour per app (each recipient counts as one email)
- Multiple recipients: comma-delimited in the `to` field, each gets their own email

## Persistent Storage

Use `persistent/` directory for data that survives redeployments:

```javascript
fs.writeFileSync('persistent/uploads/file.jpg', data)
const db = new sqlite3.Database('persistent/app.db')
```

## Critical Requirements

### Node.js

**Must bind to 0.0.0.0:**

```javascript
app.listen(3000, '0.0.0.0') // REQUIRED
```

**SPAs need catch-all route:**

```javascript
app.use(express.static('dist'))

// API routes first
app.get('/api/*', handler)

// Catch-all LAST
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})
```

### Python

**Must use --host 0.0.0.0:**

```json
{
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port 8000"
}
```

**SPAs with FastAPI:**

```python
app.mount("/assets", StaticFiles(directory="dist/assets"))

@app.get("/{full_path:path}")
async def spa(full_path: str):
    return FileResponse("dist/index.html")
```

### Docker

**Dockerfile requirements:**

1. EXPOSE port matching internalPort
2. Bind to 0.0.0.0

**DB variable injection marker (recommended):**

```dockerfile
FROM node:22
WORKDIR /app
COPY . .
# SHOWCASE_DB_INJECTION_POINT
# DB vars injected here: DB_USER, DB_PASS, etc.
RUN npm install
EXPOSE 4000
CMD ["node", "server.js"]
```

Without marker, vars injected after last ENV statement.

## Environment Variables

**Custom vars:** Create `.env` file (add to .gitignore):

```
API_KEY=secret
FEATURE_FLAG=true
```

**Tip:** You can keep `DB_CONNECTION_STRING` and other database variables in your `.env` for local development. At runtime, Showcase automatically provides the correct values for your provisioned database.

## Ignoring Files (`.showcaseignore`)

By default, these directories are always excluded from deployments: `node_modules`, `.venv`, `venv`, `.git`, `__pycache__`, `persistent`, `.meteor/local`.

To exclude additional files or directories, create a `.showcaseignore` file in your project root (next to `showcase.config.json`). It uses `.gitignore` syntax and is respected by both the CLI and Web UI.

```gitignore
# Large files not needed in production
data/
*.csv

# Test files
tests/
**/*.test.js

# Build artifacts
dist/
*.map
```

**Supported patterns:**

| Pattern          | Description                                    |
| ---------------- | ---------------------------------------------- |
| `logs/`          | Ignore entire directory                        |
| `*.log`          | Ignore by extension                            |
| `docs/*.md`      | Ignore files in a specific directory           |
| `**/temp`        | Ignore at any depth                            |
| `!important.log` | Negate a previous pattern (do NOT ignore this) |
| `#`              | Comment line                                   |

**Behavior:**

- Patterns are **additive** to built-in exclusions (cannot override them)
- Only a `.showcaseignore` at the project root is used (no subdirectory support)
- CLI shows `📋 Using .showcaseignore patterns` when the file is detected

## Common Mistakes

❌ `app.listen(3000, 'localhost')` - Use `'0.0.0.0'`
❌ Hardcoded DB connection - Use `DB_CONNECTION_STRING`
✅ `DB_CONNECTION_STRING` in `.env` for local dev is fine - Showcase overrides it at runtime
❌ Missing SPA catch-all - 404s on direct URL access
❌ Committing `.env` - Add to .gitignore

## Runtime Selection

- Pure frontend, no server → `static`
- SPA with routing → `node` or `python` with server
- Node.js app → `node`
- Python app → `python`
- Complex setup → `docker`

## Quick Reference

**Node SPA Server Template:**

```javascript
const express = require('express')
const app = express()
app.use(express.static('dist'))
app.get('/api/*', apiHandler)
app.get('*', (req, res) => res.sendFile('dist/index.html'))
app.listen(3000, '0.0.0.0')
```

**Database Connection:**

```javascript
const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
})
```

**Persistent Files:**

```javascript
const uploadPath = 'persistent/uploads/'
```

**User Info:**

```javascript
const userId = req.header('x-user-id')
```

**Send Email:**

```javascript
await fetch(process.env.SHOWCASE_EMAIL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        to: 'user@captechconsulting.com',
        subject: 'Subject',
        body: '<p>HTML content</p>',
    }),
})
```
