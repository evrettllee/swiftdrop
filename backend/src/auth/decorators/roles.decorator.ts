import { SetMetadata } from '@nestjs/common';
import type { RoleName } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../constants/access.constants';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
