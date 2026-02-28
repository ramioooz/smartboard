import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * A NestJS pipe that validates incoming data against a Zod schema.
 *
 * Usage — attach to any @Body(), @Query(), or @Param() decorator:
 *
 *   @Post()
 *   async create(
 *     @Body(new ZodValidationPipe(CreateTenantSchema)) body: CreateTenant,
 *   ) { ... }
 *
 * On validation failure throws BadRequestException with Zod field errors.
 * On success returns the parsed (and coerced/defaulted) data.
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }
    return result.data;
  }
}
