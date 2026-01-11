# Make.com HTTP Module - Complete Field Mapping

## Updated Field Mappings for InitiateGlobal → InitiatePH Sync

Add these fields to your Make.com HTTP "Make a request" module in the **Body content** section:

### Required Fields ✅ (Already configured)
- **Email**: `1.user.email`
- **First name**: `1.user.first_name`
- **Last name**: `1.user.last_name`
- **Phone number**: `1.user.phone_number`
- **Global user ID**: `1.user.global_user_id`
- **Source system**: `1.source_system`
- **Source event ID**: `1.source_event_id`

### NEW Fields to ADD ⚠️

Click **"Add item"** in the Body content section for each of these:

1. **Middle name**
   - Field name: `middle_name`
   - Value: `1.user.middle_name`

2. **Date of birth**
   - Field name: `date_of_birth`
   - Value: `1.user.date_of_birth`

3. **Age**
   - Field name: `age`
   - Value: `1.user.age`

4. **Gender**
   - Field name: `gender`
   - Value: `1.user.gender`

5. **About you**
   - Field name: `about_you`
   - Value: `1.user.about_you`

6. **Display name**
   - Field name: `display_name`
   - Value: `1.user.display_name`

## Complete Body Structure

After adding all fields, your HTTP module body should look like this:

```json
{
  "email": "{{1.user.email}}",
  "first_name": "{{1.user.first_name}}",
  "last_name": "{{1.user.last_name}}",
  "middle_name": "{{1.user.middle_name}}",
  "phone_number": "{{1.user.phone_number}}",
  "date_of_birth": "{{1.user.date_of_birth}}",
  "age": "{{1.user.age}}",
  "gender": "{{1.user.gender}}",
  "about_you": "{{1.user.about_you}}",
  "display_name": "{{1.user.display_name}}",
  "global_user_id": "{{1.user.global_user_id}}",
  "source_system": "{{1.source_system}}",
  "source_event_id": "{{1.source_event_id}}"
}
```

## What Changed?

### WordPress Sync (wordpress-sync-to-make.php)
✅ Now captures all registration fields from WordPress user meta

### InitiatePH Backend (/api/sync-user)
✅ Now accepts and stores all new fields in the database

### Database
✅ Already has columns for these fields (they were in the initial schema)

## Next Steps

1. **Save the current HTTP module** (with existing 7 fields)
2. **Edit the HTTP module** again
3. **Click "Add item"** 6 times to add the new fields listed above
4. **Save the scenario**
5. **Test** by creating a new user on InitiateGlobal with ALL fields filled
