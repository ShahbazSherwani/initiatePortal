# API INTEGRATION REQUEST
## User Data Sync between Initiate PH and Initiate Global

**Date:** December 10, 2024  
**From:** Initiate PH Development Team  
**To:** Initiate Global Development Team  
**Priority:** High

---

## Introduction

As discussed, we are proceeding with the user data integration between **initiateph.com** and **initiateglobal.org** to enable seamless account creation and synchronization for users accessing both platforms. This integration will allow users registered on Initiate PH to automatically or manually create accounts on Initiate Global for donation and rewards programs.

We will be implementing this integration using **Make.com** as the middleware layer, triggered by user registration events on Initiate PH.

---

## Required Documentation & Technical Specifications

To proceed with the integration, we require the following technical documentation and specifications from your team:

---

### 1. API Endpoint Documentation ✅ RECEIVED

- **Base URL:**  
  `https://initiateglobal.org/wp-json/jet-cct/`

- **Endpoint Paths:**  
  - GET all users: `https://initiateglobal.org/wp-json/jet-cct/users`
  - GET single user: `https://initiateglobal.org/wp-json/jet-cct/users/{_ID}`
  - POST new user: `https://initiateglobal.org/wp-json/jet-cct/users` (assumed)

- **HTTP Methods:**  
  GET (read), POST (create - to be confirmed)

- **Content-Type:**  
  `application/json`

---

### 2. Authentication Method ✅ RECEIVED

- **Type:** WordPress Application Password
- **Username:** `initiatead`
- **Password:** `Hqrw tsdh s4R2 Xfc1 JlhP WRrJ`
- **Header Format:** Basic Authentication (Base64 encoded)

**Authentication Header:**
```http
POST /wp-json/jet-cct/users
Headers:
  Authorization: Basic aW5pdGlhdGVhZDpIcXJ3IHRzZGggczRSMiBYZmMxIEpsaFAgV1JySg==
  Content-Type: application/json
```

**Note:** The credentials above are Base64 encoded as: `initiatead:Hqrw tsdh s4R2 Xfc1 JlhP WRrJ`

---

### 3. Request Schema & Required Fields

Please provide the exact field names, data types, validation rules, and whether each field is required or optional.

**Example:**

| Field Name | Data Type | Required | Validation Rules | Example Value |
|------------|-----------|----------|------------------|---------------|
| `email` | String | Yes | Valid email format | `user@example.com` |
| `first_name` | String | Yes | 2-100 characters | `John` |
| `last_name` | String | Yes | 2-100 characters | `Doe` |
| `phone` | String | No | Philippine format (+63 or 09) | `+639123456789` |
| `user_type` | String | No | Enum: `investor`, `borrower`, `donor` | `investor` |
| `source` | String | Yes | Fixed value: `initiateph` | `initiateph` |
| `external_uid` | String | No | Firebase UID (to prevent duplicates) | `abc123xyz` |

**Sample Request Body:**
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+639123456789",
  "user_type": "investor",
  "source": "initiateph",
  "external_uid": "firebase_uid_12345"
}
```

---

### 4. Response Schema

Please provide the structure of successful and error responses:

**Success Response:**
```json
{
  "success": true,
  "user_id": 12345,
  "message": "User created successfully",
  "data": {
    "email": "user@example.com",
    "wordpress_user_id": 12345,
    "account_url": "https://initiateglobal.org/my-account/"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Email already exists",
  "error_code": "DUPLICATE_EMAIL",
  "status_code": 409
}
```

**Possible Error Codes:**
- `400`: Bad Request (invalid data)
- `401`: Unauthorized (invalid API key)
- `403`: Forbidden (insufficient permissions)
- `409`: Conflict (duplicate user)
- `422`: Validation error (missing required fields)
- `500`: Internal server error

---

### 5. Duplicate User Handling

Please clarify the behavior when a user with the same email already exists:

- **Option A:** Return error `409 Conflict` with message "User already exists"
- **Option B:** Update existing user (upsert logic)
- **Option C:** Return success with existing user ID

**Recommendation:** We suggest using the `external_uid` field (Firebase UID from Initiate PH) as a unique identifier to prevent duplicate account creation.

---

### 6. WordPress-Specific Information *(if applicable)*

If Initiate Global is built on WordPress:

- **Is the WordPress REST API enabled?**  
  Yes / No

- **Default WordPress endpoint or custom endpoint?**  
  Example: `/wp-json/wp/v2/users` (default) or `/wp-json/custom/v1/users` (custom)

- **WordPress user role assignment:**  
  What role should Initiate PH users be assigned? (Subscriber, Customer, Donor, etc.)

- **Custom fields/meta:**  
  If you use Advanced Custom Fields (ACF) or custom user meta, please provide field names and meta keys.

- **Authentication method for WordPress:**  
  - Application Passwords (recommended for WordPress 5.6+)
  - JWT Authentication Plugin
  - Basic Auth
  - Custom API key

---

### 7. Rate Limiting

Please specify API rate limits:

- **Requests per minute/hour:** Example: 100 requests/minute, 10,000 requests/day
- **Throttling behavior:** What happens if we exceed the limit? (429 error, temporary block, etc.)
- **Retry-After header:** Do you provide a `Retry-After` header in rate limit responses?

---

### 8. Testing & Staging Environment

To ensure a smooth integration, we require:

- **Staging/Sandbox API URL:**  
  Example: `https://staging.initiateglobal.org/api/v1/users`

- **Test API Credentials:**  
  Non-production API keys for testing

- **Test User Creation:**  
  Can we create/delete test users in the staging environment for integration testing?

- **Test Data Reset:**  
  Is there a way to reset test data after testing?

---

### 9. Webhooks/Callbacks *(optional)*

If Initiate Global needs to send data back to Initiate PH (e.g., user account status updates):

- **Webhook URL format required:**  
  We can provide: `https://api.initiateph.com/webhooks/user-status`

- **Webhook payload structure:**  
  Please specify the JSON structure you will send

- **Security:** Will webhooks be signed? (HMAC, shared secret, etc.)

---

### 10. Field Mapping Confirmation ✅ CONFIRMED

| Initiate PH Field | Initiate Global Field | Data Type | Required | Notes |
|-------------------|----------------------|-----------|----------|-------|
| `email` | `email` | String | Yes | Email address |
| `first_name` | `first_name` | String | Yes | First name |
| `last_name` | `last_name` | String | Yes | Last name |
| `phone_number` | `phone_number` | String | Yes | Phone number |
| `user_type` | `account_type` | String | Yes | investor/borrower/donor |
| N/A | `middle_name` | String | No | Optional field |
| N/A | `organization` | String | No | For organizational accounts |
| N/A | `organization_type` | String | No | Type of organization |
| N/A | `about_the_organization` | String | No | Organization description |
| N/A | `date_of_birth` | Date | No | DOB |
| N/A | `category` | String | No | User category |
| N/A | `age` | Number | No | User age |
| N/A | `gender` | String | No | Gender |
| `created_at` | `cct_created` | Timestamp | Auto | Creation timestamp |
| N/A | `cct_modified` | Timestamp | Auto | Last modified timestamp |

---

## Security & Compliance Requirements

- **HTTPS/SSL:** Please confirm all API endpoints use HTTPS with valid SSL certificates.
- **Data Privacy:** Confirm compliance with GDPR, Data Privacy Act of 2012, and other applicable regulations.
- **User Consent:** Should we require explicit user consent before syncing data to Initiate Global?
- **Data Encryption:** Is sensitive data (PII) encrypted at rest and in transit on your end?
- **Audit Logging:** Do you log API requests for security and compliance purposes?

---

## Proposed Integration Flow

1. **User registers on Initiate PH** → Account created in Firebase + PostgreSQL
2. **User clicks "Create Donation & Rewards Account"** (optional button in profile)
3. **Initiate PH sends webhook** → Make.com receives trigger
4. **Make.com processes data** → Field mapping, validation, transformation
5. **Make.com calls Initiate Global API** → User account created
6. **Initiate Global returns response** → Success/failure logged in Initiate PH
7. **Optional:** Store Initiate Global user ID in Initiate PH for future reference

---

## Timeline & Next Steps

### Phase 1: Documentation Review (1-2 days)
- Await complete API documentation from Initiate Global team
- Review and validate API specifications

### Phase 2: Make.com Setup (1-2 days)
- Configure Make.com workflow
- Set up webhook triggers and API connections

### Phase 3: Integration Development (2-3 days)
- Build Initiate PH webhook endpoints
- Update user registration flow
- Add "Create Donation Account" button

### Phase 4: Testing (2-3 days)
- Test in staging environment
- Validate field mapping, error handling, duplicate detection
- Load testing (100+ user creations)

### Phase 5: Production Deployment (1 day)
- Deploy to production
- Monitor first 100 user syncs
## Deliverables Status

- [x] Complete API documentation (endpoint, authentication, request/response schemas)
- [x] Production API credentials provided
- [x] Field mapping confirmed
- [ ] **PENDING:** POST endpoint confirmation (assumed: POST to same endpoint)
- [ ] **PENDING:** Staging/sandbox environment access for testing
- [ ] **PENDING:** Error response schemas and codes
- [ ] **PENDING:** Rate limiting specifications
- [ ] **PENDING:** Duplicate handling strategy (check by email before POST?), request/response schemas)
- [ ] Staging/sandbox environment access and test API credentials
- [ ] Field mapping confirmation
- [ ] Error codes and handling guidelines
- [ ] Rate limiting specifications
- [ ] Security and compliance documentation
- [ ] Technical point of contact for integration questions

---

## Contact Information

**Initiate PH Technical Lead:**  
Shahbaz Sherwani  
Email: m.shahbazsherwani@gmail.com  
Platform: initiateph.com

**Available for:**
- Integration planning calls
- Technical Q&A sessions
- Testing coordination

---

## Additional Notes

- We recommend starting with a **manual opt-in button** ("Create Donation & Rewards Account") rather than automatic sync for all users to ensure user consent and GDPR compliance.
- Once the integration is stable, we can discuss enabling automatic account creation for new users with explicit consent during registration.
- We will provide detailed error logs and monitoring dashboards for tracking integration health.

---

**We look forward to collaborating with your team on this integration. Please reply with the requested documentation at your earliest convenience.**

Best regards,  
**Initiate PH Development Team**

---

## Appendix: Make.com Integration Architecture

### Components Required:
1. **Initiate PH Webhook Endpoint:** `/api/webhooks/user-created`
2. **Make.com Scenario:** Webhook → Data Transform → HTTP Request
3. **Initiate Global API:** User creation endpoint
4. **Error Handling:** Retry logic, logging, alerts

### Data Flow Diagram:
```
[Initiate PH User Registration]
          ↓
[Firebase Auth + PostgreSQL]
          ↓
[Webhook Trigger (optional button)]
          ↓
[Make.com Receives Webhook]
          ↓
[Data Mapping & Validation]
          ↓
[HTTP POST to Initiate Global API]
          ↓
[Response Handling]
          ↓
[Log Success/Failure in Initiate PH]
```

### Security Considerations:
- All webhook communications over HTTPS
- API keys stored in environment variables
- Request signing for webhook verification
- Rate limiting to prevent abuse
- Audit logging for all sync attempts

---

**End of Document**
