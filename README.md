# Product Manager Hub

A static website for automotive product managers focused on product architecture, market layout, PRD workflows, and competitor benchmarking.

## Site Structure

- `index.html`: Home page and navigation
- `matrix.html`: Product matrix by KKL / GKL / MKL with filterable detailed model table
- `prd.html`: Standard PRD workflow and template for automotive product managers
- `score.html`: Competitor scoring page with interactive sliders and radar chart export
- `assets/matrix-data.json`: External data source for product matrix records
- `assets/score-config.json`: External data source for competitor scoring baseline

## Core Features

### 1. Product Matrix

The matrix page provides two layers of analysis:

- Strategic matrix by brand and segment: BMW, Mercedes-Benz, Geely
- Filterable detailed table by brand, segment, powertrain, price band, and launch region

Supported segment columns:

- `KKL`: Compact / entry mainstream
- `GKL`: Mid to upper-mainstream / business-family core
- `MKL`: Premium flagship / high-end strategic layer

### 2. PRD Workflow

The PRD page includes:

- Standard 9-step product definition process
- Automotive-specific PRD structure
- Built-in section for product architecture and market layout
- Deliverables list for planning and review

### 3. Competitor Scoring

The scoring page includes:

- External JSON-driven benchmark configuration
- Interactive sliders for score adjustment
- Radar chart visualization
- PNG export for report usage

## JSON Schema Reference

### `assets/matrix-data.json`

Required root fields:

- `version`: string
- `updatedAt`: string
- `rows`: array

Required fields for each row in `rows`:

- `brand`: string
- `tier`: string
- `model`: string
- `priceBand`: string
- `power`: string
- `region`: string

Example:

```json
{
  "version": "2026Q3",
  "updatedAt": "2026-07-08",
  "rows": [
    {
      "brand": "BMW",
      "tier": "GKL",
      "model": "5 Series",
      "priceBand": "EUR 60k-85k",
      "power": "HEV/PHEV",
      "region": "Europe / China / US"
    }
  ]
}
```

### `assets/score-config.json`

Required root fields:

- `version`: string
- `updatedAt`: string
- `labels`: array of 3 strings
- `datasets`: non-empty array

Required fields for each item in `datasets`:

- `name`: string
- `color`: string
- `values`: array of 3 numbers

Example:

```json
{
  "version": "2026Q3",
  "updatedAt": "2026-07-08",
  "labels": ["产品力", "市场力", "盈利力"],
  "datasets": [
    {
      "name": "BMW",
      "color": "#20639b",
      "values": [8.5, 8.2, 8.4]
    }
  ]
}
```

## Update Workflow

### Update quarterly matrix data

1. Edit `assets/matrix-data.json`
2. Update `version` and `updatedAt`
3. Append or revise rows in `rows`
4. Commit and push to `main`

### Update quarterly scoring baseline

1. Edit `assets/score-config.json`
2. Update `version` and `updatedAt`
3. Revise the `datasets` score values
4. Commit and push to `main`

### Validate in browser

- Open `matrix.html` to verify data loading and validation messages
- Open `score.html` to verify score config loading, sliders, radar chart, and PNG export

## GitHub Pages Deployment

This repository is configured to deploy automatically with GitHub Actions.

Expected site URL:

- `https://ttoriaa.github.io/product-manager/`

If GitHub Pages has not been enabled yet in repository settings:

1. Open repository Settings
2. Go to Pages
3. Set Source to `GitHub Actions`

After that, every push to `main` will publish the latest static site automatically.
