import { Module } from '@nestjs/common';
import { NbrbService } from './nbrb.service';

@Module({
  providers: [NbrbService],
  exports: [NbrbService],
})
export class NbrbModule {}
