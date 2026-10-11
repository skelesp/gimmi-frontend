// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, './coverage/gimmi'),
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true,
      // Ondergrens (sc-2979). Alleen verhogen, nooit verlagen. Telt alle bronbestanden in src/app
      // (src/test.ts laadt ze ook zonder spec). Nulmeting over de hele app, 11-10-2026: 28/16/13/22
      // (statements/branches/functions/lines).
      thresholds: {
        emitWarning: false,
        global: { statements: 63, branches: 60, functions: 55, lines: 60 }
      }
    },
    // 'coverage-istanbul' staat er expliciet in: anders voegt de CLI bij --code-coverage
    // 'coverage' toe (karma-coverage), en die plugin gebruiken we niet.
    reporters: ['progress', 'kjhtml', 'coverage-istanbul'],
    port: 9876,
    // Vast op IPv4: met Node 22 luistert "localhost" op ::1, terwijl Chrome naar 127.0.0.1 gaat
    // en dan nooit verbindt ("has not captured in 60000 ms").
    listenAddress: '127.0.0.1',
    hostname: '127.0.0.1',
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    // CI: npm run test:ci (headless, zonder sandbox op de GitHub-runner)
    customLaunchers: {
      ChromeHeadlessCI: { base: 'ChromeHeadless', flags: ['--no-sandbox'] }
    },
    singleRun: false,
    restartOnFileChange: true
  });
};
