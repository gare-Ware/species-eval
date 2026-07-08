import { expect, test } from '@playwright/test';

const QUESTION_COUNT = 6;
const OPTION_COUNT = 4;

// Four options serve five species, so a species' best option moves around per
// question (its sit-out question offers it only a secondary). Each path below
// is the species' best-option-per-question run — the same "strongest possible
// run" integrity.test.ts proves must win.
const SPECIES_CASES = [
  { name: 'Grays', path: [0, 0, 2, 0, 0, 0] },
  { name: 'Nordics', path: [1, 1, 0, 1, 1, 3] },
  { name: 'Reptilians', path: [2, 2, 1, 2, 1, 1] },
  { name: 'Mantids', path: [3, 0, 2, 2, 2, 2] },
  { name: 'Hybrids', path: [1, 3, 3, 3, 3, 3] },
];

function currentQuestion(page) {
  return page.locator('section[aria-labelledby^="question-"]');
}

function currentAnswers(page) {
  return currentQuestion(page).getByRole('button');
}

async function expectQuestion(page, number) {
  await expect(currentQuestion(page)).toContainText(`Question ${number} of ${QUESTION_COUNT}`);
  await expect(currentQuestion(page).getByRole('heading')).toBeFocused();
}

async function beginQuiz(page) {
  await page.getByRole('button', { name: 'Begin the quiz' }).click();
  await expectQuestion(page, 1);
}

async function answerCurrentQuestion(page, optionIndex) {
  const answers = currentAnswers(page);
  await expect(answers).toHaveCount(OPTION_COUNT);
  await answers.nth(optionIndex).click();
  return answers;
}

async function playSpeciesPath(page, speciesCase) {
  for (let question = 1; question <= QUESTION_COUNT; question += 1) {
    await answerCurrentQuestion(page, speciesCase.path[question - 1]);

    if (question < QUESTION_COUNT) {
      await expectQuestion(page, question + 1);
    } else {
      await expect(page.getByRole('heading', { level: 1, name: speciesCase.name })).toBeFocused();
    }
  }
}

test('completes the quiz, locks answers during confirmation, and retakes cleanly', async ({ page }) => {
  const speciesCase = SPECIES_CASES[0];

  await page.goto('/');
  await beginQuiz(page);

  const answers = await answerCurrentQuestion(page, speciesCase.path[0]);
  await expect(answers.nth(speciesCase.path[0])).toBeDisabled();
  await expect(answers.nth(1)).toBeDisabled();
  await expectQuestion(page, 2);

  for (let question = 2; question <= QUESTION_COUNT; question += 1) {
    await answerCurrentQuestion(page, speciesCase.path[question - 1]);

    if (question < QUESTION_COUNT) {
      await expectQuestion(page, question + 1);
    } else {
      await expect(page.getByRole('heading', { level: 1, name: speciesCase.name })).toBeFocused();
    }
  }

  await expect(page.locator('section[aria-labelledby="result-title"]').getByText('Species match')).toBeVisible();
  await expect(page.getByText(`Result: Species match, ${speciesCase.name}`)).toBeAttached();

  await page.getByRole('button', { name: 'Take it again' }).click();
  await expect(page.getByRole('button', { name: 'Begin the quiz' })).toBeEnabled();
  await expect(page.getByText('Tap to begin')).toBeVisible();
});

test('reduced-motion users can complete the flow', async ({ page }) => {
  const speciesCase = SPECIES_CASES[1];

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await beginQuiz(page);
  await playSpeciesPath(page, speciesCase);
});

test('mobile result layouts stay within the viewport for every active species', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const speciesCase of SPECIES_CASES) {
    await page.goto('/');
    await beginQuiz(page);
    await playSpeciesPath(page, speciesCase);

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(overflow.body).toBeLessThanOrEqual(overflow.viewport);
    expect(overflow.document).toBeLessThanOrEqual(overflow.viewport);

    const titleBox = await page.locator('#result-title').boundingBox();
    expect(titleBox).not.toBeNull();
    if (!titleBox) return;
    expect(titleBox.x).toBeGreaterThanOrEqual(0);
    expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(overflow.viewport);
  }
});
