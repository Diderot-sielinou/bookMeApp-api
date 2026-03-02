/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { UserRole } from '../constants';

// ==========================================
// @CurrentUser Decorator
// Get the current authenticated user from request
// ==========================================
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  }
);

// ==========================================
// @Roles Decorator
// Define required roles for a route
// ==========================================
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// ==========================================
// @Public Decorator
// Mark a route as publicly accessible (no auth required)
// ==========================================
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ==========================================
// @ApiPaginatedResponse Decorator
// For Swagger documentation of paginated responses
// ==========================================
import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
// import { PaginatedResult } from '../interfaces';

export const ApiPaginatedResponse = <TModel extends Type<unknown>>(model: TModel) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 1 },
                  perPage: { type: 'number', example: 20 },
                  total: { type: 'number', example: 100 },
                  totalPages: { type: 'number', example: 5 },
                  hasNext: { type: 'boolean', example: true },
                  hasPrev: { type: 'boolean', example: false },
                },
              },
            },
          },
        ],
      },
    })
  );
};

// ==========================================
// @Throttle Decorator (custom wrapper)
// Apply rate limiting to specific endpoints
// ==========================================
export const THROTTLE_KEY = 'throttle';
export interface ThrottleOptions {
  name?: string;
  ttl?: number;
  limit?: number;
}

export const CustomThrottle = (options: ThrottleOptions) => SetMetadata(THROTTLE_KEY, options);

// ==========================================
// @TransactionManager Decorator
// Inject transaction manager into method parameter
// ==========================================
export const TRANSACTION_MANAGER_KEY = 'transactionManager';
export const TransactionManager = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.transactionManager;
});
