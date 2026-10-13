import { Module } from '@nestjs/common';
import { ZonesService } from './services/zones.service';

@Module({
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
