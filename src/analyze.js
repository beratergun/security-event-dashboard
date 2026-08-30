const MAX_EVENTS = 100_000;
const MAX_LINE_LENGTH = 100_000;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function timestamp(value, lineNumber = null) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    const suffix = lineNumber === null ? '' : ' at line ' + lineNumber;
    throw new Error('invalid timestamp' + suffix);
  }
  return parsed;
}

export function parseJsonl(text) {
  if (typeof text !== 'string') {
    throw new TypeError('JSONL input must be a string');
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length > MAX_EVENTS) {
    throw new Error('too many events');
  }
  return lines.map((line, index) => {
    if (line.length > MAX_LINE_LENGTH) {
      throw new Error('event line too long at line ' + (index + 1));
    }
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      throw new Error('invalid JSON at line ' + (index + 1));
    }
    if (!isObject(event)) {
      throw new Error('invalid event at line ' + (index + 1));
    }
    timestamp(event.timestamp, index + 1);
    return event;
  });
}

export function analyze(events, { windowMs = 300_000, threshold = 4 } = {}) {
  if (!Array.isArray(events) || events.length > MAX_EVENTS) {
    throw new TypeError('events must be a bounded array');
  }
  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new Error('windowMs must be a positive finite number');
  }
  if (!Number.isInteger(threshold) || threshold < 1) {
    throw new Error('threshold must be a positive integer');
  }

  const bySeverity = {};
  const byType = {};
  const authByActor = new Map();
  for (const event of events) {
    if (!isObject(event)) {
      throw new TypeError('each event must be an object');
    }
    const eventTime = timestamp(event.timestamp);
    const severity = String(event.severity || 'unknown').toLowerCase();
    const type = String(event.type || 'unknown').toLowerCase();
    bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    byType[type] = (byType[type] || 0) + 1;
    if (type === 'auth_failure') {
      const actor = String(event.actor || 'unknown');
      const rows = authByActor.get(actor) || [];
      rows.push(eventTime);
      authByActor.set(actor, rows);
    }
  }

  const authBursts = [];
  for (const [actor, rows] of authByActor) {
    rows.sort((left, right) => left - right);
    let left = 0;
    let best = null;
    for (let right = 0; right < rows.length; right += 1) {
      while (rows[right] - rows[left] > windowMs) {
        left += 1;
      }
      const count = right - left + 1;
      if (
        count >= threshold
        && (
          best === null
          || count > best.count
          || (count === best.count && rows[left] < best.startTime)
        )
      ) {
        best = {
          actor,
          count,
          startTime: rows[left],
          endTime: rows[right],
        };
      }
    }
    if (best) {
      authBursts.push({
        actor: best.actor,
        count: best.count,
        start: new Date(best.startTime).toISOString(),
        end: new Date(best.endTime).toISOString(),
      });
    }
  }
  authBursts.sort((left, right) => left.actor.localeCompare(right.actor));
  return {
    total: events.length,
    bySeverity,
    byType,
    authBursts,
  };
}

export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character],
  );
}

export function renderDashboard(summary) {
  const cards = Object.entries(summary.bySeverity)
    .map(
      ([severity, count]) => (
        '<div class="card"><b>'
        + escapeHtml(severity)
        + '</b><span>'
        + count
        + '</span></div>'
      ),
    )
    .join('');
  const rows = summary.authBursts
    .map(
      (burst) => (
        '<tr><td>'
        + escapeHtml(burst.actor)
        + '</td><td>'
        + burst.count
        + '</td><td>'
        + escapeHtml(burst.start)
        + '</td><td>'
        + escapeHtml(burst.end)
        + '</td></tr>'
      ),
    )
    .join('');
  return '<!doctype html>'
    + '<html lang="en"><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width">'
    + '<title>Security Event Dashboard</title>'
    + '<style>body{font:16px system-ui;margin:32px;background:#0b1020;color:#edf2ff}'
    + '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}'
    + '.card{padding:16px;border:1px solid #334155;border-radius:12px}'
    + '.card span{display:block;font-size:2rem}table{width:100%;border-collapse:collapse}'
    + 'td,th{padding:8px;border-bottom:1px solid #334155;text-align:left}'
    + '@media(max-width:600px){body{margin:16px}.table-wrap{overflow:auto}}</style>'
    + '<body><h1>Security Event Dashboard</h1><p>'
    + summary.total
    + ' local events analyzed.</p><div class="grid">'
    + cards
    + '</div><h2>Authentication bursts</h2><div class="table-wrap"><table>'
    + '<tr><th>actor</th><th>count</th><th>start</th><th>end</th></tr>'
    + rows
    + '</table></div></body></html>';
}
