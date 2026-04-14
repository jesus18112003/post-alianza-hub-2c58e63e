# Project Memory

## Core
- Stack: Supabase (RLS, Edge functions). Realtime enabled.
- Design: High-end dark mode (Bg: #000, Accents: #d1c7bd, Cards: #f0e9e1). Serif headings, sans-serif data.
- Target Premium is always calculated as `monto / 12`.
- Company normalization applied globally (e.g., MOO -> MUTUAL OF OMAHA).
- Admins are explicitly excluded from agent lists/metrics.
- Admin 'Entró al Banco' metric is sum of `bank_amount` for emitido/cobrado policies.

## Memories
- [Roles Access Control](mem://auth/roles) — Admin vs Agent permissions and routing
- [Login Method](mem://auth/login-method) — Username to @postalianza.local mapping
- [Brand Identity](mem://branding/identity) — Post Alianza dark mode styling and typography
- [Discord Parser](mem://features/discord-parser) — Discord policy extraction format and rules
- [Status System](mem://features/status-system) — Policy 7-state color coding
- [Policy Rules](mem://features/policies) — Field requirements, calculations, and normalization
- [Admin Dashboard](mem://ui/admin-dashboard) — Admin supervision rules and bank amount metric
- [Agent Management](mem://features/agent-management) — Agent lifecycle, exclusion rules, and profiles
- [Policy Filtering](mem://features/filtering) — Dynamic and contextual filters
- [Closing Assignments](mem://features/closing-assignments) — Discord sales capture integration via cron
- [Collection Tracking](mem://features/collection-tracking) — Visual countdown alerts for Fecha de Cobro
- [Welcome Messages](mem://features/welcome-messages) — WhatsApp templates and placeholders
- [Excel Import](mem://features/excel-import) — Historical import logic and matching rules
- [Client Name Split](mem://features/client-name-split) — client_name split into first/last with auto-sync trigger
