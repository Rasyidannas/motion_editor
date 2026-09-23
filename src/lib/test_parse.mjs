import * as cheerio from 'cheerio';

const splitTopLevel = (str, delim) => {
    const parts = [];
    let depth = 0;
    let start = 0;
    let inStr = null;
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        const prev = i > 0 ? str[i - 1] : '';
        if (inStr) {
            if (ch === inStr && prev !== '\\') inStr = null;
            continue;
        }
        if (ch === "'" || ch === '"') { inStr = ch; continue; }
        if (ch === '{' || ch === '[') { depth++; continue; }
        if (ch === '}' || ch === ']') { depth--; continue; }
        if (depth === 0 && ch === delim) {
            parts.push(str.slice(start, i));
            start = i + 1;
        }
    }
    parts.push(str.slice(start));
    return parts;
};

const parseRawObject = (raw) => {
    const obj = {};
    const inner = raw.replace(/^\s*\{\s*/, '').replace(/\s*\}\s*$/, '').trim();
    if (!inner) return obj;
    const pairs = splitTopLevel(inner, ',');
    for (const pair of pairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx === -1) continue;
        const key = pair.slice(0, colonIdx).trim().replace(/^['"]|['"]$/g, '');
        const valStr = pair.slice(colonIdx + 1);
        obj[key] = valStr.trim();
    }
    return obj;
};

const parseAnimeCalls = (body) => {
    const results = [];
    const animateRe = /animate\s*\(\s*([\s\S]*?)\s*,\s*\{([\s\S]*?)\}\s*\)/g;
    let m;
    while ((m = animateRe.exec(body)) !== null) {
        const targetsRaw = m[1].trim();
        const paramsRaw = m[2];
        console.log('MATCH targetsRaw:', JSON.stringify(targetsRaw));
        console.log('MATCH paramsRaw:', JSON.stringify(paramsRaw));
        const typeValue = parseRawObject(`{${paramsRaw}}`);
        console.log('MATCH typeValue keys:', Object.keys(typeValue));
        if (targetsRaw) {
            typeValue.targets = targetsRaw;
        }
        results.push({ type: 'animate', typeValue });
    }
    return results;
};

const src = `<div class="medium row">
  <div class="square"  style="width: 20px;height: 20px;background: black;"></div>
  <span class="padded label">JS / WAAPI</span>
</div>
<div class="medium row">
  <div class="square"  style="width: 20px;height: 20px;background: black;"></div>
  <span class="padded label">WAAPI</span>
</div>

<script>
animate('.square', {
  x: '15rem', // TranslateX shorthand
  scale: 1.25,
  skew: -45,
  rotate: '1turn',
});

// the WAAPI version is recommanded if you want to animate the transform property directly
waapi.animate('.square', {
  transform: 'translateX(15rem) scale(1.25) skew(-45deg) rotate(1turn)',
});
<\/script>`;

const $ = cheerio.load(`<body>${src}</body>`);

const elements = [];
const scripts = [];

const collectScript = (el) => {
    const body = $(el).html() ?? '';
    console.log('\nSCRIPT BODY:', JSON.stringify(body));
    if (!body.trim()) return;
    for (const call of parseAnimeCalls(body)) {
        scripts.push({ source: body, ...call });
    }
};

$('body').children().each((_, el) => {
    if (el.type !== 'tag' && el.type !== 'script') return;
    const tag = (el.tagName || '').toLowerCase();
    console.log('\nCHILD:', tag, 'type:', el.type);
    if (tag === 'script') {
        collectScript(el);
        return;
    }
    elements.push({ tag, id: $(el).attr('data-element-id') });
});

console.log('\n\n--- RESULTS ---');
console.log('elements count:', elements.length);
console.log('scripts count:', scripts.length);
console.log('\nScript typeValues:');
for (const s of scripts) {
    console.log('  typeValue:', JSON.stringify(s.typeValue, null, 4));
}
