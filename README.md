# @xiaojueshi/bun-web-core

@xiaojueshi/bun-web-core 是基于 Bun 运行时构建的现代化 TypeScript Web 框架核心库，旨在为开发者提供高效、模块化、类型安全的 Web 应用开发基础设施。

本包具备以下核心能力：

- **装饰器系统**：简化控制器、服务、模块等声明
- **依赖注入**：内置 IoC 容器，支持服务自动解析
- **守卫系统**：灵活的认证与权限控制
- **异常过滤器**：统一异常处理与响应格式
- **数据管道**：参数验证与转换
- **Swagger 支持**：自动生成 API 文档
- **拦截器**：请求/响应拦截与扩展
- **中间件**：灵活的请求处理链
- **生命周期管理**：模块与应用的生命周期钩子

适用于需要高性能、强类型、易扩展的中大型 Web 服务项目。

> 🚧 **开发阶段** - 当前版本为 v0.1.0-beta.6，这是一个个人开源项目，API 可能会有变化。欢迎提供反馈和建议！

## 📦 安装

```bash
# 使用 Bun (只适用于 Bun)
bun add @xiaojueshi/bun-web-core
```

## �� 系统要求

- **Bun**: `>=1.0.0` (推荐使用最新版本)
- **TypeScript**: `>=5.0.0`

## 🚀 为什么选择 @xiaojueshi/bun-web-core？

- ⚡ **极速性能**: 基于 Bun 运行时，比 Node.js 快 3-4 倍
- 🎯 **类型安全**: 完整的 TypeScript 支持，提供优秀的开发体验
- 🏗️ **模块化设计**: 采用现代化的模块化架构，易于扩展和维护
- 📚 **丰富功能**: 提供 Web 开发所需的完整基础设施
- 🔄 **生态兼容**: 与现有的 TypeScript/JavaScript 生态系统兼容

## 🚀 快速开始

### 基本使用

```typescript
import { Controller, Get, Injectable, Module } from "@xiaojueshi/bun-web-core";

// 服务层，负责业务逻辑
@Injectable()
export class UserService {
  getUsers() {
    // 返回用户列表
    return [{ id: 1, name: "张三" }];
  }
}

// 控制器，处理路由请求
@Controller("/users")
export class UserController {
  // 依赖注入 UserService
  constructor(private userService: UserService) {}

  // GET /users 路由
  @Get()
  getUsers() {
    return this.userService.getUsers();
  }
}

// 模块，组织控制器和服务
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

### 启动 Web 服务

> 以下为 main.ts 启动文件的标准写法，所有 API 均已在本包中真实实现。

```typescript
import "reflect-metadata";
import { ApplicationFactory } from "@xiaojueshi/bun-web-core";
import { AppModule } from "./app.module";
// 可选：引入全局管道、守卫、异常过滤器
import { ValidationPipe } from "@xiaojueshi/bun-web-core";
import { ValidationExceptionFilter } from "@xiaojueshi/bun-web-core";

async function bootstrap() {
  // 创建应用实例，传入根模块和配置
  const app = ApplicationFactory.create(AppModule, {
    port: 3000, // 监听端口
    cors: true, // 启用 CORS
    globalPrefix: "/api", // 全局路由前缀
    // 其他可选配置...
  });

  // 设置全局管道（如参数校验）
  app.useGlobalPipes(new ValidationPipe());

  // 设置全局异常过滤器
  app.useGlobalFilters(new ValidationExceptionFilter());

  // 启动服务
  await app.listen();
}

// 启动应用
bootstrap().catch(console.error);
```

> 你只需运行 `bun run main.ts` 即可快速启动一个现代化 Web 服务。

### 守卫使用

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UseGuards,
} from "@xiaojueshi/bun-web-core";

// 自定义认证守卫
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 获取请求对象
    const request = context.getRequest();
    // 检查是否有认证头
    return !!request.headers.authorization;
  }
}

// 受保护的控制器
@Controller("/protected")
@UseGuards(AuthGuard) // 应用守卫
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
} from "@xiaojueshi/bun-web-core";
import { IsEmail, IsNotEmpty } from "class-validator";

// DTO，定义数据结构和校验规则
export class CreateUserDto {
  @IsNotEmpty({ message: "姓名不能为空" })
  name: string;

  @IsEmail({}, { message: "邮箱格式不正确" })
  email: string;
}

// 控制器，应用参数校验异常过滤器
@Controller("/users")
@UseFilters(ValidationExceptionFilter)
export class UserController {
  // POST /users 路由，自动校验请求体
  @Post()
  createUser(@Body() userData: CreateUserDto) {
    return { success: true, data: userData };
  }
}
```

## 📚 API 文档

### 装饰器

- `@Injectable()`：声明服务可被依赖注入
- `@Controller(path)`：声明控制器及路由前缀
- `@Module(options)`：声明模块及依赖
- `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`：HTTP 路由方法装饰器（支持通配符路由）
- `@Param(key)`, `@Query(key)`, `@Body()`, `@Headers(key)`：参数提取装饰器
- `@UseGuards(...guards)`：应用守卫
- `@UseFilters(...filters)`：应用异常过滤器
- `@UseInterceptors(...interceptors)`：应用拦截器
- `@Middleware()`：声明中间件
- `@Catch(ExceptionType)`：声明异常过滤器
- **Swagger 装饰器**：`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`, `@ApiBody`

### 核心类与全局方法

- `ApplicationFactory.create(AppModule, options)`：创建应用实例
- `Application`：应用核心类，支持 `useGlobalPipes`、`useGlobalFilters`、`useGlobalGuards`、`listen` 等方法
- `Container`：依赖注入容器
- `ValidationPipe`：参数校验管道
- `DefaultExceptionFilter`、`ValidationExceptionFilter`：异常过滤器
- `LoggingInterceptor`、`CacheInterceptor`、`TransformInterceptor`：内置拦截器
- `SwaggerModule`：Swagger 文档集成

### 类型与接口

- `CanActivate`：守卫接口
- `ExceptionFilter`：异常过滤器接口
- `PipeTransform`：管道接口
- `NestInterceptor`：拦截器接口
- `ExecutionContext`：执行上下文
- `ApplicationOptions`：应用配置项
- `SwaggerConfig`：Swagger 配置项

---

## 🔧 典型用法示例

### 全局中间件

```typescript
import { Middleware, Injectable, NextFunction } from "@xiaojueshi/bun-web-core";

@Injectable()
@Middleware()
export class LoggerMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`[${req.method}] ${req.url}`);
    next();
  }
}
```

### 全局拦截器

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@xiaojueshi/bun-web-core";

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now();
    return next.handle().map((data) => {
      console.log(`耗时: ${Date.now() - start}ms`);
      return data;
    });
  }
}
```

### 生命周期钩子

```typescript
import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
} from "@xiaojueshi/bun-web-core";

@Injectable()
export class MyService implements OnModuleInit, OnApplicationShutdown {
  onModuleInit() {
    console.log("模块初始化完成");
  }
  onApplicationShutdown(signal?: string) {
    console.log("应用关闭", signal);
  }
}
```

## 🌐 全局管道与拦截器的灵活注册

框架支持全局管道、全局拦截器的多种注册方式，包括：

- 传递类（自动依赖注入）
- 传递实例
- 工厂函数（可闭包传参/异步）

### 全局管道注册示例

```typescript
app.useGlobalPipes(
  ValidationPipe, // 传递类
  new ValidationPipe({ skipMissingProperties: true }), // 传递实例
  () => new ValidationPipe({ whitelist: true }), // 工厂函数
  async () => await createAsyncPipe() // 异步工厂
);
```

### 全局拦截器注册示例

```typescript
app.useGlobalInterceptors(
  LoggingInterceptor, // 传递类
  new LoggingInterceptor(), // 传递实例
  () => new LoggingInterceptor("参数"), // 工厂函数
  async () => await createAsyncInterceptor() // 异步工厂
);
```

> 推荐：如需传参或异步初始化，优先用工厂函数或 async 工厂。

## 🛡️ 全局守卫的灵活注册

框架支持全局守卫的多种注册方式，包括：

- 传递类（自动依赖注入）
- 传递实例
- 工厂函数（可闭包传参/异步）

### 全局守卫注册示例

```typescript
app.useGlobalGuards(
  AuthGuard, // 传递类
  new AuthGuard("参数"), // 传递实例
  () => new AuthGuard("参数"), // 工厂函数
  async () => await createAsyncGuard() // 异步工厂
);
```

> 推荐：如需传参或异步初始化，优先用工厂函数或 async 工厂。

## 🔧 高级用法

### 自定义守卫

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@xiaojueshi/bun-web-core";

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
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
} from "@xiaojueshi/bun-web-core";

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
} from "@xiaojueshi/bun-web-core";

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

## 🌟 通配符路由支持

框架现在支持通配符路由，提供了更灵活的路由匹配能力：

### 单段通配符 (*)

匹配单个路径段：

```typescript
@Controller("/api")
export class FileController {
  // 匹配 /api/files/document.txt, /api/files/image.png 等
  @Get("/files/*")
  getFile() {
    return { message: "获取文件" };
  }
}
```

### 多段通配符 (**)

匹配多个路径段：

```typescript
@Controller("/api")
export class DocsController {
  // 匹配 /api/docs/guide/intro.md, /api/docs/api/reference.md 等多级路径
  @Get("/docs/**")
  getDocument() {
    return { message: "获取文档" };
  }
}
```

### 参数与通配符组合

```typescript
@Controller("/api")
export class DataController {
  // 匹配 /api/data/users.json, /api/data/config/app.json 等
  @Post("/data/**")
  createData() {
    return { message: "创建数据" };
  }
  
  // 匹配 /api/users/123/posts, /api/users/456/posts 等
  @Get("/users/:id/*")
  getUserData() {
    return { message: "获取用户数据" };
  }
}
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **报告问题**: 在 [Issues](https://github.com/xiaojueshi/bun-web-core/issues) 中报告 Bug 或提出功能请求
2. **提交代码**: Fork 项目并提交 Pull Request
3. **完善文档**: 帮助改进文档和示例
4. **分享反馈**: 分享使用体验和建议

### 开发规范

- 使用 TypeScript 编写代码
- 遵循现有的代码风格
- 添加必要的测试
- 更新相关文档

### 开发建议与注意事项

- 所有提交需通过 Husky 预检钩子
- 建议采用 feature/xxx、fix/xxx 等分支命名
- 合并前需通过 lint、test、type-check
- 代码注释需完善，类型声明尽量具体，避免 any
- 动画优先使用 CSS Transition
- 禁止在循环/条件语句中使用 Hooks

### 提交规范

请遵循 [Angular Commit Message Convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit):

```
feat: 添加新功能
fix: 修复 Bug
docs: 更新文档
style: 代码格式化
refactor: 重构代码
test: 添加测试
chore: 其他修改
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📦 版本信息

当前版本: **v0.1.0-beta.5**

### 版本说明

- 🚧 **Beta 版本**: 这是一个开发中的版本，API 可能会发生变化
- 🔄 **持续更新**: 我们正在不断优化和添加新功能
- 💬 **反馈欢迎**: 如果你有任何建议或遇到问题，请及时反馈

### 更新计划

- [ ] 完善测试覆盖率
- [ ] 添加更多装饰器和功能
- [ ] 优化性能和内存使用
- [ ] 完善文档和示例
- [ ] 发布稳定版本

## 🛠️ 开发指南

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/xiaojueshi/bun-web-core.git
cd bun-web-core

# 安装依赖
bun install

# 运行测试
bun test

# 类型检查
bun run type-check

# 构建
bun run build
```

### 发布流程

```bash
# 更新版本
bun version patch # 或 minor/major

# 发布到 NPM
bun publish
```

## 🗂️ 目录结构说明

| 目录/文件     | 说明               |
| ------------- | ------------------ |
| decorators/   | 各类装饰器实现     |
| guards/       | 守卫接口与实现     |
| filters/      | 异常过滤器相关     |
| pipes/        | 管道与参数校验     |
| middleware/   | 中间件相关         |
| interceptors/ | 拦截器相关         |
| lifecycle/    | 生命周期钩子       |
| swagger/      | Swagger 文档生成   |
| container/    | 依赖注入容器       |
| core/         | 应用工厂等核心逻辑 |
| application/  | 应用主入口         |
| index.ts      | 包导出入口         |

---

## 👨‍💻 作者

这是 **xiaojueshi** 的个人开源项目，致力于探索基于 Bun 运行时的现代化 Web 框架解决方案。

如果你对这个项目有任何疑问或建议，欢迎通过 GitHub Issues 与我交流！

## 🔗 相关链接

- [GitHub 仓库](https://github.com/xiaojueshi/bun-web-core)
- [问题反馈](https://github.com/xiaojueshi/bun-web-core/issues)
- [更新日志](https://github.com/xiaojueshi/bun-web-core/releases)
- [Bun 官方文档](https://bun.sh/docs)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
