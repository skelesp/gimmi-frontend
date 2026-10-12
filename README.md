# Gimmi

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.10.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `npm run e2e` to execute the smoke tests ([Playwright](https://playwright.dev/), `e2e/`). Once per machine: `npx playwright install chromium`.

`e2e/kernflows.spec.ts` covers the six core flows (register, log in, create a wish, reserve, give feedback, share); `e2e/wensbeheer.spec.ts` covers searching people, cancelling a reservation, copying a wish to your own list, deleting a wish, logging out, the forgotten-password request, page title and footer. Calls to `/api/email` (and the password-reset request) are intercepted, so no real mail is sent: the smoke addresses @gimmi.be end up in a real mailbox via the Cloudflare catch-all. The tests run against the shared test environment (`https://gimmi-test.pages.dev` with the `test-gimmi` API). Every run registers new users with a unique e-mail address and removes them (and their wishes) afterwards through the API (`DELETE /api/people/:id`). If a run was aborted, `npm run e2e:cleanup` removes the leftovers; it only touches accounts named Smoke Eigenaar/Gever/Opruimer with an e-mail address `smoke+<role>-<run>@gimmi.be`. To test another environment: `E2E_BASE_URL=http://localhost:4200 npm run e2e`. Set `E2E_API_URL` too when the environment uses another API than `test-gimmi` (production: `E2E_BASE_URL=https://www.gimmi.be E2E_API_URL=https://api.gimmi.be/api/ npm run e2e`); without it the clean-up calls the test API and leaves the accounts behind. The report is written to `playwright-report/`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
