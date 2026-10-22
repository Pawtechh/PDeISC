const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.expo',
  'build',
  'coverage',
  'test-results',
  'playwright-report'
]);

const SECRET_PATTERNS = [
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/g },
  { name: 'GitHub Token', regex: /(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/g },
  { name: 'GitHub Fine-Grained Token', regex: /github_pat_[A-Za-z0-9_]{82}/g },
  { name: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
  { name: 'OpenAI / Anthropic API Key', regex: /sk-[A-Za-z0-9-_]{32,}/g },
  { name: 'Stripe Secret Key', regex: /sk_(live|test)_[0-9a-zA-Z]{24,}/g },
  { name: 'MercadoPago Live Token', regex: /APP_USR-[0-9a-zA-Z_-]{20,}/g },
  { name: 'MercadoPago Access Token', regex: /TEST-[0-9]{16}-[0-9]{6}-[a-f0-9]{32}-[0-9]{9}/g },
  { name: 'Private Key', regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  { name: 'Database Connection String with Credentials', regex: /(?:mysql|postgresql|postgres|mongodb(?:\+srv)?):\/\/[a-zA-Z0-9_.-]+:[^@\s/]+@[a-zA-Z0-9_.-]+/g },
  { name: 'JWT Token (Hardcoded in source)', regex: /eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
  { name: 'Ngrok / Cloudflared / Tunnel Auth Token', regex: /(?:ngrok|authtoken|tunnel_token|CLOUDFLARE_TUNNEL_TOKEN)[=:\s]+["']?([a-zA-Z0-9_\-\.]{20,})["']?/gi }
];

const findings = [];

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return;
  }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'public' && dir.endsWith('backend')) {
        // scan backend/public except _expo
        walk(fullPath);
      } else if (entry.name === '_expo') {
        continue;
      } else {
        walk(fullPath);
      }
    } else if (entry.isFile()) {
      // Skip large binary / media files
      const ext = path.extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.webp', '.exe', '.db', '.sqlite'].includes(ext)) {
        continue;
      }
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return;
  }

  const relativePath = path.relative(process.cwd(), filePath);

  // Check each secret pattern
  for (const pattern of SECRET_PATTERNS) {
    const matches = content.match(pattern.regex);
    if (matches) {
      for (const match of matches) {
        // Filter out obvious placeholders or example docs
        if (
          match.includes('TEST-0000000000000000-000000-') ||
          match.includes('your-super-secret') ||
          match.includes('mock-') ||
          match.includes('surfpassword') && relativePath.includes('.example') ||
          relativePath.includes('scan_secrets.js')
        ) {
          continue;
        }

        // Get line number
        const lines = content.split('\n');
        let lineNo = 1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(match.slice(0, 20))) {
            lineNo = i + 1;
            break;
          }
        }

        findings.push({
          file: relativePath,
          line: lineNo,
          type: pattern.name,
          preview: match.length > 30 ? match.slice(0, 10) + '...' + match.slice(-6) : match
        });
      }
    }
  }
}

console.log('Starting repository secret scan...');
walk(process.cwd());
console.log(`Scan completed. Total potential secret matches found: ${findings.length}`);
console.log(JSON.stringify(findings, null, 2));
