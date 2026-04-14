---
name: Client name split
description: client_name split into client_first_name + client_last_name with auto-sync trigger
type: feature
---
- DB has `client_first_name` and `client_last_name` columns on policies
- A trigger `trg_sync_client_name` auto-syncs: if first+last provided → builds client_name; if only client_name provided (legacy) → splits on first space
- AddClosingByMessage and Discord use `client_name` directly — trigger handles the split automatically
- Welcome template placeholders: `{{nombre}}` and `{{apellido}}` replace the old `{{cliente}}`
