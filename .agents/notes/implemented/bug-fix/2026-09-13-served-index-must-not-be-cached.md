# Agent Note: Served index must not be cached

Status: implemented

English | [中文](2026-09-13-served-index-must-not-be-cached.zh.md)

## Problem

A browser that reuses a cached index cannot boot the Web application, and reloading does not recover it.

The index names the client-bundle revisions of the activation that rendered it. [client/modules](../../../../packages/client/modules/src/index.ts) mints those revisions from a per-activation random nonce, serves the bundles `public, max-age=31536000, immutable`, and rejects every other revision with 404 rather than answering it with newer bytes. That contract holds only while the browser re-reads the index on each load, and nothing enforced it: the index shipped a bare `content-type` with no `Cache-Control`, `ETag`, or `Last-Modified`, so heuristic caching pinned a browser to revisions the next process no longer answered. Every dynamic module then failed to load and the page stopped at its loading state, reporting no error.

## Decision

`serveStatic` marks the rendered index response `cache-control: no-store` on both index entry paths, the dist root and the configured `distIndex`. Static files keep the headers they had; their names or revisions already change with their bytes.

## Alternatives considered

**`no-cache` plus an `ETag`.** Revalidation preserves a 304 path for a document of a few tens of kilobytes over a loopback socket. It costs a validator computed per render to save a round trip that is already local, and `no-store` states the actual obligation: the index is per-activation output, not a cacheable representation.

**Derive bundle revisions from bundle bytes so they survive a restart.** The revision would then be stable, but a restart that re-read a changed bundle could serve bytes the cached index does not describe — exactly what the 404-on-mismatch rule exists to prevent.

**Answer a stale revision with current bytes instead of 404.** A revision names exact bytes; answering it with different bytes defeats the immutable cache the client already holds.

## Consequences

The index is re-rendered and re-fetched on every page load; it is a small document, and authentication and index taps already run per request. Browsers holding an index cached before this change need one manual cache-clearing reload. [Package tests](../../../../packages/host/frontend-static/tests/frontend-static.spec.ts) pin `no-store` on each index entry path and its absence from assets, 404 responses, and the webserver's own error bodies.
