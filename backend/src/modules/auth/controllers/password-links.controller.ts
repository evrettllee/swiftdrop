import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AUTH_THROTTLE } from '../constants/access.constants';
import {
  PASSWORD_LINK_INVALID_MESSAGE,
  PASSWORD_LINK_TOKEN_PARAM,
} from '../constants/password-links.constants';
import { AUTH_ROUTES } from '../constants/routes.constants';
import { Public } from '../decorators/public.decorator';
import { setPasswordSchema, type SetPasswordDto } from '../dto/set-password.dto';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { AuthService } from '../services/auth.service';
import { PasswordLinksService } from '../services/password-links.service';
import type { AuthUser } from '../types/auth.types';
import type { PasswordLinkInfo } from '../types/password-links.types';

@Controller(AUTH_ROUTES.BASE)
export class PasswordLinksController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookiesService: AuthCookiesService,
    private readonly passwordLinks: PasswordLinksService,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Get(AUTH_ROUTES.PASSWORD_LINK)
  async find(@Param(PASSWORD_LINK_TOKEN_PARAM) token: string): Promise<PasswordLinkInfo> {
    const link = await this.passwordLinks.findActive(token);

    if (!link) {
      throw new NotFoundException(PASSWORD_LINK_INVALID_MESSAGE);
    }

    return link;
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post(AUTH_ROUTES.PASSWORD_LINK)
  @HttpCode(HttpStatus.OK)
  async setPassword(
    @Param(PASSWORD_LINK_TOKEN_PARAM) token: string,
    @Body(new ZodValidationPipe(setPasswordSchema)) dto: SetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUser> {
    const result = await this.authService.setPasswordByLink(token, dto.password);

    this.authCookiesService.setSession(response, result);

    return result.user;
  }
}
