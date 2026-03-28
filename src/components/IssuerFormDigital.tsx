import React, { useState } from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { ChevronDown, ChevronUp, Plus, Trash2, AlertCircle } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DirectorOfficer {
  fullName: string;
  currentPosition: string;
  currentFunction: string;
  type: 'Director' | 'Management';
  employmentHistory: { year: string; position: string; employer: string }[];
}

export interface FinancialStatement {
  year: string;
  grossRevenue: string;
  netIncome: string;
  totalAssets: string;
  totalLiabilities: string;
}

export interface CampaignDocument {
  name: string;
  category: 'Financial' | 'Legal' | 'General';
  fileData: string; // base64 data URL
  fileSize: string;
  fileType: string;
}

export interface BeneficialOwner {
  fullName: string;
  votingPower: string;
  ownershipPercent: string;
}

export interface IssuerFormData {
  // Campaign Data
  financialStatements: FinancialStatement[];
  campaignDocuments: CampaignDocument[];
  // Section 1: Issuer Information
  businessType: string;
  businessTypeOther: string;
  businessSize: string;
  registrationAuthority: string[];
  registrationOther: string;
  tin: string;
  secRegNo: string;
  dtiRegNo: string;
  companyName: string;
  totalEmployees: string;
  ownerLastName: string;
  ownerFirstName: string;
  ownerMiddleName: string;
  ownerMaritalStatus: string;
  // Address
  addressNo: string;
  addressStreet: string;
  addressBarangay: string;
  addressCity: string;
  addressProvince: string;
  addressRegion: string;
  addressZip: string;
  // Contact
  areaCode: string;
  telephone: string;
  website: string;
  fax: string;
  cellphone: string;
  email: string;
  // Section 1.1
  directorsOfficers: DirectorOfficer[];
  // Section 1.2
  beneficialOwners: BeneficialOwner[];
  // Section 1.2 sub-sections
  ownershipCapitalStructure: string;
  termsOfSecurities: string;
  principalShareholdersRights: string;
  howSecuritiesValued: string;
  riskToPurchasers: string;
  restrictionsOnTransfer: string;
  // Section 1.3
  materialInterest: string;
  // Section 1.4
  materialRiskFactors: string;
  // Section 2
  natureOfBusiness: string;
  businessPlan: string;
  targetOfferingAmount: string;
  targetOfferingDeadline: string;
  // Section 3
  useOfProceeds: string;
  // Section 4
  investmentCommitmentsLessThanTarget: string;
  investorMaterialChangesAck: boolean;
  acceptExcessInvestments: string;
  excessMaxAmount: string;
  oversubscriptionMethod: string;
  completingCancelingCommitment: string;
  // Section 5
  methodDeterminingPrice: string;
  // Section 6
  pastExemptOfferings: string;
  // Section 7
  indebtedness: string;
  liquidity: string;
  capitalResources: string;
  historicalOperations: string;
  financialOther: string;
  // Section 8
  intermediaryName: string;
  intermediarySecRegNo: string;
  intermediaryType: string;
  intermediaryCompensation: string;
  // Disqualification
  disqualificationNone: boolean;
  // Signatures
  principalExecutiveOfficer: string;
  comptroller: string;
  principalOperatingOfficer: string;
  corporateSecretary: string;
  signatureDate: string;
}

export const defaultIssuerFormData: IssuerFormData = {
  businessType: '',
  businessTypeOther: '',
  businessSize: '',
  registrationAuthority: [],
  registrationOther: '',
  tin: '',
  secRegNo: '',
  dtiRegNo: '',
  companyName: '',
  totalEmployees: '',
  ownerLastName: '',
  ownerFirstName: '',
  ownerMiddleName: '',
  ownerMaritalStatus: '',
  addressNo: '',
  addressStreet: '',
  addressBarangay: '',
  addressCity: '',
  addressProvince: '',
  addressRegion: '',
  addressZip: '',
  areaCode: '',
  telephone: '',
  website: '',
  fax: '',
  cellphone: '',
  email: '',
  financialStatements: [],
  campaignDocuments: [],
  directorsOfficers: [{ fullName: '', currentPosition: '', currentFunction: '', type: 'Director' as const, employmentHistory: [{ year: '', position: '', employer: '' }] }],
  beneficialOwners: [{ fullName: '', votingPower: '', ownershipPercent: '' }],
  ownershipCapitalStructure: '',
  termsOfSecurities: '',
  principalShareholdersRights: '',
  howSecuritiesValued: '',
  riskToPurchasers: '',
  restrictionsOnTransfer: '',
  materialInterest: '',
  materialRiskFactors: '',
  natureOfBusiness: '',
  businessPlan: '',
  targetOfferingAmount: '',
  targetOfferingDeadline: '',
  useOfProceeds: '',
  investmentCommitmentsLessThanTarget: '',
  investorMaterialChangesAck: false,
  acceptExcessInvestments: '',
  excessMaxAmount: '',
  oversubscriptionMethod: '',
  completingCancelingCommitment: '',
  methodDeterminingPrice: '',
  pastExemptOfferings: '',
  indebtedness: '',
  liquidity: '',
  capitalResources: '',
  historicalOperations: '',
  financialOther: '',
  intermediaryName: '',
  intermediarySecRegNo: '',
  intermediaryType: '',
  intermediaryCompensation: '',
  disqualificationNone: false,
  principalExecutiveOfficer: '',
  comptroller: '',
  principalOperatingOfficer: '',
  corporateSecretary: '',
  signatureDate: '',
};

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateIssuerForm(data: IssuerFormData): string[] {
  const errors: string[] = [];
  if (!data.businessType) errors.push('Business type is required');
  if (!data.businessSize) errors.push('Business size is required');
  if (!data.companyName.trim()) errors.push('Company name is required');
  if (!data.tin.trim()) errors.push('TIN is required');
  if (!data.addressCity.trim()) errors.push('City is required');
  if (!data.cellphone.trim()) errors.push('Cellphone is required');
  if (!data.email.trim()) errors.push('Email is required');
  if (!data.natureOfBusiness.trim()) errors.push('Nature of business is required');
  if (!data.businessPlan.trim()) errors.push('Business plan is required');
  if (!data.targetOfferingAmount.trim()) errors.push('Target offering amount is required');
  if (!data.useOfProceeds.trim()) errors.push('Use of proceeds is required');
  if (!data.methodDeterminingPrice.trim()) errors.push('Method of determining price is required');
  if (!data.disqualificationNone) errors.push('Disqualification confirmation is required');
  if (!data.principalExecutiveOfficer.trim()) errors.push('Principal Executive Officer name is required');
  if (!data.signatureDate) errors.push('Signature date is required');
  return errors;
}

// ─── Shared input class to match parent form styling ─────────────────────────
const inputClass = "w-full py-3 px-3 rounded-2xl border";
const textareaClass = "w-full py-3 px-3 rounded-2xl border resize-none";
const labelClass = "font-medium text-black text-base block mb-2";
const subLabelClass = "font-medium text-gray-600 text-base block mb-2";

// ─── Collapsible Section ─────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-2xl mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 rounded-t-2xl text-left font-semibold text-base text-gray-800"
      >
        {title}
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {open && <div className="px-6 py-6 space-y-6">{children}</div>}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface IssuerFormDigitalProps {
  data: IssuerFormData;
  onChange: (data: IssuerFormData) => void;
  errors?: string[];
  readOnly?: boolean;
}

export const IssuerFormDigital: React.FC<IssuerFormDigitalProps> = ({ data, onChange, errors = [], readOnly = false }) => {
  const update = (field: keyof IssuerFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateDirector = (index: number, field: keyof DirectorOfficer, value: any) => {
    const updated = [...data.directorsOfficers];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, directorsOfficers: updated });
  };

  const updateDirectorHistory = (dirIdx: number, histIdx: number, field: string, value: string) => {
    const updated = [...data.directorsOfficers];
    const history = [...updated[dirIdx].employmentHistory];
    history[histIdx] = { ...history[histIdx], [field]: value };
    updated[dirIdx] = { ...updated[dirIdx], employmentHistory: history };
    onChange({ ...data, directorsOfficers: updated });
  };

  const addDirector = () => {
    onChange({
      ...data,
      directorsOfficers: [...data.directorsOfficers, { fullName: '', currentPosition: '', currentFunction: '', type: 'Director' as const, employmentHistory: [{ year: '', position: '', employer: '' }] }],
    });
  };

  const removeDirector = (index: number) => {
    if (data.directorsOfficers.length <= 1) return;
    onChange({ ...data, directorsOfficers: data.directorsOfficers.filter((_, i) => i !== index) });
  };

  const addDirectorHistory = (dirIdx: number) => {
    const updated = [...data.directorsOfficers];
    updated[dirIdx] = { ...updated[dirIdx], employmentHistory: [...updated[dirIdx].employmentHistory, { year: '', position: '', employer: '' }] };
    onChange({ ...data, directorsOfficers: updated });
  };

  const updateOwner = (index: number, field: keyof BeneficialOwner, value: string) => {
    const updated = [...data.beneficialOwners];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, beneficialOwners: updated });
  };

  const addOwner = () => {
    onChange({
      ...data,
      beneficialOwners: [...data.beneficialOwners, { fullName: '', votingPower: '', ownershipPercent: '' }],
    });
  };

  const removeOwner = (index: number) => {
    if (data.beneficialOwners.length <= 1) return;
    onChange({ ...data, beneficialOwners: data.beneficialOwners.filter((_, i) => i !== index) });
  };

  // ── Financial Statements helpers ──
  const updateFinancial = (index: number, field: keyof FinancialStatement, value: string) => {
    const updated = [...(data.financialStatements || [])];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, financialStatements: updated });
  };

  const addFinancialYear = () => {
    const currentYear = new Date().getFullYear();
    const existing = (data.financialStatements || []).map(f => f.year);
    const nextYear = existing.length > 0 ? String(Math.min(...existing.map(Number)) - 1) : String(currentYear);
    onChange({
      ...data,
      financialStatements: [...(data.financialStatements || []), { year: nextYear, grossRevenue: '', netIncome: '', totalAssets: '', totalLiabilities: '' }],
    });
  };

  const removeFinancialYear = (index: number) => {
    onChange({ ...data, financialStatements: (data.financialStatements || []).filter((_, i) => i !== index) });
  };

  // ── Campaign Documents helpers ──
  const addCampaignDocument = (file: File, category: 'Financial' | 'Legal' | 'General') => {
    const reader = new FileReader();
    reader.onload = () => {
      const newDoc: CampaignDocument = {
        name: file.name,
        category,
        fileData: reader.result as string,
        fileSize: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        fileType: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      };
      onChange({ ...data, campaignDocuments: [...(data.campaignDocuments || []), newDoc] });
    };
    reader.readAsDataURL(file);
  };

  const removeCampaignDocument = (index: number) => {
    onChange({ ...data, campaignDocuments: (data.campaignDocuments || []).filter((_, i) => i !== index) });
  };

  const toggleRegistration = (val: string) => {
    const current = data.registrationAuthority;
    if (current.includes(val)) {
      update('registrationAuthority', current.filter((v: string) => v !== val));
    } else {
      update('registrationAuthority', [...current, val]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-black">SEC Form CF — Issuer Form 3</h2>
        <p className="text-sm text-gray-400 mt-1">
          Complete all required sections below. Fields marked with <span className="text-red-500">*</span> are required.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
            <AlertCircle className="h-4 w-4" /> Please fix the following errors:
          </div>
          <ul className="text-sm text-red-600 list-disc list-inside space-y-0.5">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* ── Section 1: Issuer Information ── */}
      <Section title="Section 1: Information on the Issuer" defaultOpen={true}>
        <div className="space-y-6">
          {/* Business Type */}
          <div>
            <label className={labelClass}>Business Type <span className="text-red-500">*</span></label>
            <RadioGroup value={data.businessType} onValueChange={(v) => update('businessType', v)} disabled={readOnly} className="flex flex-wrap gap-4 mt-1">
              {['Single Proprietorship', 'Cooperative', 'Partnership', 'Corporation', 'Others'].map((t) => (
                <div key={t} className="flex items-center space-x-2">
                  <RadioGroupItem value={t} id={`bt-${t}`} />
                  <Label htmlFor={`bt-${t}`} className="text-sm">{t}</Label>
                </div>
              ))}
            </RadioGroup>
            {data.businessType === 'Others' && (
              <Input placeholder="Specify other type" value={data.businessTypeOther} onChange={(e) => update('businessTypeOther', e.target.value)} disabled={readOnly} className={`mt-3 ${inputClass}`} />
            )}
          </div>

          {/* Business Size */}
          <div>
            <label className={labelClass}>Size of Business <span className="text-red-500">*</span></label>
            <RadioGroup value={data.businessSize} onValueChange={(v) => update('businessSize', v)} disabled={readOnly} className="flex flex-wrap gap-4 mt-1">
              {[
                { value: 'micro', label: 'Micro (≤₱3M)' },
                { value: 'small', label: 'Small (₱3M–₱15M)' },
                { value: 'medium', label: 'Medium (₱15M–₱100M)' },
                { value: 'large', label: 'Large (>₱100M)' },
              ].map((s) => (
                <div key={s.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={s.value} id={`bs-${s.value}`} />
                  <Label htmlFor={`bs-${s.value}`} className="text-sm">{s.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Registration */}
          <div>
            <label className={labelClass}>Registration Authority</label>
            <div className="flex flex-wrap gap-4 mt-1">
              {['Municipality', 'DTI', 'SEC', 'Other'].map((a) => (
                <div key={a} className="flex items-center space-x-2">
                  <Checkbox
                    id={`reg-${a}`}
                    checked={data.registrationAuthority.includes(a)}
                    onCheckedChange={() => toggleRegistration(a)}
                    disabled={readOnly}
                  />
                  <Label htmlFor={`reg-${a}`} className="text-sm">{a}</Label>
                </div>
              ))}
            </div>
            {data.registrationAuthority.includes('Other') && (
              <Input placeholder="Specify agency" value={data.registrationOther} onChange={(e) => update('registrationOther', e.target.value)} disabled={readOnly} className={`mt-3 ${inputClass}`} />
            )}
          </div>

          {/* TIN, SEC Reg, DTI Reg */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>TIN <span className="text-red-500">*</span></label>
              <Input value={data.tin} onChange={(e) => update('tin', e.target.value)} disabled={readOnly} placeholder="Tax Identification Number" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>SEC Registration No.</label>
              <Input value={data.secRegNo} onChange={(e) => update('secRegNo', e.target.value)} disabled={readOnly} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>DTI Registration No.</label>
              <Input value={data.dtiRegNo} onChange={(e) => update('dtiRegNo', e.target.value)} disabled={readOnly} className={inputClass} />
            </div>
          </div>

          {/* Company Name & Employees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company Name <span className="text-red-500">*</span></label>
              <Input value={data.companyName} onChange={(e) => update('companyName', e.target.value)} disabled={readOnly} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Total Number of Employees</label>
              <Input type="number" value={data.totalEmployees} onChange={(e) => update('totalEmployees', e.target.value)} disabled={readOnly} className={inputClass} />
            </div>
          </div>

          {/* Owner (for sole proprietorship/partnership) */}
          {(data.businessType === 'Single Proprietorship' || data.businessType === 'Partnership') && (
            <div>
              <label className={subLabelClass}>Owner / Partner Information</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input placeholder="Last Name" value={data.ownerLastName} onChange={(e) => update('ownerLastName', e.target.value)} disabled={readOnly} className={inputClass} />
                <Input placeholder="First Name" value={data.ownerFirstName} onChange={(e) => update('ownerFirstName', e.target.value)} disabled={readOnly} className={inputClass} />
                <Input placeholder="Middle Name" value={data.ownerMiddleName} onChange={(e) => update('ownerMiddleName', e.target.value)} disabled={readOnly} className={inputClass} />
                <Input placeholder="Marital Status" value={data.ownerMaritalStatus} onChange={(e) => update('ownerMaritalStatus', e.target.value)} disabled={readOnly} className={inputClass} />
              </div>
            </div>
          )}

          {/* Address */}
          <div>
            <label className={subLabelClass}>Business Address</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input placeholder="No." value={data.addressNo} onChange={(e) => update('addressNo', e.target.value)} disabled={readOnly} className={inputClass} />
              <Input placeholder="Street" value={data.addressStreet} onChange={(e) => update('addressStreet', e.target.value)} disabled={readOnly} className={inputClass} />
              <Input placeholder="Barangay" value={data.addressBarangay} onChange={(e) => update('addressBarangay', e.target.value)} disabled={readOnly} className={inputClass} />
              <Input placeholder="Municipality/City *" value={data.addressCity} onChange={(e) => update('addressCity', e.target.value)} disabled={readOnly} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <Input placeholder="Province" value={data.addressProvince} onChange={(e) => update('addressProvince', e.target.value)} disabled={readOnly} className={inputClass} />
              <Input placeholder="Region" value={data.addressRegion} onChange={(e) => update('addressRegion', e.target.value)} disabled={readOnly} className={inputClass} />
              <Input placeholder="Zip Code" value={data.addressZip} onChange={(e) => update('addressZip', e.target.value)} disabled={readOnly} className={inputClass} />
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className={subLabelClass}>Contact Information</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input placeholder="Area Code" value={data.areaCode} onChange={(e) => update('areaCode', e.target.value)} disabled={readOnly} className={inputClass} />
              <Input placeholder="Telephone" value={data.telephone} onChange={(e) => update('telephone', e.target.value)} disabled={readOnly} className={inputClass} />
              <Input placeholder="Fax" value={data.fax} onChange={(e) => update('fax', e.target.value)} disabled={readOnly} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Input placeholder="Cellphone *" value={data.cellphone} onChange={(e) => update('cellphone', e.target.value)} disabled={readOnly} className={inputClass} />
              <Input placeholder="Email *" type="email" value={data.email} onChange={(e) => update('email', e.target.value)} disabled={readOnly} className={inputClass} />
              <Input placeholder="Website" value={data.website} onChange={(e) => update('website', e.target.value)} disabled={readOnly} className={inputClass} />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 1.1: Directors & Officers ── */}
      <Section title="Section 1.1: Directors and Officers">
        {data.directorsOfficers.map((dir, i) => (
          <div key={i} className="border border-gray-100 rounded-2xl p-5 mb-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-black text-base">Director/Officer #{i + 1}</span>
              {!readOnly && data.directorsOfficers.length > 1 && (
                <button type="button" onClick={() => removeDirector(i)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Input placeholder="Full Name" value={dir.fullName} onChange={(e) => updateDirector(i, 'fullName', e.target.value)} disabled={readOnly} className={inputClass} />
              <Input placeholder="Current Position" value={dir.currentPosition} onChange={(e) => updateDirector(i, 'currentPosition', e.target.value)} disabled={readOnly} className={inputClass} />
              <Input placeholder="Current Function" value={dir.currentFunction} onChange={(e) => updateDirector(i, 'currentFunction', e.target.value)} disabled={readOnly} className={inputClass} />
              <select
                value={dir.type || 'Director'}
                onChange={(e) => updateDirector(i, 'type', e.target.value)}
                disabled={readOnly}
                className={`${inputClass} h-10`}
              >
                <option value="Director">Director</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <label className="text-sm text-gray-500 mb-2 block">Employment History (Past 3 Years)</label>
            {dir.employmentHistory.map((h, j) => (
              <div key={j} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <Input placeholder="Year" value={h.year} onChange={(e) => updateDirectorHistory(i, j, 'year', e.target.value)} disabled={readOnly} className={inputClass} />
                <Input placeholder="Position" value={h.position} onChange={(e) => updateDirectorHistory(i, j, 'position', e.target.value)} disabled={readOnly} className={inputClass} />
                <Input placeholder="Employer" value={h.employer} onChange={(e) => updateDirectorHistory(i, j, 'employer', e.target.value)} disabled={readOnly} className={inputClass} />
              </div>
            ))}
            {!readOnly && (
              <button type="button" onClick={() => addDirectorHistory(i)} className="text-sm text-[#1B5E20] hover:underline mt-1">
                + Add employment history row
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button type="button" variant="outline" onClick={addDirector} className="flex items-center gap-2 rounded-2xl px-4 py-3">
            <Plus className="h-4 w-4" /> Add Director/Officer
          </Button>
        )}
      </Section>

      {/* ── Section 1.2: Beneficial Owners ── */}
      <Section title="Section 1.2: Beneficial Owners (10%+ Ownership)">
        {data.beneficialOwners.map((owner, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-4 mb-4 items-end">
            <div>
              {i === 0 && <label className={labelClass}>Full Name</label>}
              <Input placeholder="Full Name" value={owner.fullName} onChange={(e) => updateOwner(i, 'fullName', e.target.value)} disabled={readOnly} className={inputClass} />
            </div>
            <div className="md:w-40">
              {i === 0 && <label className={labelClass}>Voting Power %</label>}
              <Input placeholder="Voting Power %" value={owner.votingPower} onChange={(e) => updateOwner(i, 'votingPower', e.target.value)} disabled={readOnly} className={inputClass} />
            </div>
            <div className="md:w-40">
              {i === 0 && <label className={labelClass}>Ownership %</label>}
              <Input placeholder="Ownership %" value={owner.ownershipPercent} onChange={(e) => updateOwner(i, 'ownershipPercent', e.target.value)} disabled={readOnly} className={inputClass} />
            </div>
            {!readOnly && data.beneficialOwners.length > 1 && (
              <button type="button" onClick={() => removeOwner(i)} className="text-red-500 hover:text-red-700 pb-3">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button type="button" variant="outline" onClick={addOwner} className="flex items-center gap-2 rounded-2xl px-4 py-3">
            <Plus className="h-4 w-4" /> Add Beneficial Owner
          </Button>
        )}
      </Section>

      {/* ── Section 1.2(a): Ownership & Capital Structure ── */}
      <Section title="Section 1.2(a): Ownership & Capital Structure">
        <div>
          <label className={labelClass}>Description of ownership and capital structure</label>
          <Textarea rows={4} value={data.ownershipCapitalStructure} onChange={(e) => update('ownershipCapitalStructure', e.target.value)} disabled={readOnly} placeholder="Describe the ownership and capital structure of the issuer..." className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Terms of Securities Being Offered</label>
          <Textarea rows={4} value={data.termsOfSecurities} onChange={(e) => update('termsOfSecurities', e.target.value)} disabled={readOnly} placeholder="Describe the terms of the securities being offered..." className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>How Principal Shareholders' Rights Affect Purchasers</label>
          <Textarea rows={4} value={data.principalShareholdersRights} onChange={(e) => update('principalShareholdersRights', e.target.value)} disabled={readOnly} placeholder="Describe how rights of principal shareholders could affect purchasers..." className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>How Securities Are Valued</label>
          <Textarea rows={4} value={data.howSecuritiesValued} onChange={(e) => update('howSecuritiesValued', e.target.value)} disabled={readOnly} placeholder="Describe how securities are valued..." className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Risk to Purchasers (Minority Ownership, Corporate Actions)</label>
          <Textarea rows={4} value={data.riskToPurchasers} onChange={(e) => update('riskToPurchasers', e.target.value)} disabled={readOnly} placeholder="Describe risks associated with minority ownership..." className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Restrictions on Transfer of Securities</label>
          <Textarea rows={4} value={data.restrictionsOnTransfer} onChange={(e) => update('restrictionsOnTransfer', e.target.value)} disabled={readOnly} placeholder="Describe any restrictions on the transfer of securities..." className={textareaClass} />
        </div>
      </Section>

      {/* ── Section 1.3 & 1.4 ── */}
      <Section title="Section 1.3–1.4: Material Interest & Risk Factors">
        <div>
          <label className={labelClass}>Direct or Indirect Material Interest (transactions &gt;5% of aggregate capital)</label>
          <Textarea rows={4} value={data.materialInterest} onChange={(e) => update('materialInterest', e.target.value)} disabled={readOnly} placeholder="Describe any material interest of directors, officers, or principal shareholders..." className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Material Risk Factors</label>
          <Textarea rows={4} value={data.materialRiskFactors} onChange={(e) => update('materialRiskFactors', e.target.value)} disabled={readOnly} placeholder="Describe the material risk factors associated with this offering..." className={textareaClass} />
        </div>
      </Section>

      {/* ── Section 2: Business Plan ── */}
      <Section title="Section 2: Business Plan">
        <div>
          <label className={labelClass}>Nature of Business <span className="text-red-500">*</span></label>
          <Textarea rows={4} value={data.natureOfBusiness} onChange={(e) => update('natureOfBusiness', e.target.value)} disabled={readOnly} placeholder="Describe the nature of your business..." className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Business Plan with Respect to CF Offering <span className="text-red-500">*</span></label>
          <Textarea rows={5} value={data.businessPlan} onChange={(e) => update('businessPlan', e.target.value)} disabled={readOnly} placeholder="Describe your business plan in relation to this crowdfunding offering..." className={textareaClass} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Target Offering Amount (₱) <span className="text-red-500">*</span></label>
            <Input type="number" value={data.targetOfferingAmount} onChange={(e) => update('targetOfferingAmount', e.target.value)} disabled={readOnly} placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Target Offering Deadline</label>
            <Input type="date" value={data.targetOfferingDeadline} onChange={(e) => update('targetOfferingDeadline', e.target.value)} disabled={readOnly} className={inputClass} />
          </div>
        </div>
      </Section>

      {/* ── Section 3: Use of Proceeds ── */}
      <Section title="Section 3: Use of Proceeds">
        <div>
          <label className={labelClass}>Purpose and Intended Use of Proceeds <span className="text-red-500">*</span></label>
          <Textarea rows={5} value={data.useOfProceeds} onChange={(e) => update('useOfProceeds', e.target.value)} disabled={readOnly} placeholder="Describe how the funds raised will be used..." className={textareaClass} />
        </div>
      </Section>

      {/* ── Section 4: Investment Commitments ── */}
      <Section title="Section 4: Investment Commitments & Oversubscription">
        <div>
          <label className={labelClass}>Statement if Commitments Less Than Target</label>
          <Textarea rows={3} value={data.investmentCommitmentsLessThanTarget} onChange={(e) => update('investmentCommitmentsLessThanTarget', e.target.value)} disabled={readOnly} placeholder="What happens if investment commitments do not reach the target amount..." className={textareaClass} />
        </div>
        <div className="flex items-start space-x-3">
          <Checkbox
            id="materialChangesAck"
            checked={data.investorMaterialChangesAck}
            onCheckedChange={(checked) => update('investorMaterialChangesAck', !!checked)}
            disabled={readOnly}
            className="mt-0.5"
          />
          <Label htmlFor="materialChangesAck" className="text-sm leading-relaxed">
            I acknowledge that investors will be notified of any material changes to the offering and given the opportunity to reconfirm their commitment.
          </Label>
        </div>
        <div>
          <label className={labelClass}>Accept Investments in Excess of Target?</label>
          <RadioGroup value={data.acceptExcessInvestments} onValueChange={(v) => update('acceptExcessInvestments', v)} disabled={readOnly} className="flex gap-6 mt-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="excess-yes" />
              <Label htmlFor="excess-yes" className="text-sm">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="excess-no" />
              <Label htmlFor="excess-no" className="text-sm">No</Label>
            </div>
          </RadioGroup>
        </div>
        {data.acceptExcessInvestments === 'yes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-5 border-l-2 border-green-200">
            <div>
              <label className={labelClass}>Maximum Amount (₱)</label>
              <Input type="number" value={data.excessMaxAmount} onChange={(e) => update('excessMaxAmount', e.target.value)} disabled={readOnly} placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Oversubscription Allocation Method</label>
              <Input value={data.oversubscriptionMethod} onChange={(e) => update('oversubscriptionMethod', e.target.value)} disabled={readOnly} placeholder="e.g. Pro-rata, first-come first-served" className={inputClass} />
            </div>
          </div>
        )}
        <div>
          <label className={labelClass}>Process for Completing or Canceling Commitments</label>
          <Textarea rows={3} value={data.completingCancelingCommitment} onChange={(e) => update('completingCancelingCommitment', e.target.value)} disabled={readOnly} placeholder="Describe the process for investors to complete or cancel their commitments..." className={textareaClass} />
        </div>
      </Section>

      {/* ── Section 5: Method of Determining Price ── */}
      <Section title="Section 5: Method of Determining Price of Securities">
        <div>
          <label className={labelClass}>Description <span className="text-red-500">*</span></label>
          <Textarea rows={4} value={data.methodDeterminingPrice} onChange={(e) => update('methodDeterminingPrice', e.target.value)} disabled={readOnly} placeholder="Describe the method used to determine the price of the securities..." className={textareaClass} />
        </div>
      </Section>

      {/* ── Section 6: Past Exempt Offerings ── */}
      <Section title="Section 6: Exempt Offerings in the Past 3 Years">
        <div>
          <label className={labelClass}>Description</label>
          <Textarea rows={4} value={data.pastExemptOfferings} onChange={(e) => update('pastExemptOfferings', e.target.value)} disabled={readOnly} placeholder="Describe any exempt offerings conducted in the past three years..." className={textareaClass} />
        </div>
      </Section>

      {/* ── Section 7: Financials ── */}
      <Section title="Section 7: Financial Information">
        <div>
          <label className={labelClass}>Indebtedness (amount, interest rate, maturity, terms)</label>
          <Textarea rows={4} value={data.indebtedness} onChange={(e) => update('indebtedness', e.target.value)} disabled={readOnly} placeholder="Describe the issuer's outstanding debt obligations..." className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Liquidity</label>
          <Textarea rows={3} value={data.liquidity} onChange={(e) => update('liquidity', e.target.value)} disabled={readOnly} placeholder="Describe the issuer's liquidity position..." className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Capital Resources</label>
          <Textarea rows={3} value={data.capitalResources} onChange={(e) => update('capitalResources', e.target.value)} disabled={readOnly} placeholder="Describe the issuer's capital resources..." className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Historical Operations</label>
          <Textarea rows={3} value={data.historicalOperations} onChange={(e) => update('historicalOperations', e.target.value)} disabled={readOnly} placeholder="Describe the history of the issuer's operations..." className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Others</label>
          <Textarea rows={3} value={data.financialOther} onChange={(e) => update('financialOther', e.target.value)} disabled={readOnly} placeholder="Any other relevant financial information..." className={textareaClass} />
        </div>
      </Section>

      {/* ── Financial Statements (Structured — for Campaign Page) ── */}
      <Section title="Financial Statements (Campaign Display)">
        <p className="text-sm text-gray-500 mb-4">Add annual financial figures that will be displayed on the public campaign page. Investors use these to assess the company.</p>
        {(data.financialStatements || []).map((fs, i) => (
          <div key={i} className="border border-gray-100 rounded-2xl p-5 mb-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-black text-base">FY {fs.year || '—'}</span>
              {!readOnly && (
                <button type="button" onClick={() => removeFinancialYear(i)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className={labelClass}>Year</label>
                <Input placeholder="e.g. 2024" value={fs.year} onChange={(e) => updateFinancial(i, 'year', e.target.value)} disabled={readOnly} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Gross Revenue (₱)</label>
                <Input type="number" placeholder="0" value={fs.grossRevenue} onChange={(e) => updateFinancial(i, 'grossRevenue', e.target.value)} disabled={readOnly} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Net Income (₱)</label>
                <Input type="number" placeholder="0" value={fs.netIncome} onChange={(e) => updateFinancial(i, 'netIncome', e.target.value)} disabled={readOnly} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Total Assets (₱)</label>
                <Input type="number" placeholder="0" value={fs.totalAssets} onChange={(e) => updateFinancial(i, 'totalAssets', e.target.value)} disabled={readOnly} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Total Liabilities (₱)</label>
                <Input type="number" placeholder="0" value={fs.totalLiabilities} onChange={(e) => updateFinancial(i, 'totalLiabilities', e.target.value)} disabled={readOnly} className={inputClass} />
              </div>
            </div>
          </div>
        ))}
        {!readOnly && (
          <Button type="button" variant="outline" onClick={addFinancialYear} className="flex items-center gap-2 rounded-2xl px-4 py-3">
            <Plus className="h-4 w-4" /> Add Financial Year
          </Button>
        )}
      </Section>

      {/* ── Campaign Documents ── */}
      <Section title="Campaign Documents">
        <p className="text-sm text-gray-500 mb-4">Upload documents that investors can view on the campaign page (e.g. annual reports, SEC certificates, business permits).</p>
        {(data.campaignDocuments || []).map((doc, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl mb-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <span className="text-xs font-bold text-red-600">{doc.fileType}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
              <p className="text-xs text-gray-400">{doc.fileType} · {doc.fileSize} · {doc.category}</p>
            </div>
            {!readOnly && (
              <button type="button" onClick={() => removeCampaignDocument(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <div className="flex flex-wrap gap-3">
            {(['Financial', 'Legal', 'General'] as const).map((cat) => (
              <label key={cat} className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) addCampaignDocument(file, cat);
                    e.target.value = '';
                  }}
                />
                <span className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Plus className="h-4 w-4" /> Upload {cat}
                </span>
              </label>
            ))}
          </div>
        )}
      </Section>

      {/* ── Section 8: Intermediary ── */}
      <Section title="Section 8: Intermediary Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Intermediary Name</label>
            <Input value={data.intermediaryName} onChange={(e) => update('intermediaryName', e.target.value)} disabled={readOnly} placeholder="Name of intermediary" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>SEC Registration No.</label>
            <Input value={data.intermediarySecRegNo} onChange={(e) => update('intermediarySecRegNo', e.target.value)} disabled={readOnly} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <RadioGroup value={data.intermediaryType} onValueChange={(v) => update('intermediaryType', v)} disabled={readOnly} className="flex gap-6 mt-1">
            {['Broker', 'Investment House', 'Funding Portal'].map((t) => (
              <div key={t} className="flex items-center space-x-2">
                <RadioGroupItem value={t} id={`intType-${t}`} />
                <Label htmlFor={`intType-${t}`} className="text-sm">{t}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div>
          <label className={labelClass}>Compensation (Amount / Percentage)</label>
          <Input value={data.intermediaryCompensation} onChange={(e) => update('intermediaryCompensation', e.target.value)} disabled={readOnly} placeholder="e.g. 5% of total funds raised" className={inputClass} />
        </div>
      </Section>

      {/* ── Disqualification ── */}
      <Section title="Disqualification Provisions">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="disqualNone"
            checked={data.disqualificationNone}
            onCheckedChange={(checked) => update('disqualificationNone', !!checked)}
            disabled={readOnly}
            className="mt-0.5"
          />
          <Label htmlFor="disqualNone" className="text-sm leading-relaxed">
            <span className="text-red-500">*</span> I hereby certify that the issuer, its directors, officers, and beneficial owners of 10% or more of the issuer's outstanding equity securities are NOT subject to any of the disqualification provisions under Section 12 of the SEC Crowdfunding Rules.
          </Label>
        </div>
      </Section>

      {/* ── Signatures ── */}
      <Section title="Certification & Signatures">
        <p className="text-sm text-gray-500 mb-4">
          By typing your name below, you certify that the information provided in this form is true and correct to the best of your knowledge.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Principal Executive Officer <span className="text-red-500">*</span></label>
            <Input value={data.principalExecutiveOfficer} onChange={(e) => update('principalExecutiveOfficer', e.target.value)} disabled={readOnly} placeholder="Full Name" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Comptroller</label>
            <Input value={data.comptroller} onChange={(e) => update('comptroller', e.target.value)} disabled={readOnly} placeholder="Full Name" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Principal Operating Officer</label>
            <Input value={data.principalOperatingOfficer} onChange={(e) => update('principalOperatingOfficer', e.target.value)} disabled={readOnly} placeholder="Full Name" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Corporate Secretary</label>
            <Input value={data.corporateSecretary} onChange={(e) => update('corporateSecretary', e.target.value)} disabled={readOnly} placeholder="Full Name" className={inputClass} />
          </div>
        </div>
        <div className="md:w-1/2">
          <label className={labelClass}>Date <span className="text-red-500">*</span></label>
          <Input type="date" value={data.signatureDate} onChange={(e) => update('signatureDate', e.target.value)} disabled={readOnly} className={inputClass} />
        </div>
      </Section>
    </div>
  );
};
