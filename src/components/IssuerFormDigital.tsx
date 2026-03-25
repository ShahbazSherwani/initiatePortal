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
  employmentHistory: { year: string; position: string; employer: string }[];
}

export interface BeneficialOwner {
  fullName: string;
  votingPower: string;
  ownershipPercent: string;
}

export interface IssuerFormData {
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
  directorsOfficers: [{ fullName: '', currentPosition: '', currentFunction: '', employmentHistory: [{ year: '', position: '', employer: '' }] }],
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

// ─── Collapsible Section ─────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t-lg text-left font-semibold text-sm text-gray-800"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
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
      directorsOfficers: [...data.directorsOfficers, { fullName: '', currentPosition: '', currentFunction: '', employmentHistory: [{ year: '', position: '', employer: '' }] }],
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

  const toggleRegistration = (val: string) => {
    const current = data.registrationAuthority;
    if (current.includes(val)) {
      update('registrationAuthority', current.filter((v: string) => v !== val));
    } else {
      update('registrationAuthority', [...current, val]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">SEC Form CF — Issuer Form 3</h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete all required sections below. Fields marked with <span className="text-red-500">*</span> are required.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-1">
            <AlertCircle className="h-4 w-4" /> Please fix the following errors:
          </div>
          <ul className="text-sm text-red-600 list-disc list-inside">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* ── Section 1: Issuer Information ── */}
      <Section title="Section 1: Information on the Issuer" defaultOpen={true}>
        <div className="space-y-4">
          {/* Business Type */}
          <div>
            <Label className="text-sm font-medium">Business Type <span className="text-red-500">*</span></Label>
            <RadioGroup value={data.businessType} onValueChange={(v) => update('businessType', v)} disabled={readOnly} className="flex flex-wrap gap-3 mt-1">
              {['Single Proprietorship', 'Cooperative', 'Partnership', 'Corporation', 'Others'].map((t) => (
                <div key={t} className="flex items-center space-x-2">
                  <RadioGroupItem value={t} id={`bt-${t}`} />
                  <Label htmlFor={`bt-${t}`} className="text-sm">{t}</Label>
                </div>
              ))}
            </RadioGroup>
            {data.businessType === 'Others' && (
              <Input placeholder="Specify other type" value={data.businessTypeOther} onChange={(e) => update('businessTypeOther', e.target.value)} disabled={readOnly} className="mt-2 max-w-xs" />
            )}
          </div>

          {/* Business Size */}
          <div>
            <Label className="text-sm font-medium">Size of Business <span className="text-red-500">*</span></Label>
            <RadioGroup value={data.businessSize} onValueChange={(v) => update('businessSize', v)} disabled={readOnly} className="flex flex-wrap gap-3 mt-1">
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
            <Label className="text-sm font-medium">Registration Authority</Label>
            <div className="flex flex-wrap gap-3 mt-1">
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
              <Input placeholder="Specify agency" value={data.registrationOther} onChange={(e) => update('registrationOther', e.target.value)} disabled={readOnly} className="mt-2 max-w-xs" />
            )}
          </div>

          {/* TIN, SEC Reg, DTI Reg */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-medium">TIN <span className="text-red-500">*</span></Label>
              <Input value={data.tin} onChange={(e) => update('tin', e.target.value)} disabled={readOnly} placeholder="Tax Identification Number" />
            </div>
            <div>
              <Label className="text-sm font-medium">SEC Registration No.</Label>
              <Input value={data.secRegNo} onChange={(e) => update('secRegNo', e.target.value)} disabled={readOnly} />
            </div>
            <div>
              <Label className="text-sm font-medium">DTI Registration No.</Label>
              <Input value={data.dtiRegNo} onChange={(e) => update('dtiRegNo', e.target.value)} disabled={readOnly} />
            </div>
          </div>

          {/* Company Name & Employees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Company Name <span className="text-red-500">*</span></Label>
              <Input value={data.companyName} onChange={(e) => update('companyName', e.target.value)} disabled={readOnly} />
            </div>
            <div>
              <Label className="text-sm font-medium">Total Number of Employees</Label>
              <Input type="number" value={data.totalEmployees} onChange={(e) => update('totalEmployees', e.target.value)} disabled={readOnly} />
            </div>
          </div>

          {/* Owner (for sole proprietorship/partnership) */}
          {(data.businessType === 'Single Proprietorship' || data.businessType === 'Partnership') && (
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Owner / Partner Information</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input placeholder="Last Name" value={data.ownerLastName} onChange={(e) => update('ownerLastName', e.target.value)} disabled={readOnly} />
                <Input placeholder="First Name" value={data.ownerFirstName} onChange={(e) => update('ownerFirstName', e.target.value)} disabled={readOnly} />
                <Input placeholder="Middle Name" value={data.ownerMiddleName} onChange={(e) => update('ownerMiddleName', e.target.value)} disabled={readOnly} />
                <Input placeholder="Marital Status" value={data.ownerMaritalStatus} onChange={(e) => update('ownerMaritalStatus', e.target.value)} disabled={readOnly} />
              </div>
            </div>
          )}

          {/* Address */}
          <div>
            <Label className="text-sm font-medium text-gray-600 mb-2 block">Business Address</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Input placeholder="No." value={data.addressNo} onChange={(e) => update('addressNo', e.target.value)} disabled={readOnly} />
              <Input placeholder="Street" value={data.addressStreet} onChange={(e) => update('addressStreet', e.target.value)} disabled={readOnly} />
              <Input placeholder="Barangay" value={data.addressBarangay} onChange={(e) => update('addressBarangay', e.target.value)} disabled={readOnly} />
              <Input placeholder="Municipality/City *" value={data.addressCity} onChange={(e) => update('addressCity', e.target.value)} disabled={readOnly} />
              <Input placeholder="Province" value={data.addressProvince} onChange={(e) => update('addressProvince', e.target.value)} disabled={readOnly} />
              <Input placeholder="Region" value={data.addressRegion} onChange={(e) => update('addressRegion', e.target.value)} disabled={readOnly} />
              <Input placeholder="Zip Code" value={data.addressZip} onChange={(e) => update('addressZip', e.target.value)} disabled={readOnly} />
            </div>
          </div>

          {/* Contact */}
          <div>
            <Label className="text-sm font-medium text-gray-600 mb-2 block">Contact Information</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Input placeholder="Area Code" value={data.areaCode} onChange={(e) => update('areaCode', e.target.value)} disabled={readOnly} />
              <Input placeholder="Telephone" value={data.telephone} onChange={(e) => update('telephone', e.target.value)} disabled={readOnly} />
              <Input placeholder="Fax" value={data.fax} onChange={(e) => update('fax', e.target.value)} disabled={readOnly} />
              <Input placeholder="Cellphone *" value={data.cellphone} onChange={(e) => update('cellphone', e.target.value)} disabled={readOnly} />
              <Input placeholder="Email *" type="email" value={data.email} onChange={(e) => update('email', e.target.value)} disabled={readOnly} />
              <Input placeholder="Website" value={data.website} onChange={(e) => update('website', e.target.value)} disabled={readOnly} />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 1.1: Directors & Officers ── */}
      <Section title="Section 1.1: Directors and Officers">
        {data.directorsOfficers.map((dir, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3 mb-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Director/Officer #{i + 1}</span>
              {!readOnly && data.directorsOfficers.length > 1 && (
                <button type="button" onClick={() => removeDirector(i)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
              <Input placeholder="Full Name" value={dir.fullName} onChange={(e) => updateDirector(i, 'fullName', e.target.value)} disabled={readOnly} />
              <Input placeholder="Current Position" value={dir.currentPosition} onChange={(e) => updateDirector(i, 'currentPosition', e.target.value)} disabled={readOnly} />
              <Input placeholder="Current Function" value={dir.currentFunction} onChange={(e) => updateDirector(i, 'currentFunction', e.target.value)} disabled={readOnly} />
            </div>
            <Label className="text-xs text-gray-500 mb-1 block">Employment History (Past 3 Years)</Label>
            {dir.employmentHistory.map((h, j) => (
              <div key={j} className="grid grid-cols-3 gap-2 mb-1">
                <Input placeholder="Year" value={h.year} onChange={(e) => updateDirectorHistory(i, j, 'year', e.target.value)} disabled={readOnly} className="text-sm" />
                <Input placeholder="Position" value={h.position} onChange={(e) => updateDirectorHistory(i, j, 'position', e.target.value)} disabled={readOnly} className="text-sm" />
                <Input placeholder="Employer" value={h.employer} onChange={(e) => updateDirectorHistory(i, j, 'employer', e.target.value)} disabled={readOnly} className="text-sm" />
              </div>
            ))}
            {!readOnly && (
              <button type="button" onClick={() => addDirectorHistory(i)} className="text-xs text-[#1B5E20] hover:underline mt-1">
                + Add employment history row
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addDirector} className="flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add Director/Officer
          </Button>
        )}
      </Section>

      {/* ── Section 1.2: Beneficial Owners ── */}
      <Section title="Section 1.2: Beneficial Owners (10%+ Ownership)">
        {data.beneficialOwners.map((owner, i) => (
          <div key={i} className="flex items-center gap-3 mb-2">
            <span className="text-xs text-gray-400 w-4">#{i + 1}</span>
            <Input placeholder="Full Name" value={owner.fullName} onChange={(e) => updateOwner(i, 'fullName', e.target.value)} disabled={readOnly} className="flex-1" />
            <Input placeholder="Voting Power %" value={owner.votingPower} onChange={(e) => updateOwner(i, 'votingPower', e.target.value)} disabled={readOnly} className="w-28" />
            <Input placeholder="Ownership %" value={owner.ownershipPercent} onChange={(e) => updateOwner(i, 'ownershipPercent', e.target.value)} disabled={readOnly} className="w-28" />
            {!readOnly && data.beneficialOwners.length > 1 && (
              <button type="button" onClick={() => removeOwner(i)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addOwner} className="flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add Beneficial Owner
          </Button>
        )}
      </Section>

      {/* ── Section 1.2(a): Ownership & Capital Structure ── */}
      <Section title="Section 1.2(a): Ownership & Capital Structure">
        <div>
          <Label className="text-sm font-medium">Description of ownership and capital structure</Label>
          <Textarea rows={3} value={data.ownershipCapitalStructure} onChange={(e) => update('ownershipCapitalStructure', e.target.value)} disabled={readOnly} placeholder="Describe the ownership and capital structure of the issuer..." />
        </div>
        <div>
          <Label className="text-sm font-medium">Terms of Securities Being Offered</Label>
          <Textarea rows={3} value={data.termsOfSecurities} onChange={(e) => update('termsOfSecurities', e.target.value)} disabled={readOnly} placeholder="Describe the terms of the securities being offered..." />
        </div>
        <div>
          <Label className="text-sm font-medium">How Principal Shareholders' Rights Affect Purchasers</Label>
          <Textarea rows={3} value={data.principalShareholdersRights} onChange={(e) => update('principalShareholdersRights', e.target.value)} disabled={readOnly} placeholder="Describe how rights of principal shareholders could affect purchasers..." />
        </div>
        <div>
          <Label className="text-sm font-medium">How Securities Are Valued</Label>
          <Textarea rows={3} value={data.howSecuritiesValued} onChange={(e) => update('howSecuritiesValued', e.target.value)} disabled={readOnly} placeholder="Describe how securities are valued..." />
        </div>
        <div>
          <Label className="text-sm font-medium">Risk to Purchasers (Minority Ownership, Corporate Actions)</Label>
          <Textarea rows={3} value={data.riskToPurchasers} onChange={(e) => update('riskToPurchasers', e.target.value)} disabled={readOnly} placeholder="Describe risks associated with minority ownership..." />
        </div>
        <div>
          <Label className="text-sm font-medium">Restrictions on Transfer of Securities</Label>
          <Textarea rows={3} value={data.restrictionsOnTransfer} onChange={(e) => update('restrictionsOnTransfer', e.target.value)} disabled={readOnly} placeholder="Describe any restrictions on the transfer of securities..." />
        </div>
      </Section>

      {/* ── Section 1.3 & 1.4 ── */}
      <Section title="Section 1.3–1.4: Material Interest & Risk Factors">
        <div>
          <Label className="text-sm font-medium">Direct or Indirect Material Interest (transactions &gt;5% of aggregate capital)</Label>
          <Textarea rows={3} value={data.materialInterest} onChange={(e) => update('materialInterest', e.target.value)} disabled={readOnly} placeholder="Describe any material interest of directors, officers, or principal shareholders..." />
        </div>
        <div>
          <Label className="text-sm font-medium">Material Risk Factors</Label>
          <Textarea rows={3} value={data.materialRiskFactors} onChange={(e) => update('materialRiskFactors', e.target.value)} disabled={readOnly} placeholder="Describe the material risk factors associated with this offering..." />
        </div>
      </Section>

      {/* ── Section 2: Business Plan ── */}
      <Section title="Section 2: Business Plan">
        <div>
          <Label className="text-sm font-medium">Nature of Business <span className="text-red-500">*</span></Label>
          <Textarea rows={3} value={data.natureOfBusiness} onChange={(e) => update('natureOfBusiness', e.target.value)} disabled={readOnly} placeholder="Describe the nature of your business..." />
        </div>
        <div>
          <Label className="text-sm font-medium">Business Plan with Respect to CF Offering <span className="text-red-500">*</span></Label>
          <Textarea rows={4} value={data.businessPlan} onChange={(e) => update('businessPlan', e.target.value)} disabled={readOnly} placeholder="Describe your business plan in relation to this crowdfunding offering..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium">Target Offering Amount (₱) <span className="text-red-500">*</span></Label>
            <Input type="number" value={data.targetOfferingAmount} onChange={(e) => update('targetOfferingAmount', e.target.value)} disabled={readOnly} placeholder="0.00" />
          </div>
          <div>
            <Label className="text-sm font-medium">Target Offering Deadline</Label>
            <Input type="date" value={data.targetOfferingDeadline} onChange={(e) => update('targetOfferingDeadline', e.target.value)} disabled={readOnly} />
          </div>
        </div>
      </Section>

      {/* ── Section 3: Use of Proceeds ── */}
      <Section title="Section 3: Use of Proceeds">
        <div>
          <Label className="text-sm font-medium">Purpose and Intended Use of Proceeds <span className="text-red-500">*</span></Label>
          <Textarea rows={4} value={data.useOfProceeds} onChange={(e) => update('useOfProceeds', e.target.value)} disabled={readOnly} placeholder="Describe how the funds raised will be used..." />
        </div>
      </Section>

      {/* ── Section 4: Investment Commitments ── */}
      <Section title="Section 4: Investment Commitments & Oversubscription">
        <div>
          <Label className="text-sm font-medium">Statement if Commitments Less Than Target</Label>
          <Textarea rows={2} value={data.investmentCommitmentsLessThanTarget} onChange={(e) => update('investmentCommitmentsLessThanTarget', e.target.value)} disabled={readOnly} placeholder="What happens if investment commitments do not reach the target amount..." />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="materialChangesAck"
            checked={data.investorMaterialChangesAck}
            onCheckedChange={(checked) => update('investorMaterialChangesAck', !!checked)}
            disabled={readOnly}
          />
          <Label htmlFor="materialChangesAck" className="text-sm">
            I acknowledge that investors will be notified of any material changes to the offering and given the opportunity to reconfirm their commitment.
          </Label>
        </div>
        <div>
          <Label className="text-sm font-medium">Accept Investments in Excess of Target?</Label>
          <RadioGroup value={data.acceptExcessInvestments} onValueChange={(v) => update('acceptExcessInvestments', v)} disabled={readOnly} className="flex gap-4 mt-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-green-200">
            <div>
              <Label className="text-sm font-medium">Maximum Amount (₱)</Label>
              <Input type="number" value={data.excessMaxAmount} onChange={(e) => update('excessMaxAmount', e.target.value)} disabled={readOnly} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-sm font-medium">Oversubscription Allocation Method</Label>
              <Input value={data.oversubscriptionMethod} onChange={(e) => update('oversubscriptionMethod', e.target.value)} disabled={readOnly} placeholder="e.g. Pro-rata, first-come first-served" />
            </div>
          </div>
        )}
        <div>
          <Label className="text-sm font-medium">Process for Completing or Canceling Commitments</Label>
          <Textarea rows={2} value={data.completingCancelingCommitment} onChange={(e) => update('completingCancelingCommitment', e.target.value)} disabled={readOnly} placeholder="Describe the process for investors to complete or cancel their commitments..." />
        </div>
      </Section>

      {/* ── Section 5: Method of Determining Price ── */}
      <Section title="Section 5: Method of Determining Price of Securities">
        <div>
          <Label className="text-sm font-medium">Description <span className="text-red-500">*</span></Label>
          <Textarea rows={3} value={data.methodDeterminingPrice} onChange={(e) => update('methodDeterminingPrice', e.target.value)} disabled={readOnly} placeholder="Describe the method used to determine the price of the securities..." />
        </div>
      </Section>

      {/* ── Section 6: Past Exempt Offerings ── */}
      <Section title="Section 6: Exempt Offerings in the Past 3 Years">
        <div>
          <Label className="text-sm font-medium">Description</Label>
          <Textarea rows={3} value={data.pastExemptOfferings} onChange={(e) => update('pastExemptOfferings', e.target.value)} disabled={readOnly} placeholder="Describe any exempt offerings conducted in the past three years..." />
        </div>
      </Section>

      {/* ── Section 7: Financials ── */}
      <Section title="Section 7: Financial Information">
        <div>
          <Label className="text-sm font-medium">Indebtedness (amount, interest rate, maturity, terms)</Label>
          <Textarea rows={3} value={data.indebtedness} onChange={(e) => update('indebtedness', e.target.value)} disabled={readOnly} placeholder="Describe the issuer's outstanding debt obligations..." />
        </div>
        <div>
          <Label className="text-sm font-medium">Liquidity</Label>
          <Textarea rows={2} value={data.liquidity} onChange={(e) => update('liquidity', e.target.value)} disabled={readOnly} placeholder="Describe the issuer's liquidity position..." />
        </div>
        <div>
          <Label className="text-sm font-medium">Capital Resources</Label>
          <Textarea rows={2} value={data.capitalResources} onChange={(e) => update('capitalResources', e.target.value)} disabled={readOnly} placeholder="Describe the issuer's capital resources..." />
        </div>
        <div>
          <Label className="text-sm font-medium">Historical Operations</Label>
          <Textarea rows={2} value={data.historicalOperations} onChange={(e) => update('historicalOperations', e.target.value)} disabled={readOnly} placeholder="Describe the history of the issuer's operations..." />
        </div>
        <div>
          <Label className="text-sm font-medium">Others</Label>
          <Textarea rows={2} value={data.financialOther} onChange={(e) => update('financialOther', e.target.value)} disabled={readOnly} placeholder="Any other relevant financial information..." />
        </div>
      </Section>

      {/* ── Section 8: Intermediary ── */}
      <Section title="Section 8: Intermediary Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium">Intermediary Name</Label>
            <Input value={data.intermediaryName} onChange={(e) => update('intermediaryName', e.target.value)} disabled={readOnly} placeholder="Name of intermediary" />
          </div>
          <div>
            <Label className="text-sm font-medium">SEC Registration No.</Label>
            <Input value={data.intermediarySecRegNo} onChange={(e) => update('intermediarySecRegNo', e.target.value)} disabled={readOnly} />
          </div>
          <div>
            <Label className="text-sm font-medium">Type</Label>
            <RadioGroup value={data.intermediaryType} onValueChange={(v) => update('intermediaryType', v)} disabled={readOnly} className="flex gap-3 mt-1">
              {['Broker', 'Investment House', 'Funding Portal'].map((t) => (
                <div key={t} className="flex items-center space-x-2">
                  <RadioGroupItem value={t} id={`intType-${t}`} />
                  <Label htmlFor={`intType-${t}`} className="text-sm">{t}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label className="text-sm font-medium">Compensation (Amount / Percentage)</Label>
            <Input value={data.intermediaryCompensation} onChange={(e) => update('intermediaryCompensation', e.target.value)} disabled={readOnly} placeholder="e.g. 5% of total funds raised" />
          </div>
        </div>
      </Section>

      {/* ── Disqualification ── */}
      <Section title="Disqualification Provisions">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="disqualNone"
            checked={data.disqualificationNone}
            onCheckedChange={(checked) => update('disqualificationNone', !!checked)}
            disabled={readOnly}
          />
          <Label htmlFor="disqualNone" className="text-sm leading-relaxed">
            <span className="text-red-500">*</span> I hereby certify that the issuer, its directors, officers, and beneficial owners of 10% or more of the issuer's outstanding equity securities are NOT subject to any of the disqualification provisions under Section 12 of the SEC Crowdfunding Rules.
          </Label>
        </div>
      </Section>

      {/* ── Signatures ── */}
      <Section title="Certification & Signatures">
        <p className="text-sm text-gray-600 mb-3">
          By typing your name below, you certify that the information provided in this form is true and correct to the best of your knowledge.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium">Principal Executive Officer <span className="text-red-500">*</span></Label>
            <Input value={data.principalExecutiveOfficer} onChange={(e) => update('principalExecutiveOfficer', e.target.value)} disabled={readOnly} placeholder="Full Name" />
          </div>
          <div>
            <Label className="text-sm font-medium">Comptroller</Label>
            <Input value={data.comptroller} onChange={(e) => update('comptroller', e.target.value)} disabled={readOnly} placeholder="Full Name" />
          </div>
          <div>
            <Label className="text-sm font-medium">Principal Operating Officer</Label>
            <Input value={data.principalOperatingOfficer} onChange={(e) => update('principalOperatingOfficer', e.target.value)} disabled={readOnly} placeholder="Full Name" />
          </div>
          <div>
            <Label className="text-sm font-medium">Corporate Secretary</Label>
            <Input value={data.corporateSecretary} onChange={(e) => update('corporateSecretary', e.target.value)} disabled={readOnly} placeholder="Full Name" />
          </div>
        </div>
        <div className="max-w-xs">
          <Label className="text-sm font-medium">Date <span className="text-red-500">*</span></Label>
          <Input type="date" value={data.signatureDate} onChange={(e) => update('signatureDate', e.target.value)} disabled={readOnly} />
        </div>
      </Section>
    </div>
  );
};
