export const environment = {
  title: "Gimmi",
  production: true,
  apiUrl: 'https://api.gimmi.be/api/',
  rootSiteUrl: 'https://www.gimmi.be',
  // Alleen nog om wensen te tonen die niet naar R2 gemigreerd zijn (sc-3065); weg in sc-3070.
  // Afbeeldingen opladen en opslaan gebeurt via de backend in R2 (sc-2911).
  cloudinary: {
    // De cloud van de productie-backend (add-on van Heroku-app gimmi); test gebruikt hunk4smqo.
    cloud_name: 'hxibcyhbq'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
//import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

