export const environment = {
  title: "Gimmi",
  production: true,
  apiUrl: 'https://api.gimmi.be/api/',
  rootSiteUrl: 'https://www.gimmi.be',
  cloudinary: {
    cloud_name: 'hunk4smqo',
    uploadPreset: 'wish_images',
    apiKey: "645975382923815",
    defaultImage: {
      publicId: "wish_images/default",
      version: "1556702046"
    },
    temporaryImagePostfix: '_temp'
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

