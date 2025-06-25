import "reflect-metadata";
import type { RouteInfo } from "../application/application";
import type { RouteMetadata } from "../decorators/http-methods.decorator";
import type {
  ApiParamOptions,
  ApiResponseOptions,
} from "../decorators/swagger.decorator";

/**
 * Swagger 配置接口
 */
export interface SwaggerConfig {
  /** 文档标题 */
  title: string;
  /** 文档描述 */
  description: string;
  /** 版本 */
  version: string;
  /** 服务器列表 */
  servers?: Array<{
    url: string;
    description?: string;
  }>;
}

/**
 * OpenAPI 规范接口
 */
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
}

/**
 * Swagger 文档生成器
 */
export class SwaggerGenerator {
  private config: SwaggerConfig;

  constructor(config: SwaggerConfig) {
    this.config = config;
  }

  /**
   * 生成 OpenAPI 规范文档
   * @param routes 路由信息
   */
  generateSpec(routes: RouteInfo[]): OpenAPISpec {
    const spec: OpenAPISpec = {
      openapi: "3.0.0",
      info: {
        title: this.config.title,
        description: this.config.description,
        version: this.config.version,
      },
      servers: this.config.servers || [
        {
          url: "http://localhost:3000",
          description: "开发服务器",
        },
      ],
      paths: {},
      components: {
        schemas: {
          ApiResponse: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              message: { type: "string" },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              error: { type: "string" },
            },
          },
          User: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "张三" },
              email: { type: "string", example: "zhangsan@example.com" },
            },
            required: ["id", "name", "email"],
          },
          CreateUserDto: {
            type: "object",
            properties: {
              name: { type: "string", example: "张三" },
              email: { type: "string", example: "zhangsan@example.com" },
            },
            required: ["name", "email"],
          },
          UpdateUserDto: {
            type: "object",
            properties: {
              name: { type: "string", example: "张三" },
              email: { type: "string", example: "zhangsan@example.com" },
            },
          },
        },
      },
    };

    // 按路径分组路由
    const pathGroups = this.groupRoutesByPath(routes);

    // 为每个路径生成 OpenAPI 路径定义
    Object.entries(pathGroups).forEach(([path, routesByMethod]) => {
      spec.paths[path] = {};

      Object.entries(routesByMethod).forEach(([method, route]) => {
        const methodLowerCase = method.toLowerCase();
        spec.paths[path][methodLowerCase] = this.generatePathOperation(
          route,
          path
        );
      });
    });

    return spec;
  }

  /**
   * 按路径分组路由
   */
  private groupRoutesByPath(
    routes: RouteInfo[]
  ): Record<string, Record<string, RouteInfo>> {
    const groups: Record<string, Record<string, RouteInfo>> = {};

    routes.forEach((route) => {
      // 将动态路径参数转换为 OpenAPI 格式
      const openApiPath = route.path.replace(/:([^/]+)/g, "{$1}");

      if (!groups[openApiPath]) {
        groups[openApiPath] = {};
      }
      groups[openApiPath][route.method] = route;
    });

    return groups;
  }

  /**
   * 生成单个路径操作的 OpenAPI 定义
   */
  private generatePathOperation(route: RouteInfo, path: string): any {
    const controllerClass = route.controller.constructor;
    const methodName = this.getMethodNameFromHandler(route.handler);

    // 获取 Swagger 元数据
    const operations =
      Reflect.getMetadata("swagger:operations", controllerClass) || {};
    const responses =
      Reflect.getMetadata("swagger:responses", controllerClass) || {};
    const params = Reflect.getMetadata("swagger:params", controllerClass) || {};
    const bodies = Reflect.getMetadata("swagger:bodies", controllerClass) || {};
    const tags = Reflect.getMetadata("swagger:tags", controllerClass) || [];

    const operation = operations[methodName] || {};
    const operationResponses: ApiResponseOptions[] =
      responses[methodName] || [];
    const operationParams: ApiParamOptions[] = params[methodName] || [];
    const operationBody = bodies[methodName];

    const pathOperation: any = {
      summary: operation.summary || `${route.method} ${path}`,
      description: operation.description || "",
      tags: operation.tags || tags,
      operationId:
        operation.operationId || `${methodName}_${route.method.toLowerCase()}`,
    };

    // 添加参数
    if (operationParams.length > 0 || path.includes("{")) {
      pathOperation.parameters = [];

      // 从路径中提取参数
      const pathParams = path.match(/\{([^}]+)\}/g);
      if (pathParams) {
        pathParams.forEach((param: string) => {
          const paramName = param.slice(1, -1);
          const existingParam = operationParams.find(
            (p: ApiParamOptions) => p.name === paramName
          );

          pathOperation.parameters.push({
            name: paramName,
            in: "path",
            required: true,
            description: existingParam?.description || `${paramName} 参数`,
            schema: {
              type: existingParam?.type || "string",
              example: existingParam?.example,
            },
          });
        });
      }

      // 添加其他参数
      operationParams.forEach((param: ApiParamOptions) => {
        if (!pathParams?.some((p: string) => p.slice(1, -1) === param.name)) {
          pathOperation.parameters.push({
            name: param.name,
            in: "query",
            required: param.required || false,
            description: param.description || "",
            schema: {
              type: param.type || "string",
              example: param.example,
            },
          });
        }
      });
    }

    // 添加请求体
    if (operationBody && ["POST", "PUT", "PATCH"].includes(route.method)) {
      pathOperation.requestBody = {
        description: operationBody.description || "请求体",
        required: operationBody.required !== false,
        content: {
          "application/json": {
            schema: this.getSchemaForType(operationBody.type) || {
              type: "object",
            },
            example: operationBody.example,
          },
        },
      };
    }

    // 添加响应
    pathOperation.responses = {};

    if (operationResponses.length > 0) {
      operationResponses.forEach((response: ApiResponseOptions) => {
        pathOperation.responses[response.status] = {
          description: response.description,
          content: {
            "application/json": {
              schema: this.getSchemaForType(response.type) || {
                $ref: "#/components/schemas/ApiResponse",
              },
              example: response.example,
            },
          },
        };
      });
    } else {
      // 默认响应
      pathOperation.responses["200"] = {
        description: "成功响应",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiResponse" },
          },
        },
      };

      pathOperation.responses["404"] = {
        description: "资源未找到",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      };

      pathOperation.responses["500"] = {
        description: "服务器内部错误",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      };
    }

    return pathOperation;
  }

  /**
   * 从处理函数中获取方法名
   */
  private getMethodNameFromHandler(handler: Function): string {
    // 尝试从函数名中提取方法名
    const funcStr = handler.toString();
    const match = funcStr.match(/function\s+([^(]+)/);
    if (match && match[1]) {
      return match[1];
    }

    // 如果是绑定的函数，尝试从 name 属性获取
    if (handler.name && handler.name !== "bound") {
      return handler.name;
    }

    return "unknownMethod";
  }

  /**
   * 根据类型获取 JSON Schema
   */
  private getSchemaForType(type?: any): any {
    if (!type) return null;

    if (typeof type === "string") {
      switch (type) {
        case "User":
          return { $ref: "#/components/schemas/User" };
        case "CreateUserDto":
          return { $ref: "#/components/schemas/CreateUserDto" };
        case "UpdateUserDto":
          return { $ref: "#/components/schemas/UpdateUserDto" };
        default:
          return { type: "object" };
      }
    }

    return { type: "object" };
  }
}
