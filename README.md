# Security Event Dashboard

Security Event Dashboard is a local JSONL event summarizer with a self-contained HTML
dashboard and actor-specific, time-windowed authentication-failure detection.

## Problem

Recorded security events are difficult to review when severity totals, event types, and
short authentication-failure bursts must be counted manually.

## Why this project exists

The project demonstrates a deterministic local analysis pipeline that groups recorded
events without live ingestion, credentials, telemetry, or remote services.

## Features

- Bounded local JSONL parsing
- Timestamp validation for every event
- Severity and type aggregation
- Actor-specific authentication-failure detection inside a configurable time window
- Escaped, responsive, self-contained HTML dashboard
- No live ingestion, browser framework, telemetry, or network API

## Project structure

- 'src/analyze.js': parsing, validation, aggregation, burst detection, and HTML rendering
- 'src/cli.js': local file CLI
- 'examples/events.jsonl': synthetic recorded-event fixture
- 'tests/analyze.test.js': deterministic parser, window, actor, and escaping tests
- '.github/workflows/tests.yml': clean-checkout Node test job

## Setup

Node.js 22 is used in CI. There are no third-party runtime dependencies.

## Usage

~~~bash
npm run demo
~~~

The command reads 'examples/events.jsonl' and writes the ignored generated file
'dashboard.html'. Open that file locally.

## Tests

~~~bash
npm test
~~~

Tests cover JSONL parsing, aggregation, inclusive time-window boundaries, events outside
the window, actor separation, malformed JSON/timestamps, option validation, and HTML
escaping.

## Engineering decisions

- Recorded events keep the project reproducible and credential-free.
- Authentication failures are sorted and evaluated with an actual millisecond window.
- The densest qualifying window is reported once per actor with deterministic ordering.
- All dynamic strings rendered into HTML are escaped.

## Limitations

- This is not a SIEM and has no live event ingestion.
- The schema is intentionally small.
- Correlation is limited to authentication-failure windows.
- The dashboard has aggregate cards and a burst table rather than a charting framework.

## Possible improvements

- Add versioned schema profiles.
- Add streaming JSONL input.
- Add richer local time-series visualization.
- Add explicit timezone grouping policies.

## Security and privacy

The CLI reads only the caller-provided local file. It includes no network client or
telemetry. HTML output escapes dynamic text, but generated dashboards can still contain
actor identifiers and should be handled as potentially sensitive artifacts.

## License

Licensed under the MIT License. See 'LICENSE'.
