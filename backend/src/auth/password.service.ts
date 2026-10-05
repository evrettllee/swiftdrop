import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { TIMING_DUMMY_PASSWORD } from './auth.constants';

@Injectable()
export class PasswordService {
  private readonly dummyHash: Promise<string> = hash(TIMING_DUMMY_PASSWORD);

  async hash(password: string): Promise<string> {
    return hash(password);
  }

  async verify(passwordHash: string | null, password: string): Promise<boolean> {
    const hashToCheck = passwordHash ?? (await this.dummyHash);
    const isValid = await verify(hashToCheck, password);

    return passwordHash !== null && isValid;
  }
}
