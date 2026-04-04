# CampaignPage — Integration Guide

## Quick Start

The component works out-of-the-box with sample data. To connect your own data, pass props:

```jsx
import CampaignPage from "./CampaignPage";

function App() {
  return (
    <CampaignPage
      campaign={campaignData}
      company={companyData}
      escrowSteps={escrowSteps}
      gallery={galleryImages}
      keyPeople={keyPeople}
      directors={directors}
      financials={financials}
      documents={documents}
      onInvest={(amount) => handleInvest(amount)}
    />
  );
}
```

Every prop is **optional** — omit any and the component falls back to built-in sample data.

---

## Props Reference

### `campaign` — Campaign details

```ts
{
  title: string;              // "Solar Installer"
  status: string;             // "Pending" | "Funds Received" | "Escrow Secured" | "Released to Issuer"
  description: string;        // Campaign description text
  riskLevel: string;          // "Low" | "Medium" | "High"
  requiredFunding: string;    // "₱5,000,000"
  estReturn: string;          // "4%"
  duration: string;           // "May 30, 2026"
  minInvestment: number;      // 100
  retailLimit: string;        // "₱500,001,100,000"
  used: string;               // "₱0"
  remainingCapacity: string;  // "₱500,001,100,000"
}
```

### `company` — Campaign creator / issuer details

```ts
{
  name: string;              // "Solar Installer PH"
  registeredName: string;    // "Solar Installer Philippines Inc."
  industry: string;          // "Renewable Energy — Solar Installation"
  city: string;              // "Makati City"
  yearFounded: number;       // 2019
  secRegistration: string;   // "CS202301234"
  description: string;       // Company bio paragraph
  teamSize: string;          // "50–100 employees"
  website: string;           // "solarinstaller.ph"
  logoUrl: string | null;    // URL to company logo, or null for default icon
}
```

### `escrowSteps` — Escrow progress tracker

```ts
Array<{
  label: string;    // "Pending"
  done: boolean;    // true if step is completed
  active: boolean;  // true if this is the current step
}>
```

Order matters — the component renders them left to right. Example:

```js
[
  { label: "Pending",            done: true,  active: false },
  { label: "Funds Received",     done: true,  active: true  },
  { label: "Escrow Secured",     done: false, active: false },
  { label: "Released to Issuer", done: false, active: false },
]
```

### `gallery` — Campaign images

```ts
Array<{
  id: number | string;     // Unique identifier
  url: string | null;      // Image URL — null shows gradient placeholder
  caption: string;         // "Rooftop installation in Makati"
}>
```

The **first item** becomes the large featured image. Items 2–5 appear in the 2×2 thumbnail grid. If there are more than 5, the last thumbnail shows a "+N more" overlay. All images are accessible through the lightbox.

### `keyPeople` — Core team (Company tab)

```ts
Array<{
  name: string;   // "Giovanni Santos"
  role: string;   // "Chief Executive Officer"
}>
```

Initials are auto-generated from the name — no need to supply them.

### `directors` — Board directors & management (Company tab)

```ts
Array<{
  name: string;      // "Giovanni Santos"
  position: string;  // "Chairman / CEO"
  type: string;      // "Director" | "Management"
}>
```

The component provides a toggle to filter between Directors, Management, or All. Initials are auto-generated.

### `financials` — Financial statement data (Company tab)

```ts
Array<{
  year: string;            // "2024"
  grossRevenue: number;    // 85400000
  netIncome: number;       // 12300000 (use negative for losses)
  totalAssets: number;     // 142000000
  totalLiabilities: number; // 58700000
}>
```

Order by most recent year first. The component auto-calculates YoY percentage changes, formats values into `₱XX.XXM`, and displays negative values in red with parentheses `(₱2.15M)`.

### `documents` — Downloadable files (Documents tab)

```ts
Array<{
  name: string;       // "Annual Report 2025"
  type: string;       // "PDF"
  size: string;       // "2.4 MB"
  category: string;   // "Financial" | "Legal" | "General"
  url: string;        // Download URL
}>
```

Categories are auto-extracted for the filter pills. You can add custom categories — they'll use the "General" color scheme by default.

### `onInvest` — Investment callback

```ts
(amount: number) => void
```

Called when the user clicks "Continue". Receives the parsed amount as a number.

---

## Connecting to an API

### Example with fetch

```jsx
import { useState, useEffect } from "react";
import CampaignPage from "./CampaignPage";

function CampaignView({ campaignId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, [campaignId]);

  if (loading) return <div>Loading...</div>;

  return (
    <CampaignPage
      campaign={data.campaign}
      company={data.company}
      escrowSteps={data.escrowSteps}
      gallery={data.gallery}
      keyPeople={data.keyPeople}
      directors={data.directors}
      financials={data.financials}
      documents={data.documents}
      onInvest={(amount) => {
        fetch(`/api/campaigns/${campaignId}/invest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
      }}
    />
  );
}
```

### Example with Axios + React Query

```jsx
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import CampaignPage from "./CampaignPage";

function CampaignView({ id }) {
  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => axios.get(`/api/campaigns/${id}`).then(r => r.data),
  });

  if (isLoading) return <div>Loading...</div>;

  return <CampaignPage {...data} onInvest={(amt) => invest(id, amt)} />;
}
```

---

## API Response Shape

Structure your backend response to match the props directly:

```json
{
  "campaign": {
    "title": "Solar Installer",
    "status": "Pending",
    "description": "...",
    "riskLevel": "Medium",
    "requiredFunding": "₱5,000,000",
    "estReturn": "4%",
    "duration": "May 30, 2026",
    "minInvestment": 100,
    "retailLimit": "₱500,001,100,000",
    "used": "₱0",
    "remainingCapacity": "₱500,001,100,000"
  },
  "company": {
    "name": "Solar Installer PH",
    "registeredName": "Solar Installer Philippines Inc.",
    "industry": "Renewable Energy — Solar Installation",
    "city": "Makati City",
    "yearFounded": 2019,
    "secRegistration": "CS202301234",
    "description": "...",
    "teamSize": "50–100 employees",
    "website": "solarinstaller.ph",
    "logoUrl": "https://example.com/logo.png"
  },
  "escrowSteps": [
    { "label": "Pending", "done": true, "active": true },
    { "label": "Funds Received", "done": false, "active": false },
    { "label": "Escrow Secured", "done": false, "active": false },
    { "label": "Released to Issuer", "done": false, "active": false }
  ],
  "gallery": [
    { "id": 1, "url": "https://cdn.example.com/img1.jpg", "caption": "Rooftop installation" }
  ],
  "keyPeople": [
    { "name": "Giovanni Santos", "role": "CEO" }
  ],
  "directors": [
    { "name": "Giovanni Santos", "position": "Chairman / CEO", "type": "Director" }
  ],
  "financials": [
    {
      "year": "2024",
      "grossRevenue": 85400000,
      "netIncome": 12300000,
      "totalAssets": 142000000,
      "totalLiabilities": 58700000
    }
  ],
  "documents": [
    { "name": "Annual Report 2025", "type": "PDF", "size": "2.4 MB", "category": "Financial", "url": "/files/report.pdf" }
  ]
}
```

---

## Data Mapping

If your API uses different field names, create a mapping layer:

```js
// utils/mapCampaignData.js

export function mapApiResponse(api) {
  return {
    campaign: {
      title:             api.campaign_name,
      status:            api.escrow_status,
      description:       api.campaign_description,
      riskLevel:         api.risk_assessment,        // must be "Low" | "Medium" | "High"
      requiredFunding:   `₱${api.target_amount?.toLocaleString()}`,
      estReturn:         `${api.expected_return}%`,
      duration:          api.maturity_date,
      minInvestment:     api.minimum_investment,
      retailLimit:       `₱${api.retail_limit?.toLocaleString()}`,
      used:              `₱${api.amount_used?.toLocaleString()}`,
      remainingCapacity: `₱${api.remaining_capacity?.toLocaleString()}`,
    },
    company: {
      name:            api.issuer.company_name,
      registeredName:  api.issuer.registered_name,
      industry:        api.issuer.sector,
      city:            api.issuer.city,
      yearFounded:     api.issuer.year_established,
      secRegistration: api.issuer.sec_reg_no,
      description:     api.issuer.about,
      teamSize:        api.issuer.employee_count,
      website:         api.issuer.website_url,
      logoUrl:         api.issuer.logo_url,
    },
    escrowSteps: api.escrow_steps.map(s => ({
      label:  s.step_name,
      done:   s.is_completed,
      active: s.is_current,
    })),
    gallery: api.images.map((img, i) => ({
      id:      img.image_id || i,
      url:     img.image_url,
      caption: img.image_caption || "",
    })),
    keyPeople: api.key_officers.map(p => ({
      name: p.full_name,
      role: p.designation,
    })),
    directors: api.board_and_management.map(p => ({
      name:     p.full_name,
      position: p.designation,
      type:     p.is_director ? "Director" : "Management",
    })),
    financials: api.financial_data.map(f => ({
      year:             String(f.fiscal_year),
      grossRevenue:     f.gross_revenue,
      netIncome:        f.net_income_loss,
      totalAssets:      f.total_assets,
      totalLiabilities: f.total_liabilities,
    })),
    documents: api.attachments.map(d => ({
      name:     d.file_name,
      type:     d.file_type,
      size:     d.file_size,
      category: d.document_category,
      url:      d.download_url,
    })),
  };
}
```

Then use it:

```jsx
import { mapApiResponse } from "./utils/mapCampaignData";

const mapped = mapApiResponse(apiResponse);
return <CampaignPage {...mapped} onInvest={handleInvest} />;
```

---

## Partial Data

You don't need all props. The component handles missing data gracefully:

```jsx
// Only campaign + company, everything else uses defaults
<CampaignPage
  campaign={myCampaign}
  company={myCompany}
/>

// No directors section? Pass an empty array to hide it
<CampaignPage
  campaign={myCampaign}
  company={myCompany}
  directors={[]}
  financials={[]}
/>
```

---

## Customizing Categories

Document categories auto-generate filter pills. Built-in color mappings:

| Category    | Background | Text Color | Border  |
|-------------|-----------|------------|---------|
| Financial   | #FFF7ED   | #C2410C    | #FDBA74 |
| Legal       | #EFF6FF   | #1D4ED8    | #93C5FD |
| General     | #F0FDF4   | #15803D    | #86EFAC |

Custom categories default to the "General" color scheme.

---

## Component Structure

```
CampaignPage (main export)
├── Lightbox           — fullscreen image gallery modal
├── Header             — campaign title, status badge, verification banner
├── Gallery            — featured image + thumbnail grid
├── Tab Navigation     — overview / company / documents
│   ├── OverviewTab
│   │   ├── Campaign Details (escrow, metrics)
│   │   ├── Risk Assessment (meter + badge)
│   │   └── Investor Note
│   ├── CompanyTab
│   │   ├── Company Profile (details grid)
│   │   ├── Key People (avatar cards)
│   │   ├── Directors & Management (filterable list)
│   │   └── Financial Statements (YoY comparison cards)
│   └── DocumentsTab
│       └── Filterable document list with download links
└── Sidebar (sticky on desktop)
    ├── Investment Widget (amount input + CTA)
    └── Company Snapshot (quick summary card)
```

### Reusable Sub-components (internal)

| Component     | Purpose                                         |
|---------------|-------------------------------------------------|
| `Card`        | White card wrapper with border                  |
| `Title`       | Fraunces serif section heading                  |
| `Badge`       | Colored pill (status, category, risk)           |
| `Avatar`      | Circle with auto-generated initials from name   |
| `PillToggle`  | Segmented toggle button group                   |
| `CampaignImage` | Renders `<img>` if URL exists, gradient SVG placeholder if null |

---

## Responsive Breakpoints

| Breakpoint | Layout                                                      |
|------------|-------------------------------------------------------------|
| >1024px    | 2-column: content + sticky sidebar                          |
| ≤1024px    | 1-column: sidebar moves to top, sticky disabled             |
| ≤640px     | Compact: stacked gallery, single-column grids, tighter padding |

---
---

# CampaignFeed — Integration Guide

The campaign feed page lists all investment opportunities and filters them by the investor's risk profile.

## Quick Start

```jsx
import CampaignFeed from "./CampaignFeed";

function InvestorDashboard() {
  return (
    <CampaignFeed
      investor={{ name: "Juan", riskProfile: "Moderate" }}
      campaigns={campaignsFromApi}
      onViewDetails={(campaignId) => navigate(`/campaign/${campaignId}`)}
    />
  );
}
```

## Props

### `investor` — Current logged-in investor

```ts
{
  name: string;          // "Juan Dela Cruz"
  riskProfile: string;   // "Conservative" | "Moderate" | "Aggressive"
}
```

### `campaigns` — Array of available campaigns

```ts
Array<{
  id: number | string;
  title: string;
  description: string;
  imageUrl: string | null;
  industry: string;          // "Agriculture" | "Construction" | etc.
  projectType: string;       // "Individuals" | "MSME(Company)" | etc.
  riskLevel: string;         // "Low" | "Medium" | "High"
  fundingRaised: number;     // 7500
  fundingGoal: number;       // 100000
  estReturn: string;         // "25%"
  duration: string;          // "Dec 15, 2026"
  status: string;            // "Active"
  company: {
    name: string;
    city: string;
  };
}>
```

### `onViewDetails` — Navigation callback

```ts
(campaignId: number | string) => void
```

Called when investor clicks "View Details" on an eligible campaign. Use this to navigate to the `CampaignPage`.

## Risk Profile Suitability Matrix

The component uses this matrix to determine eligibility:

| Investor Profile | Allowed Campaign Risk Levels |
|-----------------|------------------------------|
| Conservative    | Low                          |
| Moderate        | Low, Medium                  |
| Aggressive      | Low, Medium, High            |

## Tab Behavior

### "For You" Tab (default)
- Shows **only** campaigns matching the investor's risk profile
- Displays an info banner showing the active profile and what it allows
- All cards are fully interactive with "View Details" buttons

### "All Campaigns" Tab
- Shows **all** campaigns regardless of risk profile
- Ineligible campaigns show:
  - Grayed-out / dimmed card image with a lock icon overlay
  - "Not eligible for your Risk Profile" message replacing the CTA
  - Hint text showing the mismatch (e.g., "Your profile: Conservative · Required: High")
- Eligible campaigns remain fully interactive
- A risk legend bar shows which levels are allowed (✓) or blocked (✗)

## Connecting CampaignFeed → CampaignPage

```jsx
import { useState } from "react";
import CampaignFeed from "./CampaignFeed";
import CampaignPage from "./CampaignPage";

function App() {
  const [selectedId, setSelectedId] = useState(null);

  // User clicked "View Details"
  if (selectedId) {
    const campaignData = fetchCampaignById(selectedId);
    return (
      <CampaignPage
        {...campaignData}
        onInvest={(amount) => submitInvestment(selectedId, amount)}
      />
    );
  }

  return (
    <CampaignFeed
      investor={currentInvestor}
      campaigns={allCampaigns}
      onViewDetails={(id) => setSelectedId(id)}
    />
  );
}
```

## Responsive Breakpoints

| Breakpoint | Layout                                |
|------------|---------------------------------------|
| >1024px    | 3-column card grid, inline filters    |
| ≤1024px    | 2-column grid, 2-column filter panel  |
| ≤640px     | 1-column grid, stacked filters        |
