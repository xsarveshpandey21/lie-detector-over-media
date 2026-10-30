const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  matchClaimAgainstRegistry,
  matchLocalFactChecks,
  isDebunkingText,
  normalizeText
} = require('../src/services/claimMatcher');

describe('Accurate Claim Matcher & False Positive Rejection', () => {
  // Required negative test cases (Must NOT match)
  const requiredNegatives = [
    'Health officials confirmed the covid virus vaccine is safe according to the WHO',
    'The sun will set in the west tonight and NASA said it will be a clear sky',
    'Doctors recommend drinking warm water to ease a cold',
    'Fake news: some people say the moon landing was staged, but Apollo evidence disproves it'
  ];

  // Required positive test cases (MUST match)
  const requiredPositives = [
    '5G towers spread covid virus radiation',
    'Apollo moon landing was faked in a Hollywood studio'
  ];

  it('correctly normalizes text and strips punctuation', () => {
    const raw = '  "Hello, World!" — 5G-Towers: spread (COVID)?!  ';
    const norm = normalizeText(raw);
    assert.strictEqual(norm, 'hello world 5g towers spread covid');
  });

  it('identifies debunking and negating expressions', () => {
    assert.strictEqual(isDebunkingText('This was thoroughly debunked by doctors'), true);
    assert.strictEqual(isDebunkingText('Evidence disproves the moon hoax claim'), true);
    assert.strictEqual(isDebunkingText('It is a total myth and false claim'), true);
    assert.strictEqual(isDebunkingText('यह दावा पूरी तरह से झूठा और अफवाह है'), true);
    assert.strictEqual(isDebunkingText('New peer-reviewed study confirms findings'), false);
  });

  for (const statement of requiredNegatives) {
    it(`must NOT match harmless/debunking statement: "${statement.slice(0, 50)}..."`, () => {
      const matches = matchClaimAgainstRegistry(statement);
      assert.strictEqual(matches.length, 0, `Expected 0 matches for: "${statement}"`);
    });
  }

  for (const statement of requiredPositives) {
    it(`MUST match verified rumor statement: "${statement}"`, () => {
      const matches = matchClaimAgainstRegistry(statement);
      assert.ok(matches.length >= 1, `Expected match for: "${statement}"`);
      assert.ok(matches[0].matchStrength >= 60);
      assert.strictEqual(matches[0].relation, 'similar_claim');
      assert.match(matches[0].similarityNote, /Similar claim previously fact-checked/i);
    });
  }

  it('runs 40+ comprehensive validation suite with <= 2% false-positive rate', () => {
    const harmlessDataset = [
      // Everyday news & science
      'NASA telescope pictures show beautiful galaxies and stars.',
      'Good morning! Wishing everyone a peaceful and blessed Monday.',
      'The local council announced new bus timetables starting next month.',
      'Water boils at 100 degrees Celsius under standard atmospheric pressure.',
      'ISRO launched a meteorological satellite into geostationary transfer orbit.',
      'Remember to drink eight glasses of water a day and exercise regularly.',
      'The grocery store has fresh apples and organic oranges on discount today.',
      'Please submit your homework assignment by Friday afternoon.',
      'The train from New Delhi to Mumbai was delayed by fifteen minutes.',
      'Scientists discovered a new species of deep sea jellyfish in the Pacific.',
      'NASA launched a rocket to test planetary defense systems.',
      'According to Reuters, global stock markets remained steady today.',
      'The library is hosting a reading event for children this Saturday.',
      'Eating fresh fruit and vegetables supports a healthy immune system.',
      'The Reserve Bank of India announced the repo rate will remain unchanged.',
      'Traffic was diverted due to road construction on the highway.',
      'Apollo 11 astronauts brought back lunar soil and rock samples for research.',
      'Public health notice: Wash your hands with soap for at least 20 seconds.',
      'A solar eclipse will occur next month across parts of North America.',
      'University researchers developed a new biodegradable plastic from cornstarch.',
      // Hindi harmless statements
      'आज सुबह का मौसम बहुत सुहावना और ठंडा है।',
      'सभी को दीपावली की हार्दिक शुभकामनाएं।',
      'कृपया अपनी परीक्षा की समय सारिणी डाउनलोड कर लें।',
      'डॉक्टरों का कहना है कि पर्याप्त नींद लेना स्वास्थ्य के लिए जरूरी है।',
      'विश्व स्वास्थ्य संगठन ने नई स्वास्थ्य एडवाइजरी जारी की।',
      // Debunking reports & fact-checks (must never trigger false match)
      'Fact check: The rumor that cell towers spread viruses was completely debunked by scientists.',
      'False claim: people claiming drinking lemon water cures cancer are spreading myths.',
      'अफवाहों पर ध्यान न दें: स्टार चिन्ह वाले सभी नोट असली और वैध हैं।',
      'The WHO stated that vaccines undergo rigorous safety and clinical testing.',
      'Chandrayaan-3 carried scientific payloads to study lunar thermophysical properties.',
      'It is untrue that 5G towers have anything to do with viral outbreaks.',
      'Debunked: Historical documentation disproves any claim that Apollo lunar missions were faked.',
      'Health ministry issues advisory against unverified WhatsApp forward medical advice.',
      'Busted: Drinking boiling water does not protect against respiratory virus infection.',
      'Independent scientists found no evidence that mobile network frequencies transmit pathogens.'
    ];

    const rumorDataset = [
      '5G towers spread covid virus radiation',
      '5G mobile networks spread covid virus radiation across cities',
      'Apollo moon landing was faked in a Hollywood studio',
      'The apollo moon landing was faked in a hollywood studio by actors',
      'Drinking hot lemon water cures cancer and kills all viral infections',
      'Hot lemon water cures cancer and kills all viral infections',
      '500 rupee note star symbol fake currency alert',
      'Beware: 500 rupee note star symbol fake currency circulating',
      'स्टार चिन्ह वाले 500 नोट नकली हैं बैंक नहीं ले रहे',
      'स्टार वाले 500 नोट नकली पाए गए'
    ];

    let falsePositives = 0;
    for (const text of harmlessDataset) {
      const matches = matchClaimAgainstRegistry(text);
      if (matches.length > 0) {
        falsePositives++;
        console.error(`False positive on: "${text}" -> matched ${matches[0].reference.title}`);
      }
    }

    const falsePositiveRate = falsePositives / harmlessDataset.length;
    console.log(`Evaluated ${harmlessDataset.length} harmless statements: ${falsePositives} false positives (${(falsePositiveRate * 100).toFixed(2)}%)`);
    assert.ok(
      falsePositiveRate <= 0.02,
      `False positive rate (${(falsePositiveRate * 100).toFixed(2)}%) exceeded 2% limit!`
    );

    // Verify rumors match correctly
    let rumorMatches = 0;
    for (const text of rumorDataset) {
      const matches = matchClaimAgainstRegistry(text);
      if (matches.length > 0) rumorMatches++;
    }
    assert.strictEqual(rumorMatches, rumorDataset.length, 'All documented rumor variants must match');
  });
});
