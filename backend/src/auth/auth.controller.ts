import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthCookiesService } from './auth-cookies.service';
import { AUTH_ROUTES } from './auth-routes.constants';
import { AUTH_THROTTLE } from './auth-throttle.constants';
import { AuthService } from './auth.service';
import type { AuthResponse, AuthResult, AuthUser } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { loginSchema, type LoginDto } from './dto/login.dto';
import { registerSchema, type RegisterDto } from './dto/register.dto';

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

    return this.respondWithTokens(result, response);
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

    return this.respondWithTokens(result, response);
  }

  @Public()
  @Post(AUTH_ROUTES.REFRESH)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.refresh(this.authCookiesService.getRefreshToken(request));

    return this.respondWithTokens(result, response);
  }

  @Public()
  @Post(AUTH_ROUTES.LOGOUT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(this.authCookiesService.getRefreshToken(request));
    this.authCookiesService.clearRefreshToken(response);
  }

  @Get(AUTH_ROUTES.ME)
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  private respondWithTokens(result: AuthResult, response: Response): AuthResponse {
    this.authCookiesService.setRefreshToken(response, result.refreshToken);

    return { user: result.user, accessToken: result.accessToken };
  }
}
