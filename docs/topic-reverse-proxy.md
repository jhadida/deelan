# Reverse Proxy and HTTPS

This page describes how to protect `deelan serve` behind a reverse proxy with TLS termination and authentication.

## Why Use a Reverse Proxy

`deelan serve` is a static preview server. It is intentionally simple and does not provide built-in auth, TLS, or access policy.
For local/private hosting, the standard pattern is:

1. Run Deelan locally (`127.0.0.1:4321` by default).
2. Put Caddy or Nginx in front of it.
3. Let the proxy enforce HTTPS and authentication.

## Minimal Architecture

- Deelan app:
    - `deelan serve --host 127.0.0.1 --port 4321`
- Reverse proxy:
    - listens on `443`
    - forwards requests to `127.0.0.1:4321`
    - handles certificates and auth

## Caddy Example (Simple Recommended Path)

Template file in repository:

- `templates/reverse-proxy/Caddyfile`

```caddyfile
notes.example.com {
  reverse_proxy 127.0.0.1:4321

  basicauth {
    admin $2a$14$replace-with-bcrypt-hash
  }
}
```

Notes:

- Caddy automatically manages Let's Encrypt certificates for public DNS names.
- For internal names, use your internal CA flow or Caddy local cert mode.
- Generate bcrypt hash with `caddy hash-password`.

## Nginx Example

Template file in repository:

- `templates/reverse-proxy/nginx.conf`

```nginx
server {
  listen 443 ssl;
  server_name notes.example.com;

  ssl_certificate     /etc/ssl/certs/notes.example.com.crt;
  ssl_certificate_key /etc/ssl/private/notes.example.com.key;

  auth_basic           "Restricted";
  auth_basic_user_file /etc/nginx/.htpasswd;

  location / {
    proxy_pass http://127.0.0.1:4321;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Certificate Setup: What Is Required

Certificate setup depends on where you host:

- Public DNS host (internet-reachable):
    - easiest path
    - automatic cert issuance is available (for example via Let's Encrypt with Caddy).
- Private internal host/domain:
    - use your company PKI/internal CA, or a local CA trusted by your team machines.
- Local-only workstation development:
    - HTTPS is optional for solo local use.
    - if needed, use local dev cert tooling (for example `mkcert`) and trust it locally.

In practice, yes: each deployment environment needs certificate setup.
In corporate contexts this is often done once by IT/platform admins, then reused.

## Operational Guidance

- Keep Deelan bound to localhost; expose only proxy ports.
- Rotate proxy credentials (basic auth) periodically.
- Restrict network access with firewall rules when possible.
- Log access at proxy layer.

## Scope Boundary

Reverse-proxy auth/TLS covers most local/private collaboration needs with low complexity.
Enterprise SSO (OIDC/SAML) can be layered at the proxy/identity stack later, without changing core Deelan rendering logic.

## Why This Is Mostly Documentation + Templates

No additional Deelan runtime dependency is required for this pattern because:

- TLS termination is handled by the proxy (Caddy/Nginx), not by `deelan serve`.
- Authentication is handled by the proxy as well.
- Deelan remains a static-site server behind localhost upstream.

So the implementation surface is:

- deployment templates (`templates/reverse-proxy/*`)
- operational documentation (this page + getting-started quick setup)

not changes to Deelan rendering/build internals.
