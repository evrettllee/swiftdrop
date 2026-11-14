import { Global, Module } from '@nestjs/common';
import { ServiceFailuresService } from './services/service-failures.service';

@Global()
@Module({
  providers: [ServiceFailuresService],
  exports: [ServiceFailuresService],
})
export class ServiceFailuresModule {}
