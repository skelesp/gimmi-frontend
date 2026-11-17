import { provideRouter } from '@angular/router';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink } from '@angular/router';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';

import { CursorPointer } from './cursor-pointer';

// sc-2038: a "pointer" on every clickable element: everything with (click), ngbDropdown or routerLink.
@Component({
    template: `
    <span id="klik" (click)="clicked = true">klik</span>
    <div id="dropdown" ngbDropdown>menu</div>
    <a id="link" routerLink="/home">link</a>
    <span id="gewoon">tekst</span>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, NgbDropdown, CursorPointer]
})
class TestHostComponent {
    clicked = false;
}

describe('CursorPointer', () => {
    let fixture: ComponentFixture<TestHostComponent>;

    function cursor(id: string): string {
        return (fixture.nativeElement.querySelector('#' + id) as HTMLElement).style.cursor;
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    imports: [TestHostComponent],
    providers: [provideRouter([])]
}).compileComponents();
        fixture = TestBed.createComponent(TestHostComponent);
        await fixture.whenStable();
    });

    it('element with (click): pointer', () => {
        expect(cursor('klik')).toBe('pointer');
    });

    it('element with ngbDropdown: pointer', () => {
        expect(cursor('dropdown')).toBe('pointer');
    });

    it('element with routerLink: pointer', () => {
        expect(cursor('link')).toBe('pointer');
    });

    it('plain element: no pointer', () => {
        expect(cursor('gewoon')).toBe('');
    });

    it('the (click) handler keeps working', () => {
        fixture.nativeElement.querySelector('#klik').click();
        expect(fixture.componentInstance.clicked).toBe(true);
    });
});
