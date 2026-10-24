# Browser smoke tests

Playwright tests that drive the **deployed** site in a phone (Pixel 7, touch) and
a desktop Chrome. CI runs them after every deploy (staging and prod); a failure
fails the run and uploads screenshots + traces as the `playwright-report` artifact.

```sh
cd e2e
npm ci
npx playwright install chromium
npm test                                   # against https://theoption.life/staging/
BASE_URL=https://theoption.life/ npm test  # against prod
npx playwright show-trace test-results/<test>/trace.zip   # inspect a failure
```

`mobile-*.spec.js` run on the phone, `desktop-*.spec.js` on desktop. They only
read: no logins, no writes to the database.
