# @xiaojueshi/bun-common

Bun Web Framework 的通用核心模块，提供装饰器、依赖注入、守卫、过滤器、管道等核心功能。

## ✨ 特性

- 🎯 **装饰器系统**: 提供控制器、模块、服务等核心装饰器
- 💉 **依赖注入**: 内置 IoC 容器，支持服务自动解析
- 🛡️ **守卫系统**: 提供认证和权限控制功能
- 🚨 **异常过滤器**: 统一异常处理和错误响应格式化
- 🔧 **数据管道**: 内置数据验证和转换管道
- 📖 **Swagger 支持**: 自动生成 API 文档
- 🔄 **拦截器**: 支持请求/响应拦截和转换
- 🔗 **中间件**: 提供灵活的中间件系统
- ♻️ **生命周期**: 完整的模块生命周期管理

## 📦 安装

```bash
bun add @xiaojueshi/bun-common
```

## 🚀 快速开始

### 基本使用

```typescript
import { Controller, Get, Injectable, Module } from "@bun-framework/common";

// 服务
@Injectable()
export class UserService {
  getUsers() {
    return [{ id: 1, name: "张三" }];
  }
}

// 控制器
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUsers() {
    return this.userService.getUsers();
  }
}

// 模块
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

### 守卫使用

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UseGuards,
} from "@bun-framework/common";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.getRequest();
    return !!request.headers.authorization;
  }
}

@Controller("/protected")
@UseGuards(AuthGuard)
export class ProtectedController {
  @Get()
  protectedRoute() {
    return { message: "受保护的路由" };
  }
}
```

### 数据验证

```typescript
import {
  Body,
  Post,
  ValidationPipe,
  UseFilters,
  ValidationExceptionFilter,
} from "@bun-framework/common";
import { IsEmail, IsNotEmpty } from "class-validator";

export class CreateUserDto {
  @IsNotEmpty({ message: "姓名不能为空" })
  name: string;

  @IsEmail({}, { message: "邮箱格式不正确" })
  email: string;
}

@Controller("/users")
@UseFilters(ValidationExceptionFilter)
export class UserController {
  @Post()
  createUser(@Body() userData: CreateUserDto) {
    return { success: true, data: userData };
  }
}
```

## 📚 API 文档

### 核心装饰器

- `@Injectable()` - 标记类为可注入的服务
- `@Controller(path)` - 定义控制器和路由前缀
- `@Module(options)` - 定义模块和依赖关系
- `@Get()`, `@Post()`, `@Put()`, `@Delete()` - HTTP 方法装饰器

### 参数装饰器

- `@Param(key)` - 获取路由参数
- `@Query(key)` - 获取查询参数
- `@Body()` - 获取请求体
- `@Headers(key)` - 获取请求头

### 功能装饰器

- `@UseGuards(...guards)` - 应用守卫
- `@UseFilters(...filters)` - 应用异常过滤器
- `@UseInterceptors(...interceptors)` - 应用拦截器

### Swagger 装饰器

- `@ApiTags(tag)` - API 分组标签
- `@ApiOperation(options)` - 操作描述
- `@ApiResponse(options)` - 响应描述
- `@ApiParam(options)` - 参数描述
- `@ApiBody(options)` - 请求体描述

## 🔧 高级用法

### 自定义守卫

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@bun-framework/common";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private requiredRole: string) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.getRequest();
    const userRole = request.headers["x-user-role"];

    if (userRole !== this.requiredRole) {
      throw new UnauthorizedException("权限不足");
    }

    return true;
  }
}
```

### 自定义异常过滤器

```typescript
import { ExceptionFilter, Catch, ArgumentsHost } from "@bun-framework/common";

@Catch(Error)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    return {
      statusCode: 500,
      message: exception.message,
      timestamp: new Date().toISOString(),
    };
  }
}
```

### 自定义拦截器

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@bun-framework/common";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.getRequest();
    console.log(`请求: ${request.method} ${request.url}`);

    const start = Date.now();
    return next.handle().map((data) => {
      console.log(`响应时间: ${Date.now() - start}ms`);
      return data;
    });
  }
}
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Bun Framework 主项目](https://github.com/xiaojueshi/bun-app)
- [问题反馈](https://github.com/xiaojueshi/bun-common.git/issues)
- [更新日志](https://github.com/xiaojueshi/bun-common.git/releases)
