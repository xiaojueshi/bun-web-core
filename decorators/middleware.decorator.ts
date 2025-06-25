import "reflect-metadata";
import type {
  NestMiddleware,
  MiddlewareConfig,
} from "../middleware/middleware.interface";

/**
 * 中间件装饰器 - 用于标记中间件类
 * @param options 中间件选项
 */
export function Middleware(options?: {
  path?: string | string[];
  exclude?: string | string[];
}) {
  return function (target: any) {
    Reflect.defineMetadata("middleware", true, target);
    if (options) {
      Reflect.defineMetadata("middleware:options", options, target);
    }
  };
}

/**
 * 中间件解析器类
 */
export class MiddlewareResolver {
  private static middlewareConfigs: Map<string, MiddlewareConfig[]> = new Map();

  /**
   * 注册模块中间件
   * @param moduleClass 模块类
   * @param middlewares 中间件配置数组
   */
  static registerModuleMiddlewares(
    moduleClass: any,
    middlewares: MiddlewareConfig[]
  ): void {
    const moduleName = moduleClass.name || "unknown";
    this.middlewareConfigs.set(moduleName, middlewares);
  }

  /**
   * 获取路由的中间件
   * @param path 路由路径
   * @param method HTTP方法
   * @param moduleClass 模块类
   * @param container 依赖注入容器
   */
  static getMiddlewaresForRoute(
    path: string,
    method: string,
    moduleClass: any,
    container: any
  ): NestMiddleware[] {
    const moduleName = moduleClass.name || "unknown";
    const middlewareConfigs = this.middlewareConfigs.get(moduleName) || [];

    const matchedMiddlewares: NestMiddleware[] = [];

    for (const config of middlewareConfigs) {
      // 检查路径匹配
      if (config.path && !this.matchPath(config.path, path)) {
        continue;
      }

      // 检查排除路径
      if (config.exclude && this.matchPath(config.exclude, path)) {
        continue;
      }

      // 检查HTTP方法
      if (config.method && !this.matchMethod(config.method, method)) {
        continue;
      }

      // 创建中间件实例
      const middleware = this.createMiddlewareInstance(
        config.middleware,
        container
      );
      if (middleware) {
        matchedMiddlewares.push(middleware);
      }
    }

    return matchedMiddlewares;
  }

  /**
   * 创建中间件实例
   */
  private static createMiddlewareInstance(
    middleware: any,
    container: any
  ): NestMiddleware | null {
    try {
      if (typeof middleware === "function") {
        // 如果是类构造函数
        if (middleware.prototype && middleware.prototype.use) {
          return container.resolve(middleware);
        }
        // 如果是函数，需要转换为中间件接口
        return {
          use: middleware,
        };
      }

      // 如果已经是实例
      if (middleware && typeof middleware.use === "function") {
        return middleware;
      }

      return null;
    } catch (error) {
      console.warn("创建中间件实例失败:", error);
      return null;
    }
  }

  /**
   * 路径匹配检查
   */
  private static matchPath(patterns: string | string[], path: string): boolean {
    const pathArray = Array.isArray(patterns) ? patterns : [patterns];
    return pathArray.some((pattern) => {
      // 简单的通配符匹配
      const regex = new RegExp(
        "^" + pattern.replace(/\*/g, ".*").replace(/\//g, "\\/") + "$"
      );
      return regex.test(path);
    });
  }

  /**
   * HTTP方法匹配检查
   */
  private static matchMethod(
    methods: string | string[],
    method: string
  ): boolean {
    const methodArray = Array.isArray(methods) ? methods : [methods];
    return methodArray.some((m) => m.toLowerCase() === method.toLowerCase());
  }
}

/**
 * 中间件配置构建器
 */
export class MiddlewareBuilder {
  private middlewares: any[] = [];
  private routes: string[] = [];
  private excludeRoutes: string[] = [];

  /**
   * 应用中间件
   */
  apply(...middleware: any[]): this {
    this.middlewares.push(...middleware);
    return this;
  }

  /**
   * 为指定路由应用中间件
   */
  forRoutes(...routes: (string | any)[]): this {
    this.routes.push(
      ...routes.map((route) => (typeof route === "string" ? route : route.path))
    );
    return this;
  }

  /**
   * 排除指定路由
   */
  exclude(...routes: (string | any)[]): this {
    this.excludeRoutes.push(
      ...routes.map((route) => (typeof route === "string" ? route : route.path))
    );
    return this;
  }

  /**
   * 构建中间件配置
   */
  build(): MiddlewareConfig[] {
    return this.middlewares.map((middleware) => ({
      middleware,
      path: this.routes.length > 0 ? this.routes : undefined,
      exclude: this.excludeRoutes.length > 0 ? this.excludeRoutes : undefined,
    }));
  }
}
