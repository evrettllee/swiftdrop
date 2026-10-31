import { Injectable } from '@nestjs/common';
import { MANAGER_EXPORT_ROW_LIMIT } from '../constants/manager-export.constants';

@Injectable()
export class ManagerExportLimits {
  readonly rowLimit: number = MANAGER_EXPORT_ROW_LIMIT;
}
