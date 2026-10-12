import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { NotificationService } from 'src/app/shared/services/notification.service';
import { environment } from 'src/environments/environment';
import { CloudinaryService } from '../../services/cloudinary.service';
import { ImageUploadComponent } from './image-upload.component';

// De Cloudinary upload-widget (sc-1999, sc-2358). De widget zelf is een extern script; hier
// wordt nagebootst wat het teruggeeft, zodat vastligt hoe de app hem opzet en zijn
// resultaat verwerkt.
describe('ImageUploadComponent', () => {
  let fixture: ComponentFixture<ImageUploadComponent>;
  let component: ImageUploadComponent;
  let cloudinary: jasmine.SpyObj<CloudinaryService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let widget: jasmine.SpyObj<{ open: () => void; close: (o: any) => void }>;
  let config: any;
  let terugroep: (error: any, result: any) => void;

  function maak(opties: { publicId?: string; prefix?: string } = {}) {
    fixture = TestBed.createComponent(ImageUploadComponent);
    component = fixture.componentInstance;
    if (opties.publicId) component.publicId = opties.publicId;
    if (opties.prefix) component.tempPublicId_prefix = opties.prefix;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    widget = jasmine.createSpyObj('widget', ['open', 'close']);
    cloudinary = jasmine.createSpyObj<CloudinaryService>('CloudinaryService', ['createUploadWidget', 'generateRandomPublicId', 'getSignature']);
    cloudinary.generateRandomPublicId.and.returnValue('ria-4242_temp');
    cloudinary.createUploadWidget.and.callFake((data, cb) => { config = data; terugroep = cb; return of(widget); });
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['showNotification']);
    await TestBed.configureTestingModule({
      declarations: [ImageUploadComponent],
      providers: [
        { provide: CloudinaryService, useValue: cloudinary },
        { provide: NotificationService, useValue: notifications }
      ]
    }).compileComponents();
  });

  it('zet de widget op: Nederlands, één afbeelding, bronnen lokaal, zoeken en url', () => {
    maak();
    expect(config.language).toBe('nl');
    expect(config.multiple).toBeFalse();
    expect(config.resourceType).toBe('image');
    expect(config.sources).toEqual(['local', 'image_search', 'url']);
    expect(config.defaultSource).toBe('image_search');
    expect(config.cloud_name).toBe(environment.cloudinary.cloud_name);
    expect(config.uploadPreset).toBe(environment.cloudinary.uploadPreset);
    expect(config.googleApiKey).toBe(environment.googleApi.googleApiKey);
    expect(config.secure).toBeTrue();
  });

  it('ondertekent uploads via de API (getSignature van de service)', () => {
    maak();
    const callback = jasmine.createSpy();
    config.uploadSignature(callback, { timestamp: 1 });
    expect(cloudinary.getSignature).toHaveBeenCalledWith(callback, { timestamp: 1 });
    expect(cloudinary.getSignature.calls.mostRecent().object).toBe(cloudinary);
  });

  it('zonder publicId: tijdelijke naam met prefix en de _temp-postfix', () => {
    maak({ prefix: 'ria' });
    expect(cloudinary.generateRandomPublicId).toHaveBeenCalledWith('ria', environment.cloudinary.temporaryImagePostfix);
    expect(config.publicId).toBe('ria-4242_temp');
  });

  it('met publicId: die naam, geen tijdelijke', () => {
    maak({ publicId: 'wish_images/w1' });
    expect(config.publicId).toBe('wish_images/w1');
    expect(cloudinary.generateRandomPublicId).not.toHaveBeenCalled();
  });

  it('de knop "Kies afbeelding" opent de widget', () => {
    maak();
    const knop: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(knop.textContent).toContain('Kies afbeelding');
    knop.click();
    expect(widget.open).toHaveBeenCalled();
  });

  it('geslaagde upload: geeft publicId en versie door en sluit de widget stil', () => {
    maak();
    const opgeladen = jasmine.createSpy('imageUploaded');
    component.imageUploaded.subscribe(opgeladen);
    terugroep(null, { event: 'success', info: { public_id: 'ria-4242_temp', version: 1700000000 } });
    expect(opgeladen).toHaveBeenCalledWith({ publicId: 'ria-4242_temp', version: 1700000000 });
    expect(widget.close).toHaveBeenCalledWith({ quiet: true });
  });

  it('andere gebeurtenissen van de widget (openen, wachtrij, ...): niets', () => {
    maak();
    const opgeladen = jasmine.createSpy('imageUploaded');
    component.imageUploaded.subscribe(opgeladen);
    terugroep(null, { event: 'queues-start', info: {} });
    terugroep(null, null);
    expect(opgeladen).not.toHaveBeenCalled();
    expect(widget.close).not.toHaveBeenCalled();
  });

  it('fout: widget dicht, melding voor de gebruiker, geen afbeelding doorgegeven', () => {
    spyOn(console, 'error');
    maak();
    const opgeladen = jasmine.createSpy('imageUploaded');
    component.imageUploaded.subscribe(opgeladen);
    terugroep({ status: 'Upload mislukt' }, null);
    expect(widget.close).toHaveBeenCalledWith({ quiet: true });
    expect(notifications.showNotification).toHaveBeenCalledWith(
      'De afbeelding kon niet opgeladen worden, probeer het opnieuw.', 'error', 'Afbeelding niet opgeladen');
    expect(opgeladen).not.toHaveBeenCalled();
  });
});
