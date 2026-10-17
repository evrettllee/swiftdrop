import { Module } from '@nestjs/common';
import { OsrmModule } from '../../integrations/osrm/osrm.module';
import { ZonesModule } from '../zones/zones.module';
import { RoutePreviewController } from './controllers/route-preview.controller';
import { RouteLinesService } from './services/route-lines.service';
import { RoutePreviewService } from './services/route-preview.service';

// The lines of the routes on the maps. The routes of offers and orders are served by their own
// modules, which check whose they are, with RouteLinesService.
@Module({
  imports: [OsrmModule, ZonesModule],
  controllers: [RoutePreviewController],
  providers: [RouteLinesService, RoutePreviewService],
  exports: [RouteLinesService],
})
export class RoutingModule {}
