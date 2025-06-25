import "reflect-metadata";
import { Container } from "../container/container";
import type { RouteMetadata } from "../decorators/http-methods.decorator";
import { SwaggerModule } from "../swagger/swagger.module";
import type { SwaggerConfig } from "../swagger/swagger-generator";
import { GuardResolver } from "../decorators/guard.decorator";
import { GuardExecutor, HttpExecutionContext } from "../guards/guard.interface";
import type { GuardResult } from "../guards/guard.interface";
import { ParamResolver } from "../decorators/param.decorator";
import { FilterResolver } from "../decorators/exception-filter.decorator";
import {
  ExceptionFilterExecutor,
  HttpArgumentsHostImpl,
} from "../filters/exception.filter";
import { PipeResolver } from "../pipes/pipe-resolver";
import type { PipeTransform } from "../pipes/pipe.interface";

/**
 * 静态路由配置接口
 */
export interface StaticRoute {
  /** 路由路径 */
  path: string;
  /** HTML 文件路径或者 HTML 导入对象 */
  html: string | any;
}

/**
 * 应用程序选项接口
 */
export interface ApplicationOptions {
  /** 监听端口 */
  port?: number;
  /** 是否开启 CORS */
  cors?: boolean;
  /** 全局路由前缀 */
  globalPrefix?: string;
  /** Swagger 配置 */
  swagger?: SwaggerConfig;
  /** 静态路由配置 */
  staticRoutes?: StaticRoute[];
  /** 开发模式配置 */
  development?:
    | boolean
    | {
        /** 是否启用热模块替换 */
        hmr?: boolean;
        /** 是否启用控制台日志输出 */
        console?: boolean;
      };
  /** 静态文件目录 */
  staticDir?: string;
}

/**
 * 路由信息接口
 */
export interface RouteInfo {
  method: string;
  path: string;
  handler: Function;
  controller: any;
  controllerClass: any;
  methodName: string;
}

/**
 * 应用程序核心类
 */
export class Application {
  private container: Container;
  private routes: RouteInfo[] = [];
  private options: ApplicationOptions;
  private swaggerSetup: {
    getSwaggerUI: () => string;
    getSwaggerSpec: () => string;
  } | null = null;

  constructor(AppModule: any, options: ApplicationOptions = {}) {
    this.container = Container.getInstance();
    this.options = {
      port: 3000,
      cors: true,
      globalPrefix: "",
      staticRoutes: [],
      development: false,
      staticDir: "static",
      ...options,
    };

    this.loadModule(AppModule);

    // 设置 Swagger 文档
    if (this.options.swagger) {
      this.swaggerSetup = SwaggerModule.setup(
        this.options.swagger,
        this.routes
      );
    }
  }

  /**
   * 设置全局守卫
   * @param guards 守卫类数组
   */
  useGlobalGuards(...guards: (new (...args: any[]) => any)[]): this {
    GuardResolver.setGlobalGuards(guards, this.container);
    return this;
  }

  /**
   * 设置全局异常过滤器
   * @param filters 过滤器类或实例数组
   */
  useGlobalFilters(...filters: any[]): this {
    FilterResolver.setGlobalFilters(filters, this.container);
    return this;
  }

  /**
   * 设置全局管道
   * @param pipes 管道类或实例数组
   */
  useGlobalPipes(
    ...pipes: (PipeTransform | (new (...args: any[]) => PipeTransform))[]
  ): this {
    PipeResolver.setGlobalPipes(pipes, this.container);
    return this;
  }

  /**
   * 加载模块
   */
  private loadModule(ModuleClass: any): void {
    const isModule = Reflect.getMetadata("module", ModuleClass);
    if (!isModule) {
      throw new Error(`${ModuleClass.name} 不是一个有效的模块`);
    }

    // 获取模块元数据
    const imports = Reflect.getMetadata("imports", ModuleClass) || [];
    const controllers = Reflect.getMetadata("controllers", ModuleClass) || [];
    const providers = Reflect.getMetadata("providers", ModuleClass) || [];

    // 递归加载导入的模块
    imports.forEach((importedModule: any) => {
      this.loadModule(importedModule);
    });

    // 注册提供者
    providers.forEach((provider: any) => {
      this.container.register(provider.name, provider);
    });

    // 注册控制器并提取路由
    controllers.forEach((controller: any) => {
      this.loadController(controller);
    });
  }

  /**
   * 加载控制器
   */
  private loadController(ControllerClass: any): void {
    const isController = Reflect.getMetadata("controller", ControllerClass);
    if (!isController) {
      throw new Error(`${ControllerClass.name} 不是一个有效的控制器`);
    }

    const controllerPath = Reflect.getMetadata("path", ControllerClass) || "";
    const routes: RouteMetadata[] =
      Reflect.getMetadata("routes", ControllerClass) || [];

    // 创建控制器实例
    const controllerInstance = this.container.resolve(ControllerClass) as any;

    // 注册路由
    routes.forEach((route) => {
      const fullPath = this.combinePaths(
        this.options.globalPrefix || "",
        controllerPath,
        route.path
      );

      this.routes.push({
        method: route.method,
        path: fullPath,
        handler: controllerInstance[route.methodName].bind(controllerInstance),
        controller: controllerInstance,
        controllerClass: ControllerClass,
        methodName: route.methodName,
      });
    });
  }

  /**
   * 组合路径
   */
  private combinePaths(...paths: string[]): string {
    return (
      "/" +
      paths
        .filter((path) => path && path.length > 0)
        .map((path) => path.replace(/^\/+|\/+$/g, ""))
        .join("/")
        .replace(/\/+/g, "/")
    );
  }

  /**
   * 查找匹配的路由
   */
  private findMatchingRoute(
    pathname: string,
    method: string
  ): { handler: Function; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const params = this.matchRoute(route.path, pathname);
      if (params !== null) {
        return {
          handler: async (req: any) => {
            try {
              // 1. 解析守卫（包括全局守卫）
              const localGuards = GuardResolver.resolveGuards(
                route.controllerClass,
                route.methodName,
                this.container
              );
              const globalGuards = GuardResolver.getGlobalGuards(
                this.container
              );
              const guards = [...globalGuards, ...localGuards];

              // 2. 创建执行上下文
              const context = new HttpExecutionContext(
                req,
                null, // 响应对象在这里暂时为null
                route.handler,
                route.controllerClass
              );

              // 3. 执行守卫验证
              if (guards.length > 0) {
                const guardResult: GuardResult =
                  await GuardExecutor.canActivate(guards, context);
                if (!guardResult.canActivate) {
                  // 使用守卫内部的错误信息
                  const error = guardResult.error;
                  let status = 403;
                  let message = "访问被拒绝";

                  // 如果是 HttpException，使用其状态码和消息
                  if (error && "status" in error && "message" in error) {
                    status = (error as any).status;
                    message = error.message;
                  } else if (error) {
                    message = error.message || "访问被拒绝";
                  }

                  return new Response(
                    JSON.stringify({
                      error: "守卫验证失败",
                      message: message,
                    }),
                    {
                      status: status,
                      headers: { "Content-Type": "application/json" },
                    }
                  );
                }
              }

              // 4. 解析参数装饰器
              const resolvedParams = await ParamResolver.resolveParams(
                route.controller,
                route.methodName,
                req,
                this.container
              );

              // 5. 执行路由处理器
              const result =
                resolvedParams.length > 0
                  ? await route.handler(...resolvedParams)
                  : await route.handler(req);

              // 6. 处理响应
              // 如果返回的是普通对象，转换为 JSON 响应
              if (
                typeof result === "object" &&
                result !== null &&
                !(result instanceof Response)
              ) {
                return new Response(JSON.stringify(result), {
                  headers: { "Content-Type": "application/json" },
                });
              }

              // 如果返回的是字符串，创建文本响应
              if (typeof result === "string") {
                return new Response(result, {
                  headers: { "Content-Type": "text/plain" },
                });
              }

              // 如果已经是 Response 对象，直接返回
              return result || new Response("OK");
            } catch (error) {
              console.error("路由处理错误:", error);

              // 7. 异常过滤器处理（包括全局过滤器）
              const localFilters = FilterResolver.resolveFilters(
                route.controllerClass,
                route.methodName,
                this.container
              );
              const globalFilters = FilterResolver.getGlobalFilters(
                this.container
              );
              const filters = [...globalFilters, ...localFilters];

              // 创建参数主机
              const host = new HttpArgumentsHostImpl(req, null);

              // 执行异常过滤器
              return await ExceptionFilterExecutor.execute(
                error,
                filters,
                host
              );
            }
          },
          params,
        };
      }
    }
    return null;
  }

  /**
   * 匹配路由路径
   */
  private matchRoute(
    routePath: string,
    requestPath: string
  ): Record<string, string> | null {
    const routeSegments = routePath.split("/").filter(Boolean);
    const requestSegments = requestPath.split("/").filter(Boolean);

    if (routeSegments.length !== requestSegments.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const requestSegment = requestSegments[i];

      if (!routeSegment || !requestSegment) {
        return null;
      }

      if (routeSegment.startsWith(":")) {
        // 动态参数
        const paramName = routeSegment.slice(1);
        params[paramName] = requestSegment;
      } else if (routeSegment !== requestSegment) {
        // 静态段不匹配
        return null;
      }
    }

    return params;
  }

  /**
   * 启动应用程序
   */
  async listen(): Promise<void> {
    console.log(`🚀 应用程序启动在端口 ${this.options.port}`);
    console.log("📋 注册的 API 路由:");
    this.routes.forEach((route) => {
      console.log(`  ${route.method.padEnd(6)} ${route.path}`);
    });

    // 打印静态路由信息
    if (this.options.staticRoutes && this.options.staticRoutes.length > 0) {
      console.log("🌐 静态路由:");
      this.options.staticRoutes.forEach((route) => {
        console.log(`  GET    ${route.path}`);
      });
    }

    const corsHeaders: Record<string, string> = this.options.cors
      ? {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
      : {};

    // 构建静态路由映射
    const staticRoutesMap: Record<string, any> = {};
    if (this.options.staticRoutes) {
      this.options.staticRoutes.forEach((route) => {
        staticRoutesMap[route.path] = route.html;
      });
    }

    const server = (globalThis as any).Bun.serve({
      port: this.options.port,
      // 支持静态路由
      routes: staticRoutesMap,
      // 开发模式配置
      development: this.options.development,

      fetch: async (req: any) => {
        const url = new URL(req.url);
        const method = req.method;

        // 处理 OPTIONS 请求
        if (method === "OPTIONS") {
          return new Response(null, {
            status: 204,
            headers: corsHeaders,
          });
        }

        // 处理 Swagger 路由
        if (this.swaggerSetup) {
          // 主文档路径
          if (url.pathname === "/docs") {
            return new Response(this.swaggerSetup.getSwaggerUI(), {
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                ...corsHeaders,
              },
            });
          }

          // 兼容性重定向路径
          if (url.pathname === "/api/docs" || url.pathname === "/swagger") {
            return Response.redirect(
              `${url.protocol}//${url.host}/docs`,
              301 // 永久重定向
            );
          }

          // 主 JSON 规范路径
          if (url.pathname === "/docs-json") {
            return new Response(this.swaggerSetup.getSwaggerSpec(), {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            });
          }

          // 兼容性重定向路径（JSON 规范）
          if (
            url.pathname === "/api/docs-json" ||
            url.pathname === "/swagger.json"
          ) {
            return Response.redirect(
              `${url.protocol}//${url.host}/docs-json`,
              301 // 永久重定向
            );
          }
        }

        // 处理静态文件
        if (
          this.options.staticDir &&
          url.pathname.startsWith(`/${this.options.staticDir}/`)
        ) {
          return this.handleStaticFile(url.pathname);
        }

        // 查找匹配的 API 路由
        const matchedRoute = this.findMatchingRoute(url.pathname, method);
        if (matchedRoute) {
          // 将路由参数附加到请求对象
          (req as any).params = matchedRoute.params;
          const response = await matchedRoute.handler(req);

          // 添加 CORS 头到响应
          if (this.options.cors) {
            Object.entries(corsHeaders).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
          }

          return response;
        }

        // 404 响应
        return new Response("🔍 页面未找到", {
          status: 404,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            ...corsHeaders,
          },
        });
      },
    });

    console.log(`🌐 服务器运行在 http://localhost:${server.port}`);

    // 显示静态路由访问信息
    if (this.options.staticRoutes && this.options.staticRoutes.length > 0) {
      console.log(`📄 静态页面:`);
      this.options.staticRoutes.forEach((route) => {
        console.log(`   🔗 http://localhost:${server.port}${route.path}`);
      });
    }

    if (this.swaggerSetup) {
      console.log(`✨ 现代化 API 文档 (Scalar UI):`);
      console.log(`   📖 http://localhost:${server.port}/docs`);
      console.log(`📄 OpenAPI 规范:`);
      console.log(`   📄 http://localhost:${server.port}/docs-json`);
    }

    // 开发模式提示
    if (this.options.development) {
      console.log(
        `🔥 开发模式已启用 ${
          typeof this.options.development === "object"
            ? JSON.stringify(this.options.development)
            : ""
        }`
      );
    }
  }

  /**
   * 处理静态文件请求
   */
  private async handleStaticFile(pathname: string): Promise<Response> {
    try {
      const filePath = `.${pathname}`;
      const file = (globalThis as any).Bun.file(filePath);

      if (await file.exists()) {
        return new Response(file);
      } else {
        return new Response("文件未找到", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    } catch (error) {
      console.error("处理静态文件错误:", error);
      return new Response("服务器内部错误", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }
}
