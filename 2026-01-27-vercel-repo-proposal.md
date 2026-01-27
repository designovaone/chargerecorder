# Vercel Multi-Repo Deployment Strategy

## Goal

Deploy multiple independent projects as subdomains under `coffeit.com`, with each project living in its own repository.

## Proposed Architecture

```
coffeit.com
├── chargerecorder.coffeit.com  → Repo: charge-recorder
├── app2.coffeit.com            → Repo: some-other-app
├── app3.coffeit.com            → Repo: third-app
└── www.coffeit.com             → Landing page
```

## How It Works

### 1. One Vercel Project Per Repo

Each GitHub repository connects to its own Vercel project:

| Repo | Vercel Project | Domain | Tech Stack |
|------|----------------|--------|------------|
| `charge-recorder` | Project A | `chargerecorder.coffeit.com` | Next.js + Neon |
| `some-other-app` | Project B | `app2.coffeit.com` | Whatever needed |
| `coffee-landing` | Project C | `www.coffeit.com` | Static/Next.js |

### 2. Custom Domain Configuration Per Project

In each Vercel project's dashboard:
- Settings → Domains → Add `[subdomain].coffeit.com`
- Vercel handles SSL certificates automatically

### 3. One-Time Domain Setup

Add `coffeit.com` to Vercel account once:
- Vercel Dashboard → Settings → Domains → Add `coffeit.com`
- This enables any subdomain across all projects

## Git Structure

```
github.com/yourusername/
├── charge-recorder/       # chargerecorder.coffeit.com
├── coffee-tracker/        # tracker.coffeit.com
├── coffee-landing/        # www.coffeit.com
└── other-service/         # service.coffeit.com
```

## Benefits

- **Independent projects**: Each repo has its own stack, dependencies, CI/CD
- **No monorepo complexity**: No workspace management, no shared build configs
- **Isolated deployments**: One project broken doesn't affect others
- **Simple IDE workflow**: Clone only what you're working on
- **Flexible scaling**: Each project can have different resource needs

## Landing Page

Simple static page at `www.coffeit.com` with links to all subdomain projects:

```html
<a href="https://chargerecorder.coffeit.com">Charge Recorder</a>
<a href="https://tracker.coffeit.com">Coffee Tracker</a>
<a href="https://service.coffeit.com">Other Service</a>
```
