## iOS ↔ Android Parity Matrix

Legend:
- Status: Complete / Partial / Missing
- Priority: P0 (must-have), P1 (important), P2 (nice-to-have)

| Feature / Screen | iOS | Android | Priority | Dependencies / Notes |
| --- | --- | --- | --- | --- |
| Auth: login + session persistence | Complete | Partial | P0 | Android lacks persistent session; currentUserOrNull() is memory-only. |
| Auth: password reset / recovery | Complete | Missing | P1 | iOS has recovery flow in SessionStore; Android missing. |
| App bootstrap (auto refresh session) | Complete | Partial | P0 | iOS refreshes/bootstraps on launch; Android does not restore session. |
| Sync HUD / status overlay | Complete | Missing | P1 | iOS shows sync state; Android has no UI for sync state. |
| Dashboard (KPIs + quick actions) | Complete | Partial | P1 | Android dashboard is simplified vs iOS. |
| Vehicles list | Complete | Partial | P0 | Android list only, no images/status chips like iOS. |
| Vehicle detail | Complete | Missing | P0 | No detail screen on Android. |
| Vehicle add/edit | Complete | Missing | P0 | No add/edit flow on Android. |
| Vehicle photos (upload/download) | Complete | Missing | P0 | iOS uses `vehicle-images` bucket; Android has no Storage wiring. |
| Expenses list + filters | Complete | Partial | P0 | Android has list/filters, but missing templates and iOS parity. |
| Expense templates | Complete | Missing | P1 | iOS supports templates; Android lacks UI. |
| Sales list + add | Complete | Partial | P0 | Android lacks full detail/edit parity vs iOS. |
| Clients list + detail | Complete | Partial | P0 | Android has list/detail but missing interactions/reminders. |
| Debts list/detail | Complete | Missing | P0 | Data layer exists on Android, UI missing. |
| Debt payments | Complete | Missing | P0 | UI missing. |
| Financial accounts list/edit | Complete | Missing | P0 | Data layer exists on Android, UI missing. |
| Account transactions | Complete | Missing | P0 | Data layer exists on Android, UI missing. |
| User management (dealer users) | Complete | Missing | P1 | UI missing. |
| Backup center (export/upload) | Complete | Missing | P2 | Depends on Storage paths and UI. |
| Data health / diagnostics | Complete | Missing | P2 | iOS has diagnostics; Android missing. |
| Global search | Complete | Missing | P2 | Not implemented on Android. |
| Paywall / subscription gating | Complete | Missing | P2 | iOS has paywall; Android missing. |
| Force update | Complete | Missing | P2 | iOS has ForceUpdateView; Android missing. |
| Offline queue persistence | Complete | Partial | P0 | Android queue exists, but lastSyncTimestamp not persisted. |

## Top-Priority Gaps (P0)
- Session persistence + bootstrap on launch.
- Vehicles: add/edit/detail + photos.
- Debts + payments.
- Financial accounts + transactions.
- Sync reliability (persist lastSyncTimestamp; surface sync state).

