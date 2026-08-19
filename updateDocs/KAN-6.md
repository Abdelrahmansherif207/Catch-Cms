# KAN-6 — Contact Us

## Changes

### 1. Fix Reply Endpoint URL
- **File:** `src/features/contacts/api/contacts.api.ts`
- Changed `sendReply` URL from `/contacts/{id}/replay` to `/contacts/{id}/reply`
- The Jira spec used the typo "replay" but the actual registered route is "reply"

### 2. Debounced Search (300ms)
- **File:** `src/features/contacts/pages/contacts-page.tsx`
- Replaced manual Enter-key / button-click search with auto-debounce (300ms)
- Uses `useRef` timer to debounce the `searchInput` → `search` state update
- Removed the search button icon; search icon is now inline decoration

### 3. Message Preview Column
- **File:** `src/features/contacts/components/contacts-table.tsx`
- Added "Message" column (hidden on mobile) showing truncated message body (`max-w-[250px]`)
- Updated column count from 5 to 6 to accommodate the new column

### 4. Empty Filter State
- **File:** `src/features/contacts/pages/contacts-page.tsx`
- Added `hasActiveFilters` boolean (true when search or read filter is active)
- **File:** `src/features/contacts/components/contacts-table.tsx`
- Added `hasActiveFilters`, `onClearFilters` props
- When `hasActiveFilters` is true and data is empty: shows "No messages match your filter." with a "Clear Filters" button
- When no filters and data is empty: shows "No messages yet."
- `clearFilters()` resets search, searchInput, readFilter, and page to defaults

### 5. Character Counter on Reply Form
- **File:** `src/features/contacts/components/contact-reply-dialog.tsx`
- Added `{message.length}/{MESSAGE_MAX}` counter below the textarea
- Counter turns red when over 90% of max length
- Max length is 5000 characters (matching API spec)

### 6. 422 Validation Errors on Reply Form
- **File:** `src/features/contacts/components/contact-reply-dialog.tsx`
- Added `serverErrors` state tracking `{ subject?, message? }`
- On API error with status 422, extracts field-level errors and displays them inline below the subject/message fields
- Errors clear when dialog re-opens

### 7. Removed Broken `no_replay` Filter
- **File:** `src/features/contacts/pages/contacts-page.tsx`
- Removed the `replayFilter` state and its select dropdown entirely
- The `replayFilter` with `no_replay` value had no API support — the API only accepts `replay=true` (no `false` param)
- Also removed `replayParam` from the API params object

### 8. Translations Added
- **Files:** `en/translation.json` and `ar/translation.json`
- New keys under `contacts`: `empty`, `noFilterResults`, `clearFilters`

---

## API Bugs

| # | Endpoint | Issue |
|---|---|---|
| BUG-1 | `POST /api/v1/contacts/{id}/reply` | Route exists but controller method `sendReply` does not exist. Response: `"Method ContactController::sendReply does not exist."` This makes the reply feature completely broken. |
| BUG-2 | `POST /api/v1/contacts/{id}/replay` | As written in Jira spec — route doesn't exist at all (404). The correct route is `/reply` (without 'a'). |
| BUG-3 | `POST /api/v1/contact-us` | Alternative public endpoint documented in spec — route doesn't exist (404). If needed for public forms, this must be registered in the API. |

All confirmed via curl on 2026-07-20. Note: `GET /contacts` list and filters (read/unread) work correctly. `GET /contacts/{id}` detail and `DELETE /contacts/{id}` were rate-limited during testing but assumed working from existing frontend usage.
