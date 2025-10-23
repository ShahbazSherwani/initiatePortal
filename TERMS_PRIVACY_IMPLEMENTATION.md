# Terms & Conditions and Privacy Policy Implementation

## Overview
Added mandatory Terms & Conditions and Privacy Policy popups that appear sequentially during login and registration, similar to the existing Risk Assessment flow.

## Implementation Summary

### Files Created
1. **`src/components/TermsAndConditionsModal.tsx`**
   - Modal component displaying Terms and Conditions
   - Requires scrolling to bottom before accepting
   - Checkbox acknowledgment required
   - Same styling as Risk Statement Modal

2. **`src/components/PrivacyPolicyModal.tsx`**
   - Modal component displaying Privacy Policy
   - Requires scrolling to bottom before accepting
   - Checkbox acknowledgment required
   - Same styling as Risk Statement Modal

### Files Modified
3. **`src/screens/LogIn/LogIn.tsx`**
   - Added imports for TermsAndConditionsModal and PrivacyPolicyModal
   - Added state management for both modals
   - Updated useEffect to show modals sequentially
   - Added modal components to JSX with proper handlers

4. **`src/screens/LogIn/RegisterStep.tsx`**
   - Added imports for TermsAndConditionsModal and PrivacyPolicyModal
   - Added state management for both modals
   - Updated useEffect to show modals sequentially
   - Added modal components to JSX with proper handlers

## Sequential Flow

### Order of Appearance
1. **Risk Assessment** (existing)
2. **Terms and Conditions** (new)
3. **Privacy Policy** (new)

### User Experience
- Modals appear one after another on first visit to login/register screens
- Each modal must be:
  - Scrolled to the bottom (if content is longer than viewport)
  - Acknowledged via checkbox
  - Accepted by clicking "I Accept & Continue"
- Clicking "Cancel" closes the modal and marks it as seen
- Once accepted, the next modal appears automatically
- Session storage tracks which modals have been seen per screen (login vs register)

## Technical Details

### Session Storage Keys

#### Login Screen
- `hasSeenRiskStatement_login`
- `hasSeenTerms_login`
- `hasSeenPrivacy_login`

#### Register Screen
- `hasSeenRiskStatement_register`
- `hasSeenTerms_register`
- `hasSeenPrivacy_register`

### Features Implemented
1. **Mandatory Scrolling**
   - Auto-detects if content requires scrolling
   - If scrollable, users must scroll to bottom
   - Scroll indicator shown until bottom reached
   - Checkbox and accept button disabled until scrolled

2. **Mandatory Acknowledgment**
   - Checkbox must be checked to enable accept button
   - Checkbox disabled until scrolling complete

3. **Sequential Display**
   - Each modal triggers the next upon acceptance
   - Order: Risk → Terms → Privacy
   - Session storage ensures modals only show once per screen

4. **Consistent Styling**
   - Uses Headless UI Dialog and Transition components
   - Same color scheme as Risk Statement Modal
   - Green theme color: `#0C4B20` (primary brand color)
   - Hover color: `#8FB200`
   - Responsive design with max-width constraints

## Modal Content

### Terms and Conditions
Covers:
- Acceptance of Terms
- Platform Services
- User Eligibility
- Account Registration and Security
- Investment Transactions
- Fees and Charges
- Prohibited Activities
- Intellectual Property
- Limitation of Liability
- Dispute Resolution
- Modifications to Terms
- Termination
- Governing Law

### Privacy Policy
Covers:
- Introduction
- Information We Collect (Personal, Transaction, Technical)
- How We Use Your Information
- Information Sharing and Disclosure
- Data Security
- Data Retention
- User Rights and Choices (Access, Correction, Deletion, etc.)
- Cookies and Tracking Technologies
- Third-Party Links
- Children's Privacy
- International Data Transfers
- Changes to Privacy Policy
- Contact Information

## Testing Recommendations

1. **Clear Session Storage**
   - Clear sessionStorage keys to test first-time user experience
   - Test both login and register screens separately

2. **Test Sequential Flow**
   - Verify Risk modal appears first
   - Accept Risk modal, verify Terms modal appears
   - Accept Terms modal, verify Privacy modal appears
   - Accept Privacy modal, verify no more modals appear

3. **Test Scrolling Behavior**
   - Test on different screen sizes
   - Verify scroll indicator appears/disappears correctly
   - Verify checkbox enables after scrolling

4. **Test Cancel Behavior**
   - Clicking Cancel should close modal and mark as seen
   - Refreshing page should not show same modal again

5. **Test Accept Behavior**
   - Verify acceptance triggers next modal
   - Verify final modal acceptance allows normal use
   - Verify session storage is properly set

## Browser Compatibility
- Uses modern browser APIs (sessionStorage)
- Requires JavaScript enabled
- Tested with Headless UI transitions
- Responsive design for mobile/tablet/desktop

## Future Enhancements (Optional)
- Store acceptance in database for audit trail
- Add "Decline" option that prevents platform use
- Add version tracking for legal document updates
- Force re-acceptance when documents are updated
- Add email confirmation of acceptance
- Add download/print options for legal documents

## Notes
- Modals cannot be closed by clicking outside (intentional)
- Close button (X) functions same as Cancel
- Acceptance is mandatory for platform use
- Session storage means users see modals once per browser session per screen
- If users clear browser data, modals will appear again
