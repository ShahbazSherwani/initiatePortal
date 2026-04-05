import type { CampaignSuitabilityInfo } from './suitability';

// ── Feed-level campaign shape ─────────────────────────────────────────────────
export interface FeedCampaign {
  id: number | string;
  title: string;
  description: string;
  imageUrl: string | null;
  industry: string;
  projectType: string;          // "Individuals" | "MSME(Company)"
  campaignType: string;         // "lending" | "equity" | "donation"
  riskLevel: 'Low' | 'Medium' | 'High';
  fundingRaised: number;
  fundingGoal: number;
  estReturn: string;
  duration: string;
  tenorMonths: number;
  status: string;
  company: { name: string; city: string };
}

// ── Map raw API project → FeedCampaign ────────────────────────────────────────
export function mapProjectToFeed(project: any): FeedCampaign {
  const pd = project?.project_data || {};
  const d = pd?.details || {};
  const issuer = pd?.issuerForm || {};

  // Title
  const title = d.product || 'Unnamed Project';

  // Description
  const description = d.overview || 'No description available';

  // Image — could be a full URL or a base64 string
  const raw = d.image || null;
  const imageUrl = raw && typeof raw === 'string' && raw.length < 500 ? raw : null;

  // Industry from category or business nature
  const industry = normalizeIndustry(d.category || issuer.natureOfBusiness || '');

  // Project type
  const projectType = project.creator_is_individual ? 'Individuals' : 'MSME(Company)';

  // Campaign type (debt/equity/donation)
  const campaignType = (d.projectType || pd.type || 'lending').toLowerCase();

  // Risk level
  const rawRisk = (d.riskLevel || 'medium').toLowerCase();
  const riskLevel = rawRisk === 'low' ? 'Low' : rawRisk === 'high' ? 'High' : 'Medium';

  // Funding numbers
  const fundingRaised = parseFloat(pd?.funding?.totalFunded ?? d?.fundedAmount ?? pd?.totalFunded ?? '0') || 0;
  const fundingGoal = parseFloat(d?.loanAmount ?? d?.investmentAmount ?? d?.fundingAmount ?? d?.projectRequirements ?? pd?.targetAmount ?? '0') || 0;

  // Return rate
  const estReturn = (pd.estimatedReturn || d.investorPercentage || 'N/A') + '%';

  // Duration / Tenor
  const durationStr = d.timeDuration || d.duration || d.loanDuration || '';
  const tenorMonths = parseTenorMonths(durationStr);
  const duration = formatDuration(durationStr);

  // Status
  const status = (pd.status || 'Active');

  // Company / Issuer
  const companyName = issuer.companyName || project.full_name || 'Unknown Issuer';
  const city = issuer.addressCity || d.location || '';

  return {
    id: project.id,
    title,
    description,
    imageUrl,
    industry,
    projectType,
    campaignType,
    riskLevel,
    fundingRaised,
    fundingGoal,
    estReturn,
    duration,
    tenorMonths,
    status,
    company: { name: companyName, city },
  };
}

// ── Convert a FeedCampaign into what suitability.ts expects ───────────────────
export function toSuitabilityInfo(c: FeedCampaign): CampaignSuitabilityInfo {
  const type = c.campaignType.includes('equity') ? 'equity'
    : c.campaignType.includes('donat') ? 'donation'
    : 'lending';
  return {
    type,
    riskLevel: c.riskLevel.toLowerCase() as 'low' | 'medium' | 'high',
    tenorMonths: c.tenorMonths,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeIndustry(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('agri') || lower.includes('farm')) return 'Agriculture';
  if (lower.includes('hospital') || lower.includes('hotel') || lower.includes('tourism')) return 'Hospitality';
  if (lower.includes('food') || lower.includes('beverage') || lower.includes('restaurant') || lower.includes('coffee')) return 'Food & Beverages';
  if (lower.includes('retail') || lower.includes('shop') || lower.includes('store')) return 'Retail';
  if (lower.includes('medical') || lower.includes('health') || lower.includes('pharma') || lower.includes('diagnostic')) return 'Medical & Pharmaceutical';
  if (lower.includes('construct') || lower.includes('build') || lower.includes('housing') || lower.includes('solar')) return 'Construction';
  if (raw.trim()) return raw.trim();
  return 'Others';
}

function parseTenorMonths(raw: string): number {
  if (!raw) return 12;
  // If it's an ISO date, compute months from now
  const d = new Date(raw);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
    const months = Math.max(1, Math.round((d.getTime() - Date.now()) / (30.44 * 24 * 60 * 60 * 1000)));
    return months;
  }
  // If it's a plain number (months)
  const n = parseFloat(raw);
  if (!isNaN(n) && n > 0) return n;
  return 12;
}

function formatDuration(raw: string): string {
  if (!raw) return 'TBD';
  const d = new Date(raw);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return raw || 'TBD';
}
