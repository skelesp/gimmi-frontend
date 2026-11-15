export const environment = {
  title: "[TEST] Gimmi",
  production: true,
  // Railway test environment (service gimmi-backend-test, branch develop) under its own address.
  apiV2Url: 'https://api-test.gimmi.be/api/v2/',
  rootSiteUrl: 'https://test.gimmi.be',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// Deliberately off: this is a shared test environment, not a local development setup.
// The warning above applies here just as much as in production.
//import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

