import { Module } from '@nestjs/common';
import { OsrmClient } from './services/osrm-client.service';
import { OsrmGeometryService } from './services/osrm-geometry.service';
import { OsrmService } from './services/osrm.service';

@Module({
  providers: [OsrmClient, OsrmService, OsrmGeometryService],
  exports: [OsrmService, OsrmGeometryService],
})
export class OsrmModule {}
