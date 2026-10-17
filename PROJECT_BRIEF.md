# ContentSignal — Product brief

**Problem:** Content portfolios contain information that can become inconsistent with updated reference sources. Reviewing every article manually is costly; fully automated factual judgment is unreliable.

**Hypothesis:** A source-grounded review workstation with explicit editorial policies, reference-document dependency mapping, and a measurable classification test harness can help editors focus on candidate changes while preserving human authority.

**Users:** Editorial operations analysts; medical/legal/travel content reviewers; AI adoption and quality teams.

**MVP jobs to be done:**
1. Given a submitted article and a supplied reference excerpt, show a classification, exact supporting quote, and reviewer handoff.
2. Given a source version change, find known dependent content plus low-certainty keyword candidates.
3. Given predictions against a labeled benchmark, show correct/missed classifications, priority recall, abstention recall, and evidence-quote validity.

**Non-goals:** Deliver factual medical or legal advice, automatically publish corrections, claim external publisher affiliation, ingest sensitive records, or monitor the actual Internet Brands catalog.

**North-star indicators for a later pilot:** Reviewer time to identify relevant articles; high-priority issue recall; percent of warnings accepted; unsupported citation rate; time to route a source change to the right editor. None have been measured in this prototype.

**Architecture decision:** Use source ID linkage for transparent dependency mapping. Keep probabilistic claim reasoning behind an optional API call. Score classifications with deterministic code, not a model grading itself. Keep API keys server-side.

**Build scope:** Synthetic-data evaluation and review experience suitable for rapid portfolio demonstration. A full professional deployment requires security design, expert-labeled real-world benchmarks, integrations, and compliance work.

**Live testing:** Local inference is opt-in. The hosted owner workspace uses Vercel Authentication with All Deployments, a production project-ID guard, and server-side secrets. Public demos must remain in separate projects with inference disabled. The per-instance call cap is best-effort rather than a durable billing limit.
