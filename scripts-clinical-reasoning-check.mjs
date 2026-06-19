import { deriveClinicalHypotheses, CLINICAL_REASONING_TEST_CASES } from './src/lib/clinicalReasoning.js';

let failures = 0;
for (const test of CLINICAL_REASONING_TEST_CASES) {
  const results = deriveClinicalHypotheses({ story: test.story });
  const ok = test.expected === null
    ? results.length === 0
    : results.some((item) => item.label === test.expected);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${test.name} | ${results.map((item) => item.label).join(' | ') || 'sem hipótese'}`);
  if (!ok) failures += 1;
}
if (failures) process.exit(1);
