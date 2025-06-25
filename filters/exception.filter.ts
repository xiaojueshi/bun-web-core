import "reflect-metadata";
import { HttpException } from "../guards/guard.interface";

/**
 * 异常过滤器接口
 */
export interface ExceptionFilter<T = any> {
  /**
   * 捕获异常并处理
   * @param exception 异常对象
   * @param host 参数主机
   */
  catch(
    exception: T,
    host: ArgumentsHost
  ): Response | Promise<Response> | void | Promise<void>;
}

/**
 * 参数主机接口 - 提供对请求/响应对象的访问
 */
export interface ArgumentsHost {
  /**
   * 获取参数数组
   */
  getArgs(): any[];

  /**
   * 根据索引获取参数
   */
  getArgByIndex(index: number): any;

  /**
   * 切换到HTTP上下文
   */
  switchToHttp(): HttpArgumentsHost;

  /**
   * 获取执行上下文类型
   */
  getType(): string;
}

/**
 * HTTP参数主机接口
 */
export interface HttpArgumentsHost {
  /**
   * 获取请求对象
   */
  getRequest(): any;

  /**
   * 获取响应对象
   */
  getResponse(): any;

  /**
   * 获取下一个函数
   */
  getNext(): any;
}

/**
 * HTTP参数主机实现
 */
export class HttpArgumentsHostImpl implements ArgumentsHost {
  constructor(
    private request: any,
    private response: any,
    private next?: any
  ) {}

  getArgs(): any[] {
    return [this.request, this.response, this.next].filter(Boolean);
  }

  getArgByIndex(index: number): any {
    const args = this.getArgs();
    return args[index];
  }

  switchToHttp(): HttpArgumentsHost {
    return {
      getRequest: () => this.request,
      getResponse: () => this.response,
      getNext: () => this.next,
    };
  }

  getType(): string {
    return "http";
  }
}

/**
 * 内置的HTTP异常过滤器
 */
export class DefaultExceptionFilter implements ExceptionFilter {
  /**
   * 捕获异常并处理
   */
  catch(exception: any, host: ArgumentsHost): Response {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    console.error("🚫 异常过滤器捕获到异常:", exception);

    if (exception instanceof HttpException) {
      // 处理 HTTP 异常
      const status = exception.status;
      const message = exception.message;

      return this.sendErrorResponse(status, {
        statusCode: status,
        message: message,
        error: this.getErrorName(status),
        timestamp: new Date().toISOString(),
        path: new URL(request.url).pathname,
      });
    } else if (exception && exception.message) {
      // 处理普通错误
      return this.sendErrorResponse(500, {
        statusCode: 500,
        message: "内部服务器错误",
        error: "Internal Server Error",
        details: exception.message,
        timestamp: new Date().toISOString(),
        path: new URL(request.url).pathname,
      });
    } else {
      // 处理未知异常
      return this.sendErrorResponse(500, {
        statusCode: 500,
        message: "未知错误",
        error: "Internal Server Error",
        timestamp: new Date().toISOString(),
        path: new URL(request.url).pathname,
      });
    }
  }

  /**
   * 发送错误响应
   */
  private sendErrorResponse(status: number, body: any): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * 根据状态码获取错误名称
   */
  private getErrorName(status: number): string {
    const errorMap: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      409: "Conflict",
      422: "Unprocessable Entity",
      429: "Too Many Requests",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
    };
    return errorMap[status] || "Unknown Error";
  }
}

/**
 * 异常过滤器执行器
 */
export class ExceptionFilterExecutor {
  /**
   * 执行异常过滤器
   * @param exception 异常对象
   * @param filters 过滤器数组
   * @param host 参数主机
   */
  static async execute(
    exception: any,
    filters: ExceptionFilter[],
    host: ArgumentsHost
  ): Promise<Response> {
    // 查找能处理该异常的过滤器
    for (const filter of filters) {
      try {
        const result = await filter.catch(exception, host);
        if (result && result instanceof Response) {
          return result;
        }
      } catch (filterError) {
        console.error("异常过滤器执行失败:", filterError);
      }
    }

    // 如果没有过滤器处理，使用默认过滤器
    const defaultFilter = new DefaultExceptionFilter();
    const result = await defaultFilter.catch(exception, host);
    if (result instanceof Response) {
      return result;
    }

    // 最后的兜底响应
    return new Response(
      JSON.stringify({
        statusCode: 500,
        message: "Internal Server Error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * 常用的HTTP异常类
 */
export class BadRequestException extends HttpException {
  constructor(message = "请求参数错误") {
    super(message, 400);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "资源未找到") {
    super(message, 404);
  }
}

export class ConflictException extends HttpException {
  constructor(message = "资源冲突") {
    super(message, 409);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message = "内部服务器错误") {
    super(message, 500);
  }
}
