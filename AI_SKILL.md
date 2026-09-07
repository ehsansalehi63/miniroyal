# MiniRoyal AI Skill

## Mandatory first step
Any AI agent, coding assistant, automation, or maintainer working on this repository **must read this file before inspecting or editing code**. `AGENTS.md` points here and is the repository entry rule.

## Product data safety

- Do not delete, rename, replace, or silently reshape existing product-specific attributes.
- Product-specific attributes are data, not disposable UI defaults. Preserve saved `attributes`, size charts, fit profiles, variants, media, and custom fields during edits.
- Category suggestions may guide a new product, but must not overwrite attributes already saved on an existing product.
- A product title may repeat. A SKU identifies the product record and should normally be unique; if it already exists, show the existing product and direct the manager to edit or replenish it rather than silently creating a duplicate.

## Save and media safety

- Product creation/update must be transactional and must return a visible, actionable error.
- Image upload must have a timeout, preserve the original image when AI editing fails, and never store a URL that is not publicly reachable.
- Do not assume the deployed Node.js build directory is persistent storage. Use the configured persistent media directory on Hostinger.
- AI image editing is optional. Provider errors must not block ordinary product save.

## Change discipline

1. Read this file and the relevant route/component before editing.
2. Make the smallest change that solves the reported issue.
3. Do not change product attribute behavior unless the user explicitly asks for that change.
4. Run `git diff --check`, `npm run lint`, and `npm run build` before committing.
5. Record the reason and validation in the commit message or deployment notes.
6. Never expose secrets, API keys, or customer data in commits or logs.

## Current known architecture

- Admin product UI: `app/admin/products/ProductsClient.tsx`
- Product attribute editor: `app/components/ProductSpecificationsEditor.tsx`
- Product create API: `app/api/admin/products/route.ts`
- Product update API: `app/api/admin/products/[id]/route.ts`
- Media upload/storage: `app/api/admin/media/upload/route.ts`, `app/lib/media-storage.ts`
- AI image editing: `app/api/ai-image-edit/route.ts`
- MySQL pool: `app/lib/mysql.ts`

## History of recent changes

- Fixed admin session/API caching and the products-page error loop.
- Made optional product fields and measurements clearer.
- Added publication controls and managed banners.
- Added category-first product entry and category-aware suggestions.
- Hardened missing-price rendering and product/image save timeouts.
- Allowed repeated titles with automatically unique slugs.
- Added live similar-product search and SKU-conflict redirection.

Future agents must preserve these behaviors unless the user explicitly requests a change.

## Required verification after every change

- Check the diff for unintended edits to attribute fields.
- Confirm that existing product attributes are still sent in edit payloads.
- Confirm uploaded media URLs survive a fresh request after deployment.
- Confirm the admin products route returns a non-cached response.
- Report exactly what changed and what was verified.

_Last updated: 2026-09-05._
