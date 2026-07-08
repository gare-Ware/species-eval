import { expect, test } from '@playwright/test';

const QUESTION_COUNT = 6;
const OPTION_COUNT = 4;

function currentQuestion(page) {
  return page.locator('section[aria-labelledby^="question-"]');
}

async function expectQuestion(page, number) {
  await expect(currentQuestion(page)).toContainText(`Question ${number} of ${QUESTION_COUNT}`);
  await expect(currentQuestion(page).getByRole('heading')).toBeFocused();
}

async function beginQuiz(page) {
  await page.getByRole('button', { name: 'Begin the quiz' }).click();
  await expectQuestion(page, 1);
}

// Answer every question with its first option (a Grays path). Stops after the
// final click without asserting the reveal — each test drives that itself.
async function answerAll(page) {
  for (let question = 1; question <= QUESTION_COUNT; question += 1) {
    const answers = currentQuestion(page).getByRole('button');
    await expect(answers).toHaveCount(OPTION_COUNT);
    await answers.nth(0).click();
    if (question < QUESTION_COUNT) await expectQuestion(page, question + 1);
  }
}

// Reduced motion collapses the beat dwell to 0, so the reveal waits on the
// narrative fetch alone — the cleanest way to prove the block.
test.use({ reducedMotion: 'reduce' });

test('holds the reveal until the narrative arrives, then renders it', async ({ page }) => {
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/api/result', async (route) => {
    await held; // keep the request in flight
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ narrative: 'Held reading, shown only once it arrives.' }),
    });
  });

  await page.goto('/');
  await beginQuiz(page);
  await answerAll(page);

  // Request in flight and held: the result must not have revealed yet.
  await expect(page.getByText('Preparing your result')).toBeAttached();
  await expect(page.locator('#result-title')).toHaveCount(0);

  release();

  const result = page.locator('section[aria-labelledby="result-title"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('Held reading, shown only once it arrives');
});

test('shows the error state on failure and recovers on retry', async ({ page }) => {
  let attempt = 0;
  await page.route('**/api/result', async (route) => {
    attempt += 1;
    if (attempt === 1) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'boom' }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ narrative: 'Recovered reading after the retry.' }),
      });
    }
  });

  await page.goto('/');
  await beginQuiz(page);
  await answerAll(page);

  // First attempt failed → honest error state, no result reveal.
  await expect(page.getByRole('heading', { name: 'The signal broke up' })).toBeFocused();
  await expect(page.locator('#result-title')).toHaveCount(0);

  await page.getByRole('button', { name: 'Try again' }).click();

  // Retry re-enters the blocking beat; the second attempt succeeds.
  const result = page.locator('section[aria-labelledby="result-title"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('Recovered reading after the retry');
});
