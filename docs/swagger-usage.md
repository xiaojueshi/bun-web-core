# Swagger 响应参数标注使用指南

## 概述

本框架的 Swagger 实现完全支持响应参数标注功能。通过使用 `@ApiResponse` 装饰器，你可以为 API 端点定义详细的响应信息，包括状态码、描述、响应类型和示例数据。

## 基本用法

### 1. 导入装饰器

```typescript
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiTags,
} from "@xiaojueshi/bun-web-core";
```

### 2. 定义 DTO 和响应类型

```typescript
// 请求 DTO
export class CreateUserDto {
  name!: string;
  email!: string;
  age?: number;
}

// 响应类型
export class User {
  id!: number;
  name!: string;
  email!: string;
  age?: number;
  createdAt!: Date;
}

export class ApiResponseDto<T> {
  success!: boolean;
  data?: T;
  message?: string;
}

export class ErrorResponseDto {
  success!: boolean;
  message!: string;
  error?: string;
  timestamp!: string;
}
```

### 3. 在控制器中使用装饰器

```typescript
@ApiTags("用户管理")
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @ApiOperation({
    summary: "获取用户列表",
    description: "获取所有用户的列表信息，支持分页查询",
  })
  @ApiResponse({
    status: 200,
    description: "成功获取用户列表",
    type: "User[]",
    example: [
      {
        id: 1,
        name: "张三",
        email: "zhangsan@example.com",
        age: 25,
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    ],
  })
  @ApiResponse({
    status: 500,
    description: "服务器内部错误",
    type: "ErrorResponseDto",
    example: {
      success: false,
      message: "服务器内部错误",
      error: "Internal Server Error",
      timestamp: "2024-01-01T00:00:00.000Z",
    },
  })
  getUsers(@Query("page") page?: number, @Query("limit") limit?: number) {
    const users = this.userService.getUsers();
    return {
      success: true,
      data: users,
      message: "获取用户列表成功",
    };
  }

  @Get("/:id")
  @ApiOperation({
    summary: "获取单个用户",
    description: "根据用户ID获取用户的详细信息",
  })
  @ApiParam({
    name: "id",
    description: "用户ID",
    type: "number",
    required: true,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "成功获取用户信息",
    type: "User",
    example: {
      id: 1,
      name: "张三",
      email: "zhangsan@example.com",
      age: 25,
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  })
  @ApiResponse({
    status: 404,
    description: "用户不存在",
    type: "ErrorResponseDto",
    example: {
      success: false,
      message: "用户不存在",
      timestamp: "2024-01-01T00:00:00.000Z",
    },
  })
  getUser(@Param("id") id: number) {
    const user = this.userService.getUserById(id);
    if (!user) {
      return {
        success: false,
        message: "用户不存在",
      };
    }
    return {
      success: true,
      data: user,
      message: "获取用户信息成功",
    };
  }

  @Post()
  @ApiOperation({
    summary: "创建用户",
    description: "创建新用户，需要提供用户名和邮箱",
  })
  @ApiBody({
    description: "用户创建信息",
    type: "CreateUserDto",
    required: true,
    example: {
      name: "李四",
      email: "lisi@example.com",
      age: 30,
    },
  })
  @ApiResponse({
    status: 201,
    description: "用户创建成功",
    type: "User",
    example: {
      id: 2,
      name: "李四",
      email: "lisi@example.com",
      age: 30,
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  })
  @ApiResponse({
    status: 400,
    description: "请求参数错误",
    type: "ErrorResponseDto",
    example: {
      success: false,
      message: "请求参数错误",
      timestamp: "2024-01-01T00:00:00.000Z",
    },
  })
  @ApiResponse({
    status: 409,
    description: "用户已存在",
    type: "ErrorResponseDto",
    example: {
      success: false,
      message: "用户邮箱已存在",
      timestamp: "2024-01-01T00:00:00.000Z",
    },
  })
  createUser(@Body() userData: CreateUserDto) {
    const newUser = this.userService.createUser(userData);
    return {
      success: true,
      data: newUser,
      message: "用户创建成功",
    };
  }
}
```

## 装饰器详解

### @ApiTags

为控制器添加标签，用于在 Swagger UI 中分组显示 API。

```typescript
@ApiTags("用户管理", "认证")
@Controller("/users")
export class UserController {}
```

### @ApiOperation

描述 API 操作的基本信息。

```typescript
@ApiOperation({
  summary: "操作摘要",
  description: "详细描述",
  operationId: "unique_operation_id",
  tags: ["标签1", "标签2"]
})
```

### @ApiResponse

定义 API 响应信息，支持多个响应状态。

```typescript
@ApiResponse({
  status: 200,                    // HTTP 状态码
  description: "成功响应",        // 响应描述
  type: "User",                   // 响应类型（字符串）
  example: { id: 1, name: "张三" } // 示例数据
})
```

**支持的响应类型：**

- 基本类型：`"string"`, `"number"`, `"boolean"`
- 对象类型：`"User"`, `"CreateUserDto"`, `"ErrorResponseDto"`
- 数组类型：`"User[]"`, `"string[]"`
- 通用响应：`"ApiResponse"`, `"ErrorResponse"`

### @ApiParam

描述路径参数。

```typescript
@ApiParam({
  name: "id",           // 参数名
  description: "用户ID", // 参数描述
  type: "number",       // 参数类型
  required: true,       // 是否必需
  example: 1           // 示例值
})
```

### @ApiBody

描述请求体。

```typescript
@ApiBody({
  description: "请求体描述",
  type: "CreateUserDto",  // 请求体类型
  required: true,         // 是否必需
  example: {              // 示例数据
    name: "张三",
    email: "zhangsan@example.com"
  }
})
```

## 设置 Swagger 文档

### 1. 配置 Swagger

```typescript
import { ApplicationFactory } from "@xiaojueshi/bun-web-core";
import { SwaggerModule } from "@xiaojueshi/bun-web-core";

// 设置 Swagger 文档
const swaggerConfig = {
  title: "API 文档",
  description: "API 接口文档",
  version: "1.0.0",
  servers: [
    {
      url: "http://localhost:3000",
      description: "开发服务器",
    },
  ],
};

// 创建应用
const app = ApplicationFactory.create(AppModule, {
  port: 3000,
  cors: true,
  globalPrefix: "/api",
  // 直接在应用配置中设置 Swagger
  swagger: swaggerConfig,
});
```

> **重要提示**：服务器 URL 应该设置为 `http://localhost:3000`，而不是 `http://localhost:3000/api`。这是因为框架会自动将全局前缀 `/api` 添加到路径中，如果服务器 URL 也包含 `/api`，会导致路径重复（如 `/api/api/users`）。

### 2. 自动文档路由

当设置了 `swagger` 配置时，框架会自动提供以下文档路由：

- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/docs-json`
- **兼容性重定向**:
  - `/api/docs` → `/docs`
  - `/swagger` → `/docs`
  - `/api/docs-json` → `/docs-json`
  - `/swagger.json` → `/docs-json`

无需手动配置路由，框架会自动处理！

## 最佳实践

### 1. 响应类型命名

- 使用清晰的类型名称
- 为不同的响应场景定义专门的 DTO
- 使用泛型类型如 `ApiResponseDto<T>`

### 2. 示例数据

- 提供真实、有意义的示例数据
- 包含所有必要的字段
- 使用合适的日期格式（ISO 8601）

### 3. 错误处理

- 为每个可能的错误状态定义响应
- 使用统一的错误响应格式
- 提供详细的错误描述

### 4. 文档组织

- 使用 `@ApiTags` 对 API 进行分组
- 为每个操作提供清晰的摘要和描述
- 保持文档的及时更新

## 常见问题

### Q: 为什么我的响应参数没有显示在文档中？

A: 确保：

1. 正确导入了 `reflect-metadata`
2. 装饰器语法正确
3. 方法名与装饰器匹配
4. 类型名称在 `getSchemaForType` 方法中有对应的处理

### Q: 如何支持自定义类型？

A: 在 `SwaggerGenerator` 的 `getSchemaForType` 方法中添加对应的类型处理：

```typescript
private getSchemaForType(type?: any): any {
  if (typeof type === "string") {
    switch (type) {
      case "YourCustomType":
        return { $ref: "#/components/schemas/YourCustomType" };
      // ... 其他类型
    }
  }
  return { type: "object" };
}
```

### Q: 如何支持泛型类型？

A: 目前支持简单的泛型字符串表示，如 `"ApiResponseDto<User>"`。如果需要更复杂的泛型支持，可以在 `getSchemaForType` 方法中添加解析逻辑。

## 总结

Swagger 响应参数标注功能完全正常工作，通过正确使用 `@ApiResponse` 装饰器，你可以为 API 创建详细、准确的文档。关键是要确保：

1. 正确使用装饰器语法
2. 提供完整的响应信息
3. 使用合适的类型名称
4. 保持文档的及时更新

这样就能生成高质量的 API 文档，提升开发体验和 API 的可维护性。
