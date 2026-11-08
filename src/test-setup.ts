import 'zone.js';
import { provideZoneChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

// De app draait met zone.js. De Vitest-builder laadt zone.js/testing met een top-level await en
// weigert dat in een build mét zone.js (sc-2914): de testbuild (configuratie "unit") heeft dus geen
// zone.js-polyfill, en dit bestand laadt zone.js zelf. Zo blijven de specs zone-gebaseerd, zoals onder Karma.
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideZoneChangeDetection()] });
});
