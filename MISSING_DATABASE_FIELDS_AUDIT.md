# Missing Database Fields - Comprehensive Audit

## Overview
This document identifies ALL form fields that exist in the frontend but are NOT stored in the database. These fields need to be added to ensure complete data capture.

---

## 📋 KYCForm.tsx Fields Analysis

### ✅ Fields Already in Database (via migrations 005 & 006)
- first_name, last_name, middle_name
- date_of_birth, place_of_birth
- nationality, gender, civil_status
- mobile_number, email_address
- present_address, permanent_address, city, state, postal_code, country
- national_id, passport, tin_number
- occupation, employer_name, employer_address, employment_status
- gross_annual_income, source_of_income
- business_registration_type, business_registration_date, corporate_tin
- nature_of_business
- principal_office_street, principal_office_barangay, principal_office_country, principal_office_state, principal_office_city, principal_office_postal_code
- authorized_signatory_name, authorized_signatory_position, authorized_signatory_id_number
- is_politically_exposed_person
- national_id_file, passport_file

---

## ❌ MISSING FIELDS FROM DATABASE

### 1. **groupType** (from KYCForm.tsx line 12)
- **Used in:** KYCForm component
- **Purpose:** Categorize users into groups (Farmer/Fisherfolk, LGU Officer, Teacher, Other Government Employee, Others)
- **Frontend:** Line 138-158 in KYCForm.tsx
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `group_type VARCHAR(100)`

### 2. **contactEmail** (from KYCForm.tsx line 18)
- **Used in:** KYCForm component - Individual Information section
- **Purpose:** Alternative contact email (different from main email)
- **Frontend:** Line 234-244 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `contact_email VARCHAR(255)`
- **Status:** Backend uses `contact_email` but may not be in schema

### 3. **secondaryIdType** (from KYCForm.tsx line 19)
- **Used in:** KYCForm component - Secondary Government ID
- **Purpose:** Type of secondary ID (Drivers License, Postal ID, Voters ID, etc.)
- **Frontend:** Line 248-258 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `secondary_id_type VARCHAR(100)`

### 4. **secondaryIdNumber** (from KYCForm.tsx line 20)
- **Used in:** KYCForm component - Secondary Government ID
- **Purpose:** Number of secondary ID document
- **Frontend:** Line 261-270 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `secondary_id_number VARCHAR(100)`

### 5. **emergencyContactName** (from KYCForm.tsx line 23)
- **Used in:** KYCForm component - Emergency Contact section
- **Purpose:** Name of emergency contact person
- **Frontend:** Line 277-286 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `emergency_contact_name VARCHAR(255)`
- **Status:** Backend has this at line 5903, needs verification in schema

### 6. **emergencyContactRelationship** (from KYCForm.tsx line 24)
- **Used in:** KYCForm component - Emergency Contact section
- **Purpose:** Relationship to emergency contact (Spouse, Parent, Child, Sibling, etc.)
- **Frontend:** Line 289-299 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `emergency_contact_relationship VARCHAR(100)`
- **Status:** Backend has this at line 5904, needs verification in schema

### 7. **emergencyContactPhone** (from KYCForm.tsx line 25)
- **Used in:** KYCForm component - Emergency Contact section
- **Purpose:** Phone number of emergency contact
- **Frontend:** Line 302-312 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `emergency_contact_phone VARCHAR(50)`
- **Status:** Backend has this at line 5905, needs verification in schema

### 8. **emergencyContactEmail** (from KYCForm.tsx line 26)
- **Used in:** KYCForm component - Emergency Contact section
- **Purpose:** Email of emergency contact
- **Frontend:** Line 315-325 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `emergency_contact_email VARCHAR(255)`
- **Status:** Backend has this at line 5906, needs verification in schema

### 9. **emergencyContactAddress** 
- **Used in:** Backend at line 5907 (not in KYCForm interface but in server)
- **Purpose:** Address of emergency contact
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `emergency_contact_address TEXT`

### 10. **businessRegistrationNumber** (from KYCForm.tsx line 29)
- **Used in:** KYCForm component - Business/Non-Individual section
- **Purpose:** SEC/CDA/DTI registration number
- **Frontend:** Line 352-358 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `business_registration_number VARCHAR(100)`
- **Status:** Backend uses `registration_number`, need to align naming

### 11. **principalOfficeMunicipality** (from KYCForm.tsx line 35)
- **Used in:** KYCForm component - Principal Office Address
- **Purpose:** Municipality/City of principal office
- **Frontend:** Line 424-430 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `principal_office_municipality VARCHAR(100)`
- **Note:** Backend uses `principal_office_city` - need to align or add both

### 12. **principalOfficeProvince** (from KYCForm.tsx line 36)
- **Used in:** KYCForm component - Principal Office Address
- **Purpose:** Province of principal office
- **Frontend:** Line 433-439 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `principal_office_province VARCHAR(100)`
- **Note:** Backend uses `principal_office_state` - need to align or add both

### 13. **gisTotalAssets** (from KYCForm.tsx line 43)
- **Used in:** KYCForm component - General Information Sheet
- **Purpose:** Total assets for business entities (GIS requirement)
- **Frontend:** Line 472-479 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `gis_total_assets DECIMAL(15, 2)`

### 14. **gisTotalLiabilities** (from KYCForm.tsx line 44)
- **Used in:** KYCForm component - General Information Sheet
- **Purpose:** Total liabilities for business entities (GIS requirement)
- **Frontend:** Line 482-489 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `gis_total_liabilities DECIMAL(15, 2)`

### 15. **gisPaidUpCapital** (from KYCForm.tsx line 45)
- **Used in:** KYCForm component - General Information Sheet
- **Purpose:** Paid-up capital for business entities (GIS requirement)
- **Frontend:** Line 492-499 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `gis_paid_up_capital DECIMAL(15, 2)`

### 16. **gisNumberOfStockholders** (from KYCForm.tsx line 46)
- **Used in:** KYCForm component - General Information Sheet
- **Purpose:** Number of stockholders for business entities
- **Frontend:** Line 502-509 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `gis_number_of_stockholders INTEGER`

### 17. **gisNumberOfEmployees** (from KYCForm.tsx line 47)
- **Used in:** KYCForm component - General Information Sheet
- **Purpose:** Number of employees for business entities
- **Frontend:** Line 512-519 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `gis_number_of_employees INTEGER`

### 18. **pepDetails** (from KYCForm.tsx line 51)
- **Used in:** KYCForm component - PEP Declaration
- **Purpose:** Details about Politically Exposed Person status
- **Frontend:** Line 595-602 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `pep_details TEXT`
- **Status:** May already exist in migration 005

### 19. **authorizedSignatoryIdType** (from KYCForm.tsx line 54)
- **Used in:** KYCForm component - Authorized Signatory
- **Purpose:** Type of ID for authorized signatory
- **Frontend:** Line 549-559 in KYCForm.tsx
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `authorized_signatory_id_type VARCHAR(100)`

---

## 📄 Settings.tsx Fields Analysis

### From profileData state (lines 48-139):

#### ✅ Already in Database:
- fullName, username, email, phone
- dateOfBirth, nationality
- address: street, barangay, city, state, country, postalCode
- identification: nationalId, passport, tin
- bankAccount: accountName, bankName, accountType, accountNumber, iban, swiftCode
- businessInfo: entityType, businessRegistrationType, businessRegistrationNumber, businessRegistrationDate, corporateTin, natureOfBusiness
- principalOfficeAddress: street, barangay, municipality, province, country, postalCode
- authorizedSignatory: name, position, idType, idNumber

#### ❌ MISSING from Database:

### 20. **username** (from Settings.tsx line 51)
- **Used in:** Settings screen - Profile Information
- **Purpose:** Unique username for user identification
- **Tables needed:** users
- **SQL:** `username VARCHAR(100) UNIQUE`
- **Note:** Critical for user profiles, should be indexed

### 21. **address.street** (from Settings.tsx line 56)
- **Used in:** Settings screen - Address section
- **Purpose:** Street address
- **Tables needed:** users
- **SQL:** `street VARCHAR(255)`

### 22. **address.barangay** (from Settings.tsx line 57)
- **Used in:** Settings screen - Address section
- **Purpose:** Barangay (subdivision) in Philippines
- **Tables needed:** users
- **SQL:** `barangay VARCHAR(100)`

### 23. **identification.secondaryIdType** (from Settings.tsx line 65)
- **Used in:** Settings screen - Identification section
- **Purpose:** Type of secondary ID document
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `secondary_id_type VARCHAR(100)`
- **Note:** Duplicated from KYCForm analysis

### 24. **identification.secondaryIdNumber** (from Settings.tsx line 66)
- **Used in:** Settings screen - Identification section
- **Purpose:** Number of secondary ID document
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `secondary_id_number VARCHAR(100)`
- **Note:** Duplicated from KYCForm analysis

### 25. **identification.nationalIdFile** (from Settings.tsx line 67)
- **Used in:** Settings screen - Document uploads
- **Purpose:** Base64 or file path for national ID document
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `national_id_file TEXT`
- **Status:** Should exist from migration 006

### 26. **identification.passportFile** (from Settings.tsx line 68)
- **Used in:** Settings screen - Document uploads
- **Purpose:** Base64 or file path for passport document
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `passport_file TEXT`
- **Status:** Should exist from migration 006

### 27. **personalInfo.placeOfBirth** (from Settings.tsx line 71)
- **Used in:** Settings screen - Personal Information
- **Purpose:** Birth place
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `place_of_birth VARCHAR(255)`
- **Status:** Should exist from migration 005

### 28. **personalInfo.gender** (from Settings.tsx line 72)
- **Used in:** Settings screen - Personal Information
- **Purpose:** Gender identity
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `gender VARCHAR(50)`
- **Status:** Should exist from migration 005

### 29. **personalInfo.civilStatus** (from Settings.tsx line 73)
- **Used in:** Settings screen - Personal Information
- **Purpose:** Marital status
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `civil_status VARCHAR(100)`
- **Status:** Should exist from migration 005

### 30. **personalInfo.motherMaidenName** (from Settings.tsx line 75)
- **Used in:** Settings screen - Personal Information
- **Purpose:** Mother's maiden name (security question)
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `mother_maiden_name VARCHAR(255)`

### 31. **personalInfo.contactEmail** (from Settings.tsx line 76)
- **Used in:** Settings screen - Contact Information
- **Purpose:** Alternative contact email
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `contact_email VARCHAR(255)`
- **Note:** Duplicated from KYCForm analysis

### 32. **employmentInfo.employerName** (from Settings.tsx line 79)
- **Used in:** Settings screen - Employment section
- **Purpose:** Name of employer
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `employer_name VARCHAR(255)`
- **Status:** Should exist from migration 005

### 33. **employmentInfo.occupation** (from Settings.tsx line 80)
- **Used in:** Settings screen - Employment section
- **Purpose:** Job title/occupation
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `occupation VARCHAR(255)`
- **Status:** Should exist from migration 005

### 34. **employmentInfo.employerAddress** (from Settings.tsx line 81)
- **Used in:** Settings screen - Employment section
- **Purpose:** Address of employer
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `employer_address TEXT`
- **Status:** Should exist from migration 005

### 35. **employmentInfo.sourceOfIncome** (from Settings.tsx line 82)
- **Used in:** Settings screen - Employment section
- **Purpose:** Primary source of income
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `source_of_income TEXT`
- **Status:** Should exist from migration 005

### 36. **employmentInfo.monthlyIncome** (from Settings.tsx line 83)
- **Used in:** Settings screen - Employment section
- **Purpose:** Monthly income amount
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `monthly_income DECIMAL(15, 2)`

### 37. **emergencyContact.name** (from Settings.tsx line 86)
- **Used in:** Settings screen - Emergency Contact section
- **Purpose:** Emergency contact name
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `emergency_contact_name VARCHAR(255)`
- **Note:** Duplicated from KYCForm analysis

### 38. **emergencyContact.relationship** (from Settings.tsx line 87)
- **Used in:** Settings screen - Emergency Contact section
- **Purpose:** Relationship to emergency contact
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `emergency_contact_relationship VARCHAR(100)`
- **Note:** Duplicated from KYCForm analysis

### 39. **emergencyContact.phone** (from Settings.tsx line 88)
- **Used in:** Settings screen - Emergency Contact section
- **Purpose:** Emergency contact phone
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `emergency_contact_phone VARCHAR(50)`
- **Note:** Duplicated from KYCForm analysis

### 40. **emergencyContact.address** (from Settings.tsx line 89)
- **Used in:** Settings screen - Emergency Contact section
- **Purpose:** Emergency contact address
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `emergency_contact_address TEXT`
- **Note:** Duplicated from KYCForm analysis

### 41. **businessInfo.businessAddress** (from Settings.tsx line 101)
- **Used in:** Settings screen - Business Information
- **Purpose:** Main business address
- **Tables needed:** borrower_profiles, investor_profiles
- **SQL:** `business_address TEXT`
- **Status:** Should exist from migration 005

### 42. **businessInfo.gisTotalAssets** (from Settings.tsx line 103)
- **Purpose:** GIS Total Assets
- **SQL:** `gis_total_assets DECIMAL(15, 2)`
- **Note:** Duplicated from KYCForm analysis

### 43. **businessInfo.gisTotalLiabilities** (from Settings.tsx line 104)
- **Purpose:** GIS Total Liabilities
- **SQL:** `gis_total_liabilities DECIMAL(15, 2)`
- **Note:** Duplicated from KYCForm analysis

### 44. **businessInfo.gisPaidUpCapital** (from Settings.tsx line 105)
- **Purpose:** GIS Paid-up Capital
- **SQL:** `gis_paid_up_capital DECIMAL(15, 2)`
- **Note:** Duplicated from KYCForm analysis

### 45. **businessInfo.gisNumberOfStockholders** (from Settings.tsx line 106)
- **Purpose:** GIS Number of Stockholders
- **SQL:** `gis_number_of_stockholders INTEGER`
- **Note:** Duplicated from KYCForm analysis

### 46. **businessInfo.gisNumberOfEmployees** (from Settings.tsx line 107)
- **Purpose:** GIS Number of Employees
- **SQL:** `gis_number_of_employees INTEGER`
- **Note:** Duplicated from KYCForm analysis

### 47. **investmentInfo.experience** (from Settings.tsx line 119)
- **Used in:** Settings screen - Investment Information (investors only)
- **Purpose:** Investment experience level
- **Tables needed:** investor_profiles
- **SQL:** `investment_experience VARCHAR(100)`
- **Status:** Should exist from migration 005

### 48. **investmentInfo.preference** (from Settings.tsx line 120)
- **Used in:** Settings screen - Investment Information
- **Purpose:** Investment type preference
- **Tables needed:** investor_profiles
- **SQL:** `investment_preference VARCHAR(100)`

### 49. **investmentInfo.riskTolerance** (from Settings.tsx line 121)
- **Used in:** Settings screen - Investment Information
- **Purpose:** Risk tolerance level
- **Tables needed:** investor_profiles
- **SQL:** `risk_tolerance VARCHAR(100)`
- **Status:** Should exist from migration 005

### 50. **investmentInfo.portfolioValue** (from Settings.tsx line 122)
- **Used in:** Settings screen - Investment Information
- **Purpose:** Current portfolio value
- **Tables needed:** investor_profiles
- **SQL:** `portfolio_value DECIMAL(15, 2)`

### 51. **pepStatus** (from Settings.tsx line 124)
- **Used in:** Settings screen - PEP Status
- **Purpose:** Boolean for PEP status
- **Tables needed:** users, borrower_profiles, investor_profiles
- **SQL:** `pep_status BOOLEAN DEFAULT FALSE`
- **Note:** Backend uses `is_politically_exposed_person`

### 52. **accountType** (from Settings.tsx line 125)
- **Used in:** Settings screen
- **Purpose:** Account type (Individual/Business)
- **Tables needed:** users
- **SQL:** `account_type VARCHAR(50) DEFAULT 'individual'`
- **Status:** Should already exist in users table

### 53. **profileType** (from Settings.tsx line 126)
- **Used in:** Settings screen
- **Purpose:** Profile type (Borrower/Investor)
- **Tables needed:** users
- **SQL:** `profile_type VARCHAR(50)`

---

## 🗂️ users Table Analysis

### From migration 000_initial_schema_with_kyc.sql:

#### ✅ Fields Already in users Table:
- firebase_uid, email, full_name, phone_number, role, account_type, is_admin, has_completed_registration
- first_name, last_name, middle_name, date_of_birth, place_of_birth, nationality, gender, marital_status
- email_address, mobile_number
- present_address, permanent_address, city, state, postal_code, country
- national_id, passport, drivers_license, tin_number
- employment_status, occupation, employer_name, employer_address, monthly_income, income_source
- company_name, business_type, business_registration_number, tax_identification_number, business_address
- authorized_person_name, authorized_person_position
- investment_experience, risk_tolerance, investment_goals, liquid_net_worth, annual_income, investment_horizon
- pep_status, pep_details, pep_country, pep_position
- related_pep_status, related_pep_details, related_pep_relationship, related_pep_country, related_pep_position

#### ❌ MISSING from users Table:

### 54. **username** (CRITICAL)
- **Purpose:** Unique username identifier
- **SQL:** `username VARCHAR(100) UNIQUE`
- **Index:** `CREATE UNIQUE INDEX idx_users_username ON users(username);`

### 55. **street** (Address component)
- **Purpose:** Street address line
- **SQL:** `street VARCHAR(255)`

### 56. **barangay** (Address component)
- **Purpose:** Barangay (Philippines subdivision)
- **SQL:** `barangay VARCHAR(100)`

### 57. **group_type**
- **Purpose:** User group categorization
- **SQL:** `group_type VARCHAR(100)`

### 58. **profile_type**
- **Purpose:** Profile type indicator
- **SQL:** `profile_type VARCHAR(50)`

---

## 📊 Summary by Table

### users Table - Missing Fields (5):
1. username (UNIQUE)
2. street
3. barangay
4. group_type
5. profile_type

### borrower_profiles Table - Missing Fields (24):
1. group_type
2. contact_email
3. secondary_id_type
4. secondary_id_number
5. emergency_contact_name
6. emergency_contact_relationship
7. emergency_contact_phone
8. emergency_contact_email
9. emergency_contact_address
10. business_registration_number (or align with registration_number)
11. principal_office_municipality
12. principal_office_province
13. gis_total_assets
14. gis_total_liabilities
15. gis_paid_up_capital
16. gis_number_of_stockholders
17. gis_number_of_employees
18. pep_details
19. authorized_signatory_id_type
20. mother_maiden_name
21. monthly_income
22. business_address
23. barangay
24. country_code

### investor_profiles Table - Missing Fields (26):
1. group_type
2. contact_email
3. secondary_id_type
4. secondary_id_number
5. emergency_contact_name
6. emergency_contact_relationship
7. emergency_contact_phone
8. emergency_contact_email
9. emergency_contact_address
10. business_registration_number (or align with registration_number)
11. principal_office_municipality
12. principal_office_province
13. gis_total_assets
14. gis_total_liabilities
15. gis_paid_up_capital
16. gis_number_of_stockholders
17. gis_number_of_employees
18. pep_details
19. authorized_signatory_id_type
20. mother_maiden_name
21. monthly_income
22. investment_preference
23. portfolio_value
24. business_address
25. barangay
26. country_code

---

## 🎯 Priority Classification

### CRITICAL (Must Add Before Launch):
1. **username** - Essential for user identification
2. **phone_number** - Already being used, needs migration
3. **emergency_contact_*** fields - Required for KYC compliance
4. **gis_*** fields - Required for business accounts (regulatory requirement)
5. **secondary_id_*** fields - Required for full KYC compliance

### HIGH (Should Add Soon):
1. **group_type** - Used for categorization and filtering
2. **pep_details** - Required when PEP status is true
3. **authorized_signatory_id_type** - Needed for business accounts
4. **mother_maiden_name** - Common security requirement
5. **principal_office_municipality/province** - Better address granularity

### MEDIUM (Nice to Have):
1. **investment_preference** - Enhances investor profiles
2. **portfolio_value** - Useful for investor analytics
3. **profile_type** - UI/UX enhancement
4. **monthly_income** - Better than just annual income
5. **business_address** - Separate from principal office

### LOW (Can Add Later):
1. **business_registration_number** - If different from registration_number
2. **barangay** (in users table) - Address detail
3. **street** (in users table) - Address detail
4. **country_code** - Phone number metadata

---

## 🔄 Next Steps

1. **Execute phone_number migration** (007_add_phone_number_to_users.sql)
2. **Create comprehensive migration** for all CRITICAL and HIGH priority fields
3. **Update backend INSERT/UPDATE queries** to include all new fields
4. **Test with sample data** to ensure all fields persist correctly
5. **Deploy to production**

---

## 📝 Notes

- Some fields may exist in migrations but not actually created in Supabase
- Backend code references some fields that don't exist in schema (e.g., emergency_contact_*)
- Naming inconsistencies exist (e.g., `businessRegistrationNumber` vs `registration_number`)
- Need to verify which migrations have been executed in production Supabase instance
