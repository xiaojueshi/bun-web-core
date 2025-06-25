import "reflect-metadata";
import type { ExecutionContext } from "../decorators/param.decorator";

/**
 * 守卫接口 - 用于实现权限控制和访问验证
 */
export interface CanActivate {
  /**
   * 确定是否可以激活路由
   * @param context 执行上下文
   * @returns 布尔值或Promise<布尔值>，true表示允许访问，false表示拒绝访问
   */
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean>;
}

/**
 * 守卫元数据接口
 */
export interface GuardMetadata {
  /** 守卫类 */
  guard: new (...args: any[]) => CanActivate;
  /** 应用范围 */
  scope: "method" | "controller" | "global";
}

/**
 * Observable 接口定义（简化版）
 */
export interface Observable<T> {
  subscribe(observer: {
    next?: (value: T) => void;
    error?: (error: any) => void;
    complete?: () => void;
  }): { unsubscribe: () => void };
}

/**
 * 执行上下文实现类
 */
export class HttpExecutionContext implements ExecutionContext {
  constructor(
    private request: any,
    private response: any,
    private handler: Function,
    private targetClass: any
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

  getClass(): any {
    return this.targetClass;
  }
}

/**
 * 守卫验证结果接口
 */
export interface GuardResult {
  /** 是否允许访问 */
  canActivate: boolean;
  /** 错误信息（如果验证失败） */
  error?: Error;
}

/**
 * 守卫执行器类 - 负责执行所有守卫的验证逻辑
 */
export class GuardExecutor {
  /**
   * 执行守卫验证
   * @param guards 守卫数组
   * @param context 执行上下文
   * @returns 守卫验证结果
   */
  static async canActivate(
    guards: CanActivate[],
    context: ExecutionContext
  ): Promise<GuardResult> {
    for (const guard of guards) {
      try {
        const result = await guard.canActivate(context);

        // 处理 Observable 类型的返回值
        if (this.isObservable(result)) {
          const observableResult = await this.fromObservable(result);
          if (!observableResult) {
            return {
              canActivate: false,
              error: new Error("守卫验证失败"),
            };
          }
        } else if (!result) {
          return {
            canActivate: false,
            error: new Error("守卫验证失败"),
          };
        }
      } catch (error) {
        console.error("守卫执行错误:", error);
        return {
          canActivate: false,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    }
    return { canActivate: true };
  }

  /**
   * 检查是否为 Observable
   */
  private static isObservable(obj: any): obj is Observable<boolean> {
    return obj && typeof obj.subscribe === "function";
  }

  /**
   * 将 Observable 转换为 Promise
   */
  private static fromObservable(
    observable: Observable<boolean>
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const subscription = observable.subscribe({
        next: (value) => {
          subscription.unsubscribe();
          resolve(value);
        },
        error: (error) => {
          subscription.unsubscribe();
          reject(error);
        },
        complete: () => {
          subscription.unsubscribe();
          resolve(false);
        },
      });
    });
  }
}

/**
 * 异常基类
 */
export class HttpException extends Error {
  constructor(
    public override readonly message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * 未授权异常
 */
export class UnauthorizedException extends HttpException {
  constructor(message = "未授权访问") {
    super(message, 401);
  }
}

/**
 * 禁止访问异常
 */
export class ForbiddenException extends HttpException {
  constructor(message = "禁止访问") {
    super(message, 403);
  }
}
