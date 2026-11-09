import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';

import { CursorPointerDirective } from './cursor-pointer.directive';

// sc-2038: een "pointer" op elk klikbaar element: alles met (click), ngbDropdown of routerLink.
@Component({
    template: `
    <span id="klik" (click)="geklikt = true">klik</span>
    <div id="dropdown" ngbDropdown>menu</div>
    <a id="link" routerLink="/home">link</a>
    <span id="gewoon">tekst</span>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, NgbDropdown, CursorPointerDirective]
})
class TestHostComponent {
    geklikt = false;
}

describe('CursorPointerDirective', () => {
    let fixture: ComponentFixture<TestHostComponent>;

    function cursor(id: string): string {
        return (fixture.nativeElement.querySelector('#' + id) as HTMLElement).style.cursor;
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    imports: [RouterTestingModule, TestHostComponent]
}).compileComponents();
        fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
    });

    it('element met (click): pointer', () => {
        expect(cursor('klik')).toBe('pointer');
    });

    it('element met ngbDropdown: pointer', () => {
        expect(cursor('dropdown')).toBe('pointer');
    });

    it('element met routerLink: pointer', () => {
        expect(cursor('link')).toBe('pointer');
    });

    it('gewoon element: geen pointer', () => {
        expect(cursor('gewoon')).toBe('');
    });

    it('de (click)-handler blijft gewoon werken', () => {
        fixture.nativeElement.querySelector('#klik').click();
        expect(fixture.componentInstance.geklikt).toBe(true);
    });
});
