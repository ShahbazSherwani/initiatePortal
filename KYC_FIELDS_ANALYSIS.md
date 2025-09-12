# KYC Compliance Fields Analysis

## Field Cross-Check Summary

This document provides a comprehensive analysis of KYC (Know Your Customer) fields for both Individual and Non-Individual accounts, comparing existing database fields with regulatory requirements.

## Individual Account KYC Requirements

### ✅ **EXISTING FIELDS** (Already in Database)
| Field | Database Column | Table | Status |
|-------|----------------|-------|--------|
| Full Name | `full_name` | borrower_profiles, investor_profiles | ✅ Exists |
| Mobile Number | `phone_number` | borrower_profiles, investor_profiles | ✅ Exists |
| Date of Birth | `date_of_birth` | borrower_profiles, investor_profiles | ✅ Exists |
| Address - Street | `street` | borrower_profiles | ✅ Exists |
| Address - Barangay | `barangay` | borrower_profiles | ✅ Exists |
| Address - Municipality | `municipality` | borrower_profiles | ✅ Exists |
| Address - Province | `province` | borrower_profiles | ✅ Exists |
| Address - Country | `country` | borrower_profiles | ✅ Exists |
| Address - Postal Code | `postal_code` | borrower_profiles | ✅ Exists |
| Primary Government ID (National ID) | `national_id` | borrower_profiles, investor_profiles | ✅ Exists |
| Primary Government ID (Passport) | `passport_no` | borrower_profiles, investor_profiles | ✅ Exists |
| Tax Identification Number (TIN) | `tin` | borrower_profiles, investor_profiles | ✅ Exists |

### 🆕 **NEW FIELDS ADDED** (Added in Migration 002)
| Field | Database Column | Table | Status |
|-------|----------------|-------|--------|
| Place of Birth | `place_of_birth` | borrower_profiles, investor_profiles | 🆕 Added |
| Gender | `gender` | borrower_profiles, investor_profiles | 🆕 Added |
| Civil Status | `civil_status` | borrower_profiles, investor_profiles | 🆕 Added |
| Nationality | `nationality` | borrower_profiles, investor_profiles | 🆕 Added |
| Contact Email | `contact_email` | borrower_profiles, investor_profiles | 🆕 Added |
| Secondary Government ID Type | `secondary_id_type` | borrower_profiles, investor_profiles | 🆕 Added |
| Secondary Government ID Number | `secondary_id_number` | borrower_profiles, investor_profiles | 🆕 Added |
| Emergency Contact Name | `emergency_contact_name` | borrower_profiles, investor_profiles | 🆕 Added |
| Emergency Contact Relationship | `emergency_contact_relationship` | borrower_profiles, investor_profiles | 🆕 Added |
| Emergency Contact Phone | `emergency_contact_phone` | borrower_profiles, investor_profiles | 🆕 Added |
| Emergency Contact Email | `emergency_contact_email` | borrower_profiles, investor_profiles | 🆕 Added |

## Non-Individual Account KYC Requirements

### 🆕 **NEW FIELDS ADDED** (All new fields for business accounts)
| Field | Database Column | Table | Status |
|-------|----------------|-------|--------|
| Account Type Flag | `is_individual_account` | borrower_profiles, investor_profiles | 🆕 Added |
| Business Registration Type | `business_registration_type` | borrower_profiles, investor_profiles | 🆕 Added |
| Business Registration Number | `business_registration_number` | borrower_profiles, investor_profiles | 🆕 Added |
| Business Registration Date | `business_registration_date` | borrower_profiles, investor_profiles | 🆕 Added |
| Corporate TIN | `corporate_tin` | borrower_profiles, investor_profiles | 🆕 Added |
| Nature of Business | `nature_of_business` | borrower_profiles, investor_profiles | 🆕 Added |
| Principal Office - Street | `principal_office_street` | borrower_profiles, investor_profiles | 🆕 Added |
| Principal Office - Barangay | `principal_office_barangay` | borrower_profiles, investor_profiles | 🆕 Added |
| Principal Office - Municipality | `principal_office_municipality` | borrower_profiles, investor_profiles | 🆕 Added |
| Principal Office - Province | `principal_office_province` | borrower_profiles, investor_profiles | 🆕 Added |
| Principal Office - Country | `principal_office_country` | borrower_profiles, investor_profiles | 🆕 Added |
| Principal Office - Postal Code | `principal_office_postal_code` | borrower_profiles, investor_profiles | 🆕 Added |
| GIS Total Assets | `gis_total_assets` | borrower_profiles, investor_profiles | 🆕 Added |
| GIS Total Liabilities | `gis_total_liabilities` | borrower_profiles, investor_profiles | 🆕 Added |
| GIS Paid-up Capital | `gis_paid_up_capital` | borrower_profiles, investor_profiles | 🆕 Added |
| GIS Number of Stockholders | `gis_number_of_stockholders` | borrower_profiles, investor_profiles | 🆕 Added |
| GIS Number of Employees | `gis_number_of_employees` | borrower_profiles, investor_profiles | 🆕 Added |
| Politically Exposed Person Flag | `is_politically_exposed_person` | borrower_profiles, investor_profiles | 🆕 Added |
| PEP Details | `pep_details` | borrower_profiles, investor_profiles | 🆕 Added |
| Authorized Signatory Name | `authorized_signatory_name` | borrower_profiles, investor_profiles | 🆕 Added |
| Authorized Signatory Position | `authorized_signatory_position` | borrower_profiles, investor_profiles | 🆕 Added |
| Authorized Signatory ID Type | `authorized_signatory_id_type` | borrower_profiles, investor_profiles | 🆕 Added |
| Authorized Signatory ID Number | `authorized_signatory_id_number` | borrower_profiles, investor_profiles | 🆕 Added |

## Field Validation Rules

### Gender Field
- Allowed values: 'Male', 'Female', 'Other', 'Prefer not to say'

### Civil Status Field
- Allowed values: 'Single', 'Married', 'Divorced', 'Widowed', 'Separated'

### Secondary ID Type Field
- Allowed values: 'Drivers License', 'Postal ID', 'Voters ID', 'PhilHealth ID', 'SSS ID', 'GSIS ID', 'PRC ID', 'OFW ID', 'Senior Citizen ID', 'PWD ID'

### Business Registration Type Field
- Allowed values: 'SEC', 'CDA', 'DTI'

## Migration Notes

1. **Backward Compatibility**: All new fields are nullable and have appropriate defaults
2. **Data Integrity**: Check constraints ensure valid values for enumerated fields
3. **Indexing**: Added indexes for commonly queried fields (account type, business registration, PEP status)
4. **Rollback Support**: Complete rollback script included in migration
5. **Duplicate Prevention**: Migration checks prevent re-execution

## Implementation Status

- ✅ **Database Schema**: Complete KYC field structure added
- ⏳ **Frontend Forms**: Need to update registration forms to include new fields
- ⏳ **API Endpoints**: Need to update profile creation/update endpoints
- ⏳ **Validation Logic**: Need to implement frontend and backend validation

## Next Steps

1. Run the migration: `002_add_kyc_compliance_fields.sql`
2. Update registration forms to include new KYC fields
3. Update API endpoints to handle new fields
4. Implement conditional field display (Individual vs Non-Individual)
5. Add frontend validation for all new fields
