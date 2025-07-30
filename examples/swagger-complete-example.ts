import "reflect-metadata";
import { Controller } from "../decorators/controller.decorator";
import { Get, Post } from "../decorators/http-methods.decorator";
import { Body, Param } from "../decorators/param.decorator";
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiTags,
} from "../decorators/swagger.decorator";
import { Injectable } from "../decorators/injectable.decorator";
import { Module } from "../decorators/module.decorator";
import { ApplicationFactory } from "../core/application-factory";

// DTO 定义
export class CreateUserDto {
  name!: string;
  email!: string;
  age?: number;
}

export class User {
  id!: number;
  name!: string;
  email!: string;
  age?: number;
  createdAt!: Date;
}

// 服务层
@Injectable()
export class UserService {
  private users: User[] = [
    {
      id: 1,
      name: "张三",
      email: "zhangsan@example.com",
      age: 25,
      createdAt: new Date(),
    },
  ];

  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: number): User | null {
    return this.users.find((user) => user.id === id) || null;
  }

  createUser(userData: CreateUserDto): User {
    const newUser: User = {
      id: this.users.length + 1,
      name: userData.name,
      email: userData.email,
      age: userData.age,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }
}

// 控制器层
@ApiTags("用户管理")
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @ApiOperation({
    summary: "获取用户列表",
    description: "获取所有用户的列表信息",
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
    type: "ErrorResponse",
  })
  getUsers() {
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
    type: "ErrorResponse",
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
    type: "ErrorResponse",
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

// 模块定义
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

// 主应用模块
@Module({
  imports: [UserModule],
})
export class AppModule {}

// 启动应用
async function bootstrap() {
  // Swagger 配置
  const swaggerConfig = {
    title: "用户管理 API",
    description: "用户管理系统的 API 文档",
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
    swagger: swaggerConfig,
  });

  console.log("🚀 启动用户管理 API 服务...");
  console.log("📚 Swagger 文档地址: http://localhost:3000/docs");
  console.log("📋 API 规范地址: http://localhost:3000/docs/json");
  console.log("🔗 API 端点:");
  console.log("   GET  /api/users - 获取用户列表");
  console.log("   GET  /api/users/:id - 获取单个用户");
  console.log("   POST /api/users - 创建用户");

  await app.listen();
}

// 如果直接运行此文件
if ((import.meta as any).main) {
  bootstrap().catch(console.error);
}
