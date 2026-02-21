# Reverse Proxy Templates

This folder contains ready-to-edit reverse-proxy templates for DEELAN:

- `Caddyfile`
- `nginx.conf`

These templates assume DEELAN serves on localhost:

```bash
deelan serve --host 127.0.0.1 --port 4321
```

Then the proxy handles:

- HTTPS/TLS termination
- authentication (basic auth in provided templates)
- forwarding to local DEELAN upstream
