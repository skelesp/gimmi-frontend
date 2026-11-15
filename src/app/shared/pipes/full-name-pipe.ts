import { Pipe, PipeTransform } from '@angular/core';
import { fullName } from 'src/app/features/people/person';

@Pipe({ name: 'fullName' })
export class FullNamePipe implements PipeTransform {
  transform(person: { firstName: string; lastName: string } | null | undefined): string {
    return person ? fullName(person) : '';
  }
}
