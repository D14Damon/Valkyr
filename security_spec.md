# Security Specification for TYRANT Clan Directory

## 1. Data Invariants
1. Member documents require valid IDs conforming to alphanumeric/dash format.
2. Unauthenticated users and regular public visitors can view published clan members (`allow read: if true`).
3. Only verified admins (specifically including `kyledesillarico@gmail.com` or users in the `/admins` collection) can create, update, or delete clan members.
4. Member photoBase64 must be bounded to `<= 1433600` characters by the Turso API.
5. Admins collection can only be read/written by authenticated admins.

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Write**: Anonymous visitor attempts `POST /members/test` -> `PERMISSION_DENIED`
2. **Ghost Field Injection**: Adding unmodeled properties like `__hacked: true` -> `PERMISSION_DENIED`
3. **Huge Base64 Payload**: Injecting > 1,433,600 chars image exceeding the Turso API limit -> `400 Bad Request`
4. **Invalid Member ID**: Injecting path `../evil` or special symbols -> `PERMISSION_DENIED`
5. **Missing Required Fields**: Creating member without `ign` or `name` -> `PERMISSION_DENIED`
6. **Invalid Status Value**: Setting status to "SuperAdmin" instead of enum -> `PERMISSION_DENIED`
7. **Privilege Escalation on Admin Collection**: Non-admin writes to `/admins/{uid}` -> `PERMISSION_DENIED`
8. **Spoofed Email Write**: Writing with falsified unverified email -> `PERMISSION_DENIED`
9. **Corrupted Socials Object**: Injecting arbitrary non-string fields into socials -> `PERMISSION_DENIED`
10. **Malicious Settings Overwrite**: Unauthenticated visitor deletes `/clan_settings/main` -> `PERMISSION_DENIED`
11. **Negative Order Index**: Corrupting ordering structure -> `PERMISSION_DENIED`
12. **Tampering with Verification Status as Non-Admin**: Updating verification flag without admin credentials -> `PERMISSION_DENIED`

## 3. Test Runner Invariant
The API serves public roster reads from Turso and requires a verified Firebase admin role for mutations. Clan settings and member photos are also stored in Turso; Firestore is not the source of truth for roster data.
