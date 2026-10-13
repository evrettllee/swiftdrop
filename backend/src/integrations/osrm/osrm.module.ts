import { Module } from '@nestjs/common';
import { OsrmService } from './services/osrm.service';

@Module({
  providers: [OsrmService],
  exports: [OsrmService],
})
export class OsrmModule {}
