import { Module } from '@nestjs/common';
import { OsrmClient } from './services/osrm-client.service';
import { OsrmGeometryService } from './services/osrm-geometry.service';
import { OsrmTripService } from './services/osrm-trip.service';
import { OsrmService } from './services/osrm.service';

@Module({
  providers: [OsrmClient, OsrmService, OsrmGeometryService, OsrmTripService],
  exports: [OsrmService, OsrmGeometryService, OsrmTripService],
})
export class OsrmModule {}
