---
name: Simulated provider actions
description: The UI contract for zero-key provider demonstrations.
---

Provider action availability is determined by the provider's capability mode as well as its state. A zero-key demo provider may report `state: simulated`; it should remain runnable in the walkthrough, while the UI must keep the action visibly labeled as simulated and never imply that an external service was contacted.

**Why:** The demo narrative is intentionally credential-free, so gating actions only on a production-ready state makes the core walkthrough appear broken even though the API is designed to simulate it.

**How to apply:** When adding or changing provider launch UI, allow the explicit simulated state/mode through the action gate, keep real integrations gated by their readiness state, and show simulated status in badges and receipts.