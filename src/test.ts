// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { provideZoneChangeDetection } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
}
);

// Sinds Angular 21 draait TestBed standaard zonder zone.js; de app (main.ts) draait er wel mee.
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideZoneChangeDetection()] });
});
