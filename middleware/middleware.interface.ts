import "reflect-metadata";

/**
 * 中间件接口 - 用于请求预处理和后处理
 */
export interface NestMiddleware {
  /**
   * 使用中间件处理请求
   * @param req 请求对象
   * @param res 响应对象
   * @param next 下一个中间件函数
   */
  use(req: any, res: any, next: (error?: Error | any) => void): void;
}

/**
 * 中间件函数类型
 */
export type MiddlewareFunction = (
  req: any,
  res: any,
  next: (error?: Error | any) => void
) => void;

/**
 * 中间件配置接口
 */
export interface MiddlewareConfig {
  /** 中间件类或函数 */
  middleware:
    | (new (...args: any[]) => NestMiddleware)
    | MiddlewareFunction
    | NestMiddleware;
  /** 应用路径 */
  path?: string | string[];
  /** 排除路径 */
  exclude?: string | string[];
  /** HTTP方法 */
  method?: string | string[];
}

/**
 * 中间件消费者接口
 */
export interface MiddlewareConsumer {
  /**
   * 应用中间件到指定路径
   * @param middleware 中间件类、函数或实例
   */
  apply(
    ...middleware: (MiddlewareFunction | NestMiddleware | any)[]
  ): MiddlewareConfigurator;
}

/**
 * 中间件配置器接口
 */
export interface MiddlewareConfigurator {
  /**
   * 为指定的控制器应用中间件
   * @param routes 路由匹配器
   */
  forRoutes(...routes: (string | any | RouteInfo)[]): MiddlewareConsumer;

  /**
   * 排除指定路由
   * @param routes 要排除的路由
   */
  exclude(...routes: (string | RouteInfo)[]): MiddlewareConfigurator;
}

/**
 * 路由信息接口
 */
export interface RouteInfo {
  path: string;
  method: string;
}

/**
 * 中间件执行上下文
 */
export class MiddlewareExecutionContext {
  constructor(
    private request: any,
    private response: any,
    private handler: Function
  ) {}

  getRequest(): any {
    return this.request;
  }

  getResponse(): any {
    return this.response;
  }

  getHandler(): Function {
    return this.handler;
  }
}

/**
 * 中间件执行器
 */
export class MiddlewareExecutor {
  /**
   * 创建中间件执行链
   * @param middlewares 中间件数组
   * @param finalHandler 最终处理器
   */
  static createExecutionChain(
    middlewares: NestMiddleware[],
    finalHandler: (req: any, res: any) => Promise<Response>
  ): (req: any, res: any) => Promise<Response> {
    return async (req: any, res: any): Promise<Response> => {
      let index = 0;

      const executeNext = async (): Promise<void> => {
        while (index < middlewares.length) {
          const middleware = middlewares[index++];
          if (!middleware) {
            continue;
          }
          await new Promise<void>((resolve, reject) => {
            try {
              middleware.use(req, res, (err?: Error | any) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            } catch (err) {
              reject(err);
            }
          });
        }
      };

      try {
        await executeNext();
        return await finalHandler(req, res);
      } catch (error) {
        throw error;
      }
    };
  }

  /**
   * 检查路径是否匹配
   * @param pattern 路径模式
   * @param path 实际路径
   */
  static matchPath(pattern: string, path: string): boolean {
    // 简单的路径匹配，支持通配符 *
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\//g, "\\/") + "$"
    );
    return regex.test(path);
  }
}

/**
 * 内置日志中间件
 */
export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: (error?: Error | any) => void): void {
    const start = Date.now();
    const method = req.method;
    const url = new URL(req.url).pathname;

    console.log(`🚀 [${new Date().toISOString()}] ${method} ${url} - 开始处理`);

    next();

    // 这里由于Bun的特殊性，我们无法直接监听响应完成
    // 实际的响应时间计算需要在应用层处理
    const duration = Date.now() - start;
    console.log(
      `✅ [${new Date().toISOString()}] ${method} ${url} - 处理完成 (+${duration}ms)`
    );
  }
}

/**
 * CORS 中间件
 */
export class CorsMiddleware implements NestMiddleware {
  constructor(
    private options: {
      origin?: string | string[] | boolean;
      methods?: string[];
      allowedHeaders?: string[];
      credentials?: boolean;
    } = {}
  ) {}

  use(req: any, res: any, next: (error?: Error | any) => void): void {
    const origin = this.options.origin || "*";
    const methods = this.options.methods || [
      "GET",
      "HEAD",
      "PUT",
      "PATCH",
      "POST",
      "DELETE",
    ];
    const allowedHeaders = this.options.allowedHeaders || [
      "Content-Type",
      "Authorization",
    ];

    // 将CORS头信息添加到请求对象，应用层可以使用这些信息
    (req as any).corsHeaders = {
      "Access-Control-Allow-Origin": Array.isArray(origin)
        ? origin.join(", ")
        : origin.toString(),
      "Access-Control-Allow-Methods": methods.join(", "),
      "Access-Control-Allow-Headers": allowedHeaders.join(", "),
      ...(this.options.credentials && {
        "Access-Control-Allow-Credentials": "true",
      }),
    };

    next();
  }
}
