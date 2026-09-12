# Security Event Dashboard

Security Event Dashboard is a local browser project for reviewing recorded security events with a focus on authentication failures and short time-window patterns.

The project is deliberately local and small. It is meant to make event grouping and defensive monitoring logic visible without requiring a SIEM, remote collector or production log source.

## What the dashboard focuses on

- Authentication-failure review
- Time-windowed event grouping
- Security-event summaries
- A lightweight browser dashboard
- Privacy-conscious handling of recorded data
- Deterministic local examples for repeatable testing

## Why I built it

Security logs become much more useful once isolated events are placed in context. This project explores that idea from the presentation side: take a bounded recorded dataset, summarize it and surface clusters that deserve attention.

I kept the project separate from live infrastructure so the dashboard can be used as a safe learning and portfolio project.

## Design approach

The interface and event-analysis code are kept lightweight. The repository is JavaScript-based and does not need a remote monitoring backend for its core demonstration.

The dashboard should be treated as an analysis view over recorded examples, not as an endpoint security agent.

## Privacy and security scope

The project is intended for synthetic or approved local event data. It does not claim to anonymize arbitrary security logs, and it should not be used as a reason to place production credentials or personal data into public fixtures.

There is no active scanning, exploitation or automated response behavior.

## Limitations

This repository is not a SIEM replacement. It does not provide durable event ingestion, cross-tenant isolation, long-term retention, production alert delivery, identity enrichment or incident-response automation.

A grouped event pattern is a review signal, not proof that an account or host is compromised.

## Possible next steps

Future work could include additional event categories, better time-range controls, exportable summaries and clearer rule explanations while keeping the project local-first.

## License

See [LICENSE](LICENSE).
