import "reflect-metadata";
import type { ExceptionFilter, ArgumentsHost } from "./exception.filter";
import { ValidationException } from "../pipes/validation.pipe";

/**
 * 验证异常过滤器
 *
 * 专门用于处理 ValidationPipe 抛出的验证异常
 * 支持多种异常类型的处理
 *
 * @example
 * ```typescript
 * // 在控制器中使用
 * @UseFilters(ValidationExceptionFilter)
 * @Post('/users')
 * async createUser(@Body() dto: CreateUserDto) {
 *   // ...
 * }
 * ```
 */
export class ValidationExceptionFilter implements ExceptionFilter {
  /**
   * 捕获验证异常
   * @param exception 异常对象
   * @param host 参数主机对象
   */
  catch(exception: any, host: ArgumentsHost): Response {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const url = new URL(request.url);

    console.error("🚫 验证异常:", exception.message);

    // 处理验证异常
    if (exception instanceof ValidationException) {
      console.error("📋 验证错误详情:", exception.errors);

      const formattedErrors = this.formatValidationErrors(exception.errors);

      return new Response(
        JSON.stringify({
          statusCode: 400,
          error: "Validation Error",
          message: "输入数据验证失败",
          timestamp: new Date().toISOString(),
          path: url.pathname,
          errors: formattedErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 处理其他类型的异常
    const status = exception.statusCode || exception.status || 500;
    const message = exception.message || "Internal Server Error";

    return new Response(
      JSON.stringify({
        statusCode: status,
        error: exception.name || "Error",
        message: message,
        timestamp: new Date().toISOString(),
        path: url.pathname,
      }),
      {
        status: status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  /**
   * 格式化验证错误
   * @param errors 验证错误数组
   * @returns 格式化后的错误对象
   */
  private formatValidationErrors(errors: any[]): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    const processError = (error: any, parentPath = ""): void => {
      const currentPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints) {
        formatted[currentPath] = Object.values(error.constraints) as string[];
      }

      if (error.children && error.children.length > 0) {
        error.children.forEach((child: any) =>
          processError(child, currentPath)
        );
      }
    };

    errors.forEach((error) => processError(error));
    return formatted;
  }
}
