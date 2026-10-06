import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { ISSUE_PATH_SEPARATOR, VALIDATION_ERROR_MESSAGE } from '../constants/http';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: VALIDATION_ERROR_MESSAGE,
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join(ISSUE_PATH_SEPARATOR),
          message: issue.message,
        })),
      });
    }

    return result.data;
  }
}
