"""Build the offline gallery from the existing standalone AirJelly renderer.

Usage: python3 scripts/jellyfish-grid/build.py [--lab PATH] [--engine PATH]
The existing lab and website are read only. No dependencies are downloaded.
"""
import argparse
import base64
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--lab', type=Path, default=Path.home() / 'Desktop/jellyfish-lab.html')
parser.add_argument('--engine', type=Path, default=Path.home() / 'AirJelly-Website/app/wanderer/engine.js')
parser.add_argument('--output', type=Path, default=HERE.parents[1] / 'jellyfish-grid.html')
args = parser.parse_args()
lab = args.lab.read_text()
source = args.engine.read_text()
# Keep every named Office character, including Warm coral's owner, 小华.
companions = json.loads(re.search(r'const COMPANION_JELLIES = (\[.*?\]);', source).group(1))
lab, count = re.subn(r'const COMPANION_JELLIES = \[.*?\];', 'const COMPANION_JELLIES = ' + json.dumps(companions, ensure_ascii=False) + ';', lab, count=1)
assert count == 1, 'Companion declaration changed; inspect the source before rebuilding.'
# Isolate the embedded runtime from the user's original lab settings.
lab = lab.replace('localStorage', 'gridVolatileStorage')
lab = lab.replace('<script>', '''<script>
const gridVolatileStorage = (() => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
})();
''', 1)
lab = re.sub(r'<link\b[^>]*>', '', lab)
lab = lab.replace('    syncPublishedChangelogCopy();', '')
anchor = '    engineRuntime.rafId = requestAnimationFrame(step);\n    return engineRuntime;'
assert lab.count(anchor) == 1, 'Runtime mount changed; inspect before rebuilding.'
lab = lab.replace(anchor, (HERE / 'runtime.js').read_text() + '\n' + anchor)
encoded = base64.b64encode(lab.encode()).decode()
shell = (HERE / 'shell.html').read_text()
assert shell.count('__ENGINE_BASE64__') == 1
args.output.write_text(shell.replace('__ENGINE_BASE64__', encoded))
print(f'{args.output}: {len(companions) + 1} presets, {args.output.stat().st_size:,} bytes')
