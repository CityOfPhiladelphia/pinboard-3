# oem-flood-finder

Static site application using Philadelphia constructs.

## Architecture

![Architecture Diagram](https://github.com/CityOfPhiladelphia/phila-ctl/blob/main/packages/constructs/docs/diagrams/static-site.drawio)

View the [architecture diagram](https://github.com/CityOfPhiladelphia/phila-ctl/blob/main/packages/constructs/docs/diagrams/static-site.drawio) in draw.io or VS Code with the Draw.io extension.

## Quick Start

### Prerequisites

- Node.js 20+
- AWS CLI configured with SSO
- AWS profiles configured for each environment (see city.config.json)

### Setup

```bash
# Install dependencies
pnpm install

# Set up frontend (replace placeholder with Nuxt)
cd frontend
pnpm exec nuxi@latest init .
# Configure nuxt.config.ts for SSG
```

### Deployment

```bash
# Deploy infrastructure to dev
city deploy dev

# Ship frontend updates
city ship dev --web
```

## Project Structure

```
.
├── cdk/                    # CDK infrastructure code
│   └── app.ts              # StaticSite construct
├── frontend/               # Nuxt application
│   └── ...                 # Replace with Nuxt project
└── city.config.json        # City CLI configuration
```

## Resources Created

This application creates:

- **S3 Bucket** - Static asset storage
- **CloudFront Distribution** - Global CDN
- **Origin Access Control** - Secure S3 access
- **SSM Parameters** - URL, distribution ID, bucket name

## Shipping Updates

After the initial `city deploy`, use `city ship --web` for fast frontend updates:

```bash
# Build and deploy frontend
city ship dev --web

# Deploy to production
city ship prod --web
```

This syncs files to S3 and invalidates CloudFront cache.
