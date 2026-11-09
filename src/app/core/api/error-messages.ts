import { ApiProblem, ProblemCode, ProblemFieldError } from './api-problem';

// Every code of the contract needs a message: a new code in ProblemCode.yaml is a compile error until
// it is added here (sc-3282). The server's `title` and `detail` are never shown.
export const errorMessages: Record<ProblemCode, string> = {
  validation: 'Sommige gegevens zijn niet geldig. Controleer je invoer en probeer opnieuw.',
  unauthenticated: 'Je moet ingelogd zijn om dit te doen.',
  forbidden: 'Je mag dit niet doen.',
  'not-found': 'We vonden niet wat je zocht.',
  'method-not-allowed': 'Deze actie is niet toegestaan.',
  conflict: 'Dit kan nu niet, omdat er intussen iets veranderd is. Probeer opnieuw.',
  'precondition-failed': 'Dit item is intussen gewijzigd. Laad de pagina opnieuw en probeer nog eens.',
  'payload-too-large': 'Het bestand of de gegevens zijn te groot.',
  'unsupported-media-type': 'Dit bestandstype wordt niet ondersteund.',
  unprocessable: 'Dit kan niet met de gegevens die je opgaf.',
  'rate-limited': 'Je doet dit te vaak. Wacht even en probeer opnieuw.',
  internal: 'Er ging iets mis aan onze kant. Probeer het later opnieuw.',
  'not-implemented': 'Deze functie is nog niet beschikbaar.',
  unavailable: 'De dienst is tijdelijk niet beschikbaar. Probeer het straks opnieuw.',
  'wish-fulfilled': 'Deze wens is vervuld en kan niet meer gewijzigd worden.',
  'wish-already-reserved': 'Iemand anders heeft deze wens al gereserveerd.',
  'wish-received': 'De wens is al overhandigd, dus de reservatie kan niet meer gewijzigd worden.',
  'date-in-future': 'Deze datum mag niet in de toekomst liggen.',
  'invalid-credentials': 'Onbekend e-mailadres of fout wachtwoord.',
  'reauthentication-required': 'Log opnieuw in om dit te bevestigen.',
  'email-taken': 'Er bestaat al een account met dit e-mailadres.',
  'password-too-weak': 'Het wachtwoord moet minstens 8 tekens lang zijn.',
  'password-too-long': 'Het wachtwoord is te lang.',
  'current-password-incorrect': 'Het huidige wachtwoord klopt niet.',
  'image-not-found': 'We vonden de afbeelding niet.',
  'image-url-invalid': 'Dit is geen geldig webadres voor een afbeelding.',
  'image-unreachable': 'De website met de afbeelding antwoordt niet.',
  'image-source-refused': 'De website weigert de afbeelding te delen.',
  'image-gone': 'De afbeelding bestaat niet meer op de website.',
  'image-too-large': 'De afbeelding is te groot.',
  'not-an-image': 'Dit is geen afbeelding van een ondersteund type.',
  'image-storage-unavailable': 'Afbeeldingen opslaan lukt nu niet. Probeer het straks opnieuw.',
  'image-search-unavailable': 'Afbeeldingen zoeken lukt nu niet. Probeer het straks opnieuw.'
};

// For a code this client does not know yet (clients must treat it as a generic error for the status).
const statusMessages: Record<number, string> = {
  400: errorMessages.validation,
  401: errorMessages.unauthenticated,
  403: errorMessages.forbidden,
  404: errorMessages['not-found'],
  409: errorMessages.conflict,
  412: errorMessages['precondition-failed'],
  413: errorMessages['payload-too-large'],
  415: errorMessages['unsupported-media-type'],
  422: errorMessages.unprocessable,
  429: errorMessages['rate-limited'],
  501: errorMessages['not-implemented'],
  503: errorMessages.unavailable
};

/** The message for the user. Unknown code: the generic message for the status. */
export function problemMessage(problem: ApiProblem): string {
  return errorMessages[problem.code]
    ?? statusMessages[problem.status]
    ?? (problem.status >= 500 ? errorMessages.internal : 'Er ging iets mis. Probeer het opnieuw.');
}

// Rules of `ProblemFieldError.code` (JSON Schema keywords).
const fieldMessages: Record<string, string> = {
  required: 'Dit veld is verplicht.',
  pattern: 'Dit veld heeft een ongeldige vorm.',
  format: 'Dit veld heeft een ongeldige vorm.',
  type: 'Dit veld heeft een ongeldige waarde.',
  enum: 'Kies een van de toegelaten waarden.',
  minLength: 'Deze waarde is te kort.',
  maxLength: 'Deze waarde is te lang.',
  minimum: 'Deze waarde is te klein.',
  maximum: 'Deze waarde is te groot.',
  additionalProperties: 'Dit veld is niet toegelaten.'
};

export function fieldMessage(error: ProblemFieldError): string {
  return fieldMessages[error.code] ?? 'Deze waarde is niet geldig.';
}
