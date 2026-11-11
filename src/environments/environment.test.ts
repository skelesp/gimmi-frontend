export const environment = {
  title: "[TEST] Gimmi",
  production: true,
  // Railway-testomgeving (service gimmi-backend-test, branch develop) onder een eigen adres.
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
// Bewust uit: dit is een gedeelde testomgeving, geen lokale ontwikkelopstelling.
// De waarschuwing hierboven geldt hier dus net zo goed als in productie.
//import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

