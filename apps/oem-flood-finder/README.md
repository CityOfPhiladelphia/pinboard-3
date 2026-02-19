# oem-flood-finder

Static site application for OEM flood monitoring. Part of the [pinboard-3](../../README.md) monorepo.

## Architecture

![Architecture Diagram](https://github.com/CityOfPhiladelphia/phila-ctl/blob/main/packages/constructs/docs/diagrams/static-site.drawio)

View the [architecture diagram](https://github.com/CityOfPhiladelphia/phila-ctl/blob/main/packages/constructs/docs/diagrams/static-site.drawio) in draw.io or VS Code with the Draw.io extension.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- AWS CLI configured with SSO
- AWS profiles configured for each environment (see city.config.json)
- `city` CLI (`npm install -g @phila/cli`)

### Setup

```bash
# From monorepo root
pnpm install

# Run dev server
pnpm dev:oem

# Or from this directory
pnpm dev
```

### Deployment

```bash
# Deploy infrastructure (first time or after CDK changes)
city deploy dev

# Ship frontend updates
city ship dev --web
```

## Project Structure

```
.
├── cdk/                    # CDK infrastructure code
│   └── app.ts              # StaticSite construct
├── frontend/               # Vue 3 + Vite application
│   ├── src/                # App source
│   ├── public/             # Static assets
│   └── dist/               # Build output (deployed to S3)
└── city.config.json        # City CLI configuration
```

## Resources Created

- **S3 Bucket** — Static asset storage
- **CloudFront Distribution** — Global CDN
- **Origin Access Control** — Secure S3 access
- **SSM Parameters** — URL, distribution ID, bucket name

## Shipping Updates

After the initial `city deploy`, use `city ship --web` for frontend-only updates:

```bash
# Build and deploy frontend to dev
city ship dev --web

# Deploy to production
city ship prod --web
```

This syncs files to S3 and invalidates the CloudFront cache.
