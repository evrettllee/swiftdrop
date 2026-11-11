import { Module } from '@nestjs/common';
import { NbrbClient } from './services/nbrb-client.service';
import { NbrbService } from './services/nbrb.service';
import { SavedRateService } from './services/saved-rate.service';

@Module({
  providers: [NbrbClient, SavedRateService, NbrbService],
  exports: [NbrbService],
})
export class NbrbModule {}
