# Angular upgrade plan (v13 → current LTS)

> **Status:** Planning document only. Do **not** run `ng update` or mass dependency changes until the team confirms the target LTS and start date.  
> **Last reviewed:** Capture `package.json` / Angular release page when execution begins.

---

## Objective

Upgrade Angular from **v13.3.x (EOL)** to the **latest stable LTS** at execution time, with incremental majors, minimal regression risk, and validated SSR (Angular Universal) if still in use.

**Before locking a version:** confirm the LTS matrix on [Angular releases](https://angular.dev/reference/releases) and [Version compatibility](https://angular.dev/reference/versions).

---

## Git strategy: separate branch per Angular version (one repository)

Use **one Git branch per Angular major** on the **same remote** (e.g. `origin`). Do **not** use multiple repositories—only **branch + PR** per step.

**Rules:**

- One `ng update` hop per branch (e.g. 13 → 14 only on `upgrade/angular-14`).
- After a green build: **commit → push branch → open PR → merge** into `main` (or `develop`) before creating the branch for the next major.
- Branch the next major from the updated default branch (already contains the previous upgrade).

| Step | Angular target | Example branch | When to push |
|------|----------------|----------------|--------------|
| 0 | Baseline (v13) | `main` | — |
| 1 | v14 | `upgrade/angular-14` | After `ng build` (+ SSR) succeeds |
| 2 | v15 | `upgrade/angular-15` | After merge of v14; branch from updated `main` |
| 3 | … | `upgrade/angular-16`, … | Same pattern |

**Flow (repeat for each major):**

1. Merge the **previous** upgrade PR so `main` matches the last Angular version.
2. Create a **new** branch for this major only:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b upgrade/angular-14
   ```

3. Run **only** this hop’s `ng update` (e.g. 13 → 14), fix migrations, `ng build` (+ SSR).
4. Commit and push to **the same repo**:

   ```bash
   git add -A
   git status
   git commit -m "chore(angular): upgrade to v14.x"
   git push -u origin upgrade/angular-14
   ```

5. Open **PR**: `upgrade/angular-14` → `main`. Merge after review.
6. For **v15**, branch from updated `main` (now on v14)—do **not** put multiple majors on one long-lived upgrade branch.

**Optional:** tag each merged milestone on `main` for audit history, e.g. `git tag angular-v14.0 && git push origin angular-v14.0`.

### Quick checklist per major

- [ ] Branch created from `main` after previous major is merged.
- [ ] `ng update` only **one** major hop.
- [ ] `ng build` (+ SSR / prerender if used) green.
- [ ] Commit + `git push -u origin <branch-name>`.
- [ ] PR merged before starting the next Angular version.

---

## Phase 1 — Assessment & planning

### 1. Document current state

Record the following (fill in **Local** when you run commands on the build machine).

| Item | From repo (`package.json` / `angular.json`) | Local (`node -v`, `npx ng version`) |
|------|-----------------------------------------------|-------------------------------------|
| Angular (`@angular/*`) | `~13.3.0` | |
| Angular CLI | `~13.3.3` | |
| TypeScript | `~4.6.2` | |
| RxJS | `~7.5.0` | |
| Zone.js | `~0.11.4` | |
| Node.js | — | |
| npm | — | |

**Build / config files to archive or diff:**

- `angular.json`
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.server.json`
- `src/polyfills.ts`, `src/main.ts`, `src/main.server.ts`
- `server.ts` (Express + Universal)

---

### 2. Official upgrade path

Angular expects **one major version per `ng update` hop** (do not skip majors).

Typical chain from this repo:

```text
13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → …
```

Stop at the major that is **LTS** (or agreed active support) on the day you upgrade.

For **each** hop:

1. Open [Angular Update Guide](https://angular.dev/update-guide) — set *from* / *to* majors.
2. Run the suggested `ng update` commands (often `@angular/core` + `@angular/cli` first, then other `@angular/*` packages).
3. Fix compile errors, run `ng build` (and SSR if applicable), commit before the next major.

---

### 3. Dependency compatibility audit

Plan research or upgrades for each; verify peer dependencies for the **target** Angular major.

| Package | Current (approx.) | Notes |
|---------|-------------------|--------|
| `@nguniversal/express-engine`, `@nguniversal/builders` | ^13.1.0 | Must stay aligned with Angular; builders/APIs change across majors. |
| `ngx-bootstrap` | ^8.0.0 | Check matrix for target Angular. |
| `ngx-device-detector` | ^3.0.0 | Same. |
| `ngx-quicklink` | ^0.2.7 | May be unmaintained; evaluate fork or removal. |
| `lucide-angular` | ^0.511.0 | Check peer range for target Angular. |
| `@angular-slider/ngx-slider` | ^2.0.3 | Peer deps. |
| `angularx-qrcode` | ^13.0.14 | Often bumps with Angular major. |
| `@angular/youtube-player` | ^13.3.4 | Align with core Angular version. |
| `ng-connection-service` | ^1.0.4 | Verify maintenance / compatibility. |
| `express` | ^4.x | Re-check `server.ts` + TypeScript after TS upgrade. |
| `request` | ^2.88.2 | **Deprecated** — schedule replacement (`fetch` / `axios` / `undici`) on a separate task if desired. |

---

### 4. Backend / API

No API contract change is *required* for a frontend-only Angular upgrade, but **validate** after each major or before production:

- Auth (JWT / cookies), interceptors, error response shape.
- Checkout / payments / CMS-driven routes.

---

## Phase 2 — Setup & upgrade execution

### 5. Create the first upgrade branch (v13 → v14)

Do not upgrade on `main` without a PR. Use a **version-specific** branch (see [Git strategy](#git-strategy-separate-branch-per-angular-version-one-repository) above).

```bash
git checkout main
git pull origin main
git checkout -b upgrade/angular-14
```

For v15 onward, always branch from the branch that **already includes** the previous Angular major (usually `main` after merge).

---

### 6. Environment alignment

- Install **Node.js** (and npm) versions required by the **target** Angular major — see [Version compatibility](https://angular.dev/reference/versions).
- If dependency resolution breaks mid-upgrade:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

### 7. Run Angular updates incrementally

**One major at a time** (example for 13 → 14; adjust versions per hop):

```bash
ng update @angular/core@14 @angular/cli@14
```

Repeat for 15, 16, … until the agreed target. Use the Update Guide for package-specific migrations (`@angular/material`, etc., if added later).

---

### 8. Resolve breaking changes (common areas)

- **RxJS** — version and import patterns required by newer Angular.
- **TypeScript** — stricter checks, `lib` / `module` / `moduleResolution` updates.
- **Polyfills** — consolidation into `main` / different Zone import (varies by major).
- **SSR / Universal** — builder renames, `provideServerRendering` / `@angular/ssr` migrations on newer majors.
- **`angular.json`** — e.g. application builder, budgets, styles pipeline.
- **Karma / Jasmine** — versions compatible with CLI.
- **Optional later:** standalone APIs, signals — not mandatory for first LTS landing.

---

## Phase 3 — Testing & validation

### 9. Build & runtime

- `ng build` (production and any `development` / `staging` configurations you use).
- If SSR is in scope: `ng run ecommerce:server` (or current project name), `npm run serve:ssr` / `build:ssr` / `prerender` as applicable.
- No unhandled console errors on boot and main routes.

---

### 10. Homepage & layout regression

- Header / navigation, announcement bar.
- Hero / primary slider (`fs_slider` / full-bleed height if still used).
- API-driven sections, images, lazy loading.
- Forms and basic validation.
- Responsive breakpoints (mobile / tablet / desktop).

---

### 11. Full regression (critical flows)

- Login / account.
- Cart, checkout, payment widgets (e.g. Foloosi / third-party).
- Category / product / search.
- CMS or static property pages (blogs, policies, etc.).

---

## Phase 4 — Staging & QA

### 12. Deploy to staging

```bash
npm run build
# or your staging configuration, e.g.:
# ng build --configuration=staging
```

Deploy artifacts to staging; smoke-test with production-like API.

---

### 13. Cross-browser & quality

- **Browsers:** Chrome, Safari, Firefox, Edge (recent versions).
- **Mobile:** iOS Safari, Android Chrome — pinch-zoom, scroll, fixed headers.
- **Performance:** LCP, CLS (especially hero / `vh` / images).

---

## Phase 5 — Release

### 14. Final validation

- No critical open bugs on staging.
- No obvious performance regression vs pre-upgrade baseline (sample LCP/CLS).
- Application logs clean under normal traffic simulation.

### 15. Merge & deploy

Merge **the final** upgrade branch (e.g. `upgrade/angular-20`) into your default branch after all per-major PRs are done:

```bash
git checkout main
git pull origin main
git merge upgrade/angular-20
git push origin main
```

Deploy to production; monitor errors and performance after rollout.

If you used **one PR per major**, production typically receives merges in order (14 → 15 → … → LTS), not a single long-lived `upgrade/angular-13-to-lts` branch.

---

## Risks checklist

| Risk | Mitigation |
|------|------------|
| Third-party packages without peer support for target Angular | Research replacements or supported majors **before** the hop that fails `npm install`. |
| SSR / prerender regressions | Run server build + SSR smoke after **each** major. |
| Strict TypeScript | Fix incrementally; relax only as a last resort with team agreement. |
| Deprecated `request` | Track security audit separately; do not block Angular upgrade unless CI requires it. |

---

## Acceptance criteria

- [ ] Target Angular major is **documented LTS** (or agreed support tier) on [angular.dev](https://angular.dev/reference/releases) at execution time.
- [ ] Upgrades applied **one major at a time** with a green build between steps.
- [ ] **Each major** has its own branch on the **same** remote, **pushed** after a green build, with PR/review and merge before the next hop.
- [ ] Application builds and runs (browser + SSR if used).
- [ ] Critical e-commerce and auth flows pass on **staging**.
- [ ] Cross-browser smoke pass completed.
- [ ] Production deploy only after explicit sign-off.

---

## Sign-off (fill before execution)

| Field | Value |
|-------|--------|
| Target Angular major | |
| Target Node.js version | |
| Owner | |
| Start date | |
| Confirmed by | |

---

## Upgrade progress log

| Milestone | Branch (recommended) | Notes |
|-----------|----------------------|--------|
| **13 → 14** | `upgrade/angular-14` | `ng update` to v14; Universal + youtube-player → 14; `ngx-bootstrap` ^9; `angularx-qrcode` ^14; `.npmrc` with `legacy-peer-deps=true` for `ng-connection-service` outdated peers; `analyze` script uses `--configuration production`; `tsconfig` target **ES2020** (CLI migration); `defaultProject` removed from `angular.json`. Verified: `ng build --configuration=development`, `ng run ecommerce:server:development`. |
| **14 → 15** | `upgrade/angular-15` | `ng update` to v15; TypeScript **~4.9.5**; Universal + youtube-player → 15; `ngx-bootstrap` **^10.3.0**; `angularx-qrcode` **^15.0.1**; `zone.js` **~0.12.0**; `server.ts` uses `import 'zone.js/node'` (replaces deprecated `zone.js/dist/zone-node`). CLI migrations: removed `.browserslistrc` (defaults), `main.server.ts` no longer exports `renderModule`, `test.ts` / `tsconfig` **ES2022** + `useDefineForClassFields`, `angular.json` builder cleanup. Verified: `ng build --configuration=development`, `ng run ecommerce:server:development`. |
| **15 → 16** | `upgrade/angular-16` | `ng update` to v16; **zone.js ~0.13.3**; Universal + youtube → 16; `ngx-bootstrap` **^11.0.2**; `angularx-qrcode` **^16.0.2**; **Ivy-only deps:** `@angular-slider/ngx-slider` **^16.0.1**, `ngx-pagination` **^6.0.3**, `ngx-quicklink` **^0.4.3** (Angular 16 dropped ngcc / View Engine packages). CLI: guard migration removed deprecated `implements CanActivate` from `guest`, `account`, `user`, `checkout` guards; `angular.json` server builder disables `buildOptimizer` for non-optimized builds. Verified: `ng build --configuration=development`, `ng run ecommerce:server:development`. |
| **16 → 17** | `upgrade/angular-17` | `ng update` to v17; **TypeScript ~5.4.5**, **zone.js ~0.14.10**. **`@nguniversal/*` → `@angular/ssr`**: new `CommonEngine` + Express `server.ts`; `serve-ssr` / `prerender` use **`buildTarget`** (not `browserTarget`). Third-party: `@angular-slider/ngx-slider` **^17.0.2**, `@angular/youtube-player` **^17.3.10**, `angularx-qrcode` **^17.0.1**, `ngx-bootstrap` **^12.0.0**, `ngx-quicklink` **^0.4.5**. **`src/main.server.ts`**: default export for SSR bootstrap. **`server.ts`**: use `import from 'fs'` / `'path'` (not `node:fs` / `node:path`) so the server tsconfig resolves modules. Verified: `ng build --configuration=development`, `ng run ecommerce:server:development`. |
| **17 → 18** | `upgrade/angular-18` | `ng update` to v18 (**@angular/core** / **cli** **^18.2.x**, **@angular/ssr** **^18.2.21**). Core migration: **`AppModule`** uses **`provideHttpClient(withInterceptorsFromDi())`** (standalone HTTP provider). Third-party aligned: `@angular-slider/ngx-slider` **^18.0.0**, `@angular/youtube-player` **^18.2.14**, `angularx-qrcode` **^18.0.2**, `ngx-bootstrap` **^18.1.3**. **zone.js** remains **~0.14.10**; **TypeScript ~5.4.5**. Optional CLI migration offered: `use-application-builder` (not applied). Verified: `ng build --configuration=development`, `ng run ecommerce:server:development`. |
| **18 → 19** | `upgrade/angular-19` | `ng update` to v19 (**@angular/core** / **cli** **^19.2.x**, **@angular/ssr** **^19.2.25**). **TypeScript ~5.8.3**, **zone.js ~0.15.1**. Migrations: **`CommonEngine`** import → **`@angular/ssr/node`** in **`server.ts`**; components/directives/pipes get explicit **`standalone: false`** where applicable. **`BrowserModule.withServerTransition`** removed — use **`BrowserModule`** + **`{ provide: APP_ID, useValue: 'serverApp' }`**. **`@types/node` ^20** (for **`node:http`** in **`@angular/ssr/node`** typings). Third-party: `@angular-slider/ngx-slider` **^19.0.0**, `@angular/youtube-player` **^19.2.19**, `angularx-qrcode` **^19.0.0** (standalone **`QRCodeComponent`** replaces **`QRCodeModule`** in **`product-order-details.module.ts`**), `ngx-bootstrap` **^19.0.2**. Verified: `ng build --configuration=development`, `ng run ecommerce:server:development`. |

Next: commit on branch `upgrade/angular-19`, push, PR → merge, then `upgrade/angular-20` for the following hop. **Smoke-test** SSR, checkout QR modal, and `ngx-bootstrap` modals after deploy.
