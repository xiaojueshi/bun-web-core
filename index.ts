// 装饰器
export { Injectable } from "./decorators/injectable.decorator";
export { Controller } from "./decorators/controller.decorator";
export { Module } from "./decorators/module.decorator";
export {
  Get,
  Post,
  Put,
  Delete,
  Patch,
} from "./decorators/http-methods.decorator";
export type {
  HttpMethod,
  RouteMetadata,
} from "./decorators/http-methods.decorator";
export type { ModuleMetadata } from "./decorators/module.decorator";

// Swagger 装饰器
export {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiTags,
} from "./decorators/swagger.decorator";
export type {
  ApiOperationOptions,
  ApiResponseOptions,
  ApiParamOptions,
  ApiBodyOptions,
} from "./decorators/swagger.decorator";

// 参数装饰器
export {
  Param,
  Query,
  Body,
  Headers,
  Req,
  Request,
  Res,
  Response,
  ParamResolver,
} from "./decorators/param.decorator";
export type {
  ParamType,
  ParamMetadata,
  ExecutionContext,
} from "./decorators/param.decorator";

// 守卫系统
export { UseGuards, GuardResolver } from "./decorators/guard.decorator";
export type { GuardClass } from "./decorators/guard.decorator";
export {
  GuardExecutor,
  HttpExecutionContext,
  HttpException,
  UnauthorizedException,
  ForbiddenException,
} from "./guards/guard.interface";
export type {
  CanActivate,
  GuardMetadata,
  Observable,
} from "./guards/guard.interface";

// 异常过滤器系统
export {
  Catch,
  UseFilters,
  FilterResolver,
} from "./decorators/exception-filter.decorator";
export type { ExceptionFilterClass } from "./decorators/exception-filter.decorator";
export {
  DefaultExceptionFilter,
  ExceptionFilterExecutor,
  HttpArgumentsHostImpl,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from "./filters/exception.filter";
export type {
  ExceptionFilter,
  ArgumentsHost,
  HttpArgumentsHost,
} from "./filters/exception.filter";

// 依赖注入
export { Container } from "./container/container";

// 应用程序核心
export { Application } from "./application/application";
export type { ApplicationOptions, RouteInfo } from "./application/application";
export { ApplicationFactory } from "./core/application-factory";

// Swagger
export { SwaggerModule } from "./swagger/swagger.module";
export type { SwaggerConfig, OpenAPISpec } from "./swagger/swagger-generator";

// 管道系统
export { PipeResolver } from "./pipes/pipe-resolver";
export { ValidationPipe, ValidationException } from "./pipes/validation.pipe";
export type {
  PipeTransform,
  ArgumentMetadata,
  PipeMetadata,
} from "./pipes/pipe.interface";
export type { ValidationPipeOptions } from "./pipes/validation.pipe";
export { ParseIntPipe, PipeExecutor } from "./pipes/pipe.interface";

// 中间件系统
export {
  MiddlewareExecutor,
  MiddlewareExecutionContext,
  LoggerMiddleware,
  CorsMiddleware,
} from "./middleware/middleware.interface";
export type {
  NestMiddleware,
  MiddlewareFunction,
  MiddlewareConfig,
  MiddlewareConsumer,
  MiddlewareConfigurator,
  RouteInfo as MiddlewareRouteInfo,
} from "./middleware/middleware.interface";

export {
  Middleware,
  MiddlewareResolver,
  MiddlewareBuilder,
} from "./decorators/middleware.decorator";

// 拦截器系统
export {
  SimpleObservable,
  CallHandlerImpl,
  InterceptorExecutionContext,
  InterceptorExecutor,
  LoggingInterceptor,
  CacheInterceptor,
  TransformInterceptor,
} from "./interceptors/interceptor.interface";
export type {
  Observable as InterceptorObservable,
  CallHandler,
  ExecutionContext as InterceptorExecutionContextInterface,
  NestInterceptor,
} from "./interceptors/interceptor.interface";

export {
  UseInterceptors,
  InterceptorResolver,
  Interceptor,
} from "./decorators/interceptor.decorator";

// 生命周期钩子
export {
  LifecycleManager,
  LifecycleHook,
  LifecycleModule,
} from "./lifecycle/lifecycle.interface";
export type {
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  LifecycleEvent,
  ModuleLifecycleOptions,
} from "./lifecycle/lifecycle.interface";
