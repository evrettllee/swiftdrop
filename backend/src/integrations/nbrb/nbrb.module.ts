import { Module } from '@nestjs/common';
import { NbrbService } from './services/nbrb.service';

@Module({
  providers: [NbrbService],
  exports: [NbrbService],
})
export class NbrbModule {}
