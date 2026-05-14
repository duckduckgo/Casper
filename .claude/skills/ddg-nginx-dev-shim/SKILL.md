---
name: ddg-nginx-dev-shim
description: Expose a local dev server at https://<your-handle>.duckduckgo.com/<subpath>/ by dropping a location snippet into the duckduckgo.com nginx include directory. Use when the user wants to share or preview a localhost service on their personal DDG dev subdomain — e.g. "expose this on duckduckgo.com", "nginx shim", "preview via duckduckgo.com", "subpath dev preview", or when setting up a public preview of a local app.
---

# DuckDuckGo nginx dev shim

Expose any localhost service at `https://<your-handle>.duckduckgo.com/<subpath>/` by dropping a `location` snippet into the production nginx include directory on your DDG dev box.

> Each DDG developer has their own `<handle>.duckduckgo.com` subdomain. Substitute your own handle (your DDG username) wherever you see `<your-handle>` below.

## How it works

The duckduckgo.com production nginx config `include`s `/usr/local/nginx/conf/duckduckgo.com_conf.d/*.conf` inside multiple `server` blocks. Confirm with:

```bash
grep -n 'duckduckgo\.com_conf\.d' /usr/local/nginx/conf/nginx.conf
```

Any `.conf` snippet in that directory is mounted under the public TLS-terminating server, so a single `location` block is enough to expose a backend.

## Steps

1. Pick a unique `<subpath>` (used both in the URL and as the conf filename).
2. Write the snippet (see template).
3. Copy it into the include dir.
4. Reload nginx.

```bash
sudo cp my-shim.conf /usr/local/nginx/conf/duckduckgo.com_conf.d/<subpath>.conf
sudo /usr/local/nginx/sbin/nginx_reload
```

## Snippet template

```nginx
location ^~ /<subpath>/ {
    proxy_read_timeout        120;
    proxy_cache               off;
    proxy_set_header          Host $host;
    proxy_set_header          X-Real-IP $remote_addr;
    proxy_set_header          X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header          X-Forwarded-Proto $scheme;
    proxy_set_header          Content-Type $content_type;
    proxy_http_version        1.1;
    proxy_set_header          Upgrade $http_upgrade;
    proxy_set_header          Connection "upgrade";
    proxy_pass                http://127.0.0.1:<PORT>;
}
```

## Critical: `proxy_pass` and the trailing slash

The trailing-slash behavior of `proxy_pass` decides whether nginx strips the `<subpath>` prefix before forwarding.

| Pattern                              | Behavior                                                              | When to use                                                                  |
| ------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `proxy_pass http://127.0.0.1:PORT;`  | Full request URI (with `/<subpath>/`) forwarded as-is.                | Subpath-aware apps — e.g. Ghost configured with `url` ending in `/<subpath>`. |
| `proxy_pass http://127.0.0.1:PORT/;` | nginx strips `/<subpath>/` before forwarding.                         | Apps that don't know or care about their public path.                        |

If you copy a snippet from a neighboring app, **check which one applies to yours** before reusing. A Ghost app emitting absolute URLs from its `url` config will break with the trailing-slash form because the upstream then can't reconstruct the prefix.

## Verify

```bash
curl -I https://<your-handle>.duckduckgo.com/<subpath>/   # expect a 2xx/3xx from your upstream
sudo /usr/local/nginx/sbin/nginx -t                       # syntax check before reloading
```

If you get a 404 or the wrong app, double-check that the snippet filename actually landed in `/usr/local/nginx/conf/duckduckgo.com_conf.d/` and that `nginx -t` passes.

## Existing snippets on the box

List what's already wired up — useful both as prior art and to avoid subpath collisions:

```bash
ls /usr/local/nginx/conf/duckduckgo.com_conf.d/
grep -n 'proxy_pass' /usr/local/nginx/conf/duckduckgo.com_conf.d/*.conf
```

Find a snippet that proxies the *same kind* of upstream as yours (subpath-aware vs prefix-stripping per the table above) before copying.
