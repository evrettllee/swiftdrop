import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthCookiesService } from './auth-cookies.service';
import { AUTH_THROTTLE } from './constants/access';
import { OAUTH_SUCCESS_REDIRECT } from './constants/oauth';
import { AUTH_ROUTES } from './constants/routes';
import { AuthService } from './auth.service';
import type { AuthResponse, AuthResult, AuthUser, OAuthRequest } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { loginSchema, type LoginDto } from './dto/login.dto';
import { registerSchema, type RegisterDto } from './dto/register.dto';
import { OAuthFailureFilter } from './filters/oauth-failure.filter';
import {
  GoogleAuthGuard,
  GoogleCallbackGuard,
  YandexAuthGuard,
  YandexCallbackGuard,
} from './guards/oauth.guards';

@Controller(AUTH_ROUTES.BASE)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookiesService: AuthCookiesService,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post(AUTH_ROUTES.REGISTER)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(dto);

    return this.respondWithSession(result, response);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post(AUTH_ROUTES.LOGIN)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(dto);

    return this.respondWithSession(result, response);
  }

  @Public()
  @Post(AUTH_ROUTES.REFRESH)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.refresh(this.authCookiesService.getRefreshToken(request));

    return this.respondWithSession(result, response);
  }

  @Public()
  @Post(AUTH_ROUTES.LOGOUT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(this.authCookiesService.getRefreshToken(request));
    this.authCookiesService.clearSession(response);
  }

  @Get(AUTH_ROUTES.ME)
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @UseGuards(GoogleAuthGuard)
  @Get(AUTH_ROUTES.GOOGLE)
  googleLogin(): void {
    // The guard redirects to Google before this handler runs.
  }

  // Callbacks are not throttled separately: they need a one-time provider code and a matching state cookie.
  @Public()
  @UseGuards(GoogleCallbackGuard)
  @UseFilters(OAuthFailureFilter)
  @Get(AUTH_ROUTES.GOOGLE_CALLBACK)
  async googleCallback(@Req() request: OAuthRequest, @Res() response: Response): Promise<void> {
    await this.completeOAuthLogin(request, response);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @UseGuards(YandexAuthGuard)
  @Get(AUTH_ROUTES.YANDEX)
  yandexLogin(): void {
    // The guard redirects to Yandex before this handler runs.
  }

  @Public()
  @UseGuards(YandexCallbackGuard)
  @UseFilters(OAuthFailureFilter)
  @Get(AUTH_ROUTES.YANDEX_CALLBACK)
  async yandexCallback(@Req() request: OAuthRequest, @Res() response: Response): Promise<void> {
    await this.completeOAuthLogin(request, response);
  }

  private async completeOAuthLogin(request: OAuthRequest, response: Response): Promise<void> {
    const result = await this.authService.loginWithOAuth(request.user);

    this.authCookiesService.setSession(response, result);
    response.redirect(OAUTH_SUCCESS_REDIRECT);
  }

  private respondWithSession(result: AuthResult, response: Response): AuthResponse {
    this.authCookiesService.setSession(response, result);

    return { user: result.user };
  }
}
