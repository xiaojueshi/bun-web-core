import "reflect-metadata";

/**
 * 可观察对象接口（简化版）
 */
export interface Observable<T> {
  subscribe(observer: {
    next?: (value: T) => void;
    error?: (error: any) => void;
    complete?: () => void;
  }): { unsubscribe: () => void };
}

/**
 * 调用处理器接口
 */
export interface CallHandler<T = any> {
  /**
   * 处理调用并返回可观察对象
   */
  handle(): Observable<T>;
}

/**
 * 执行上下文接口
 */
export interface ExecutionContext {
  /**
   * 获取处理器类
   */
  getClass(): any;

  /**
   * 获取处理器方法
   */
  getHandler(): Function;

  /**
   * 获取请求对象
   */
  getRequest?(): any;

  /**
   * 获取响应对象
   */
  getResponse?(): any;
}

/**
 * 拦截器接口
 */
export interface NestInterceptor<T = any, R = any> {
  /**
   * 拦截方法执行
   * @param context 执行上下文
   * @param next 下一个调用处理器
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<R> | Promise<Observable<R>>;
}

/**
 * 简单的可观察对象实现
 */
export class SimpleObservable<T> implements Observable<T> {
  constructor(
    private subscriber: (observer: {
      next?: (value: T) => void;
      error?: (error: any) => void;
      complete?: () => void;
    }) => void
  ) {}

  subscribe(observer: {
    next?: (value: T) => void;
    error?: (error: any) => void;
    complete?: () => void;
  }): { unsubscribe: () => void } {
    let isUnsubscribed = false;

    try {
      this.subscriber({
        next: (value: T) => {
          if (!isUnsubscribed && observer.next) {
            observer.next(value);
          }
        },
        error: (error: any) => {
          if (!isUnsubscribed && observer.error) {
            observer.error(error);
          }
        },
        complete: () => {
          if (!isUnsubscribed && observer.complete) {
            observer.complete();
          }
        },
      });
    } catch (error) {
      if (!isUnsubscribed && observer.error) {
        observer.error(error);
      }
    }

    return {
      unsubscribe: () => {
        isUnsubscribed = true;
      },
    };
  }

  /**
   * 创建一个立即返回值的可观察对象
   */
  static of<T>(value: T): Observable<T> {
    return new SimpleObservable<T>((observer) => {
      if (observer.next) observer.next(value);
      if (observer.complete) observer.complete();
    });
  }

  /**
   * 创建一个从Promise转换的可观察对象
   */
  static fromPromise<T>(promise: Promise<T>): Observable<T> {
    return new SimpleObservable<T>((observer) => {
      promise
        .then((value) => {
          if (observer.next) observer.next(value);
          if (observer.complete) observer.complete();
        })
        .catch((error) => {
          if (observer.error) observer.error(error);
        });
    });
  }

  /**
   * 映射操作符
   */
  map<R>(mapper: (value: T) => R): Observable<R> {
    return new SimpleObservable<R>((observer) => {
      this.subscribe({
        next: (value) => {
          try {
            const mappedValue = mapper(value);
            if (observer.next) observer.next(mappedValue);
          } catch (error) {
            if (observer.error) observer.error(error);
          }
        },
        error: observer.error,
        complete: observer.complete,
      });
    });
  }

  /**
   * 捕获错误操作符
   */
  catchError<R>(
    errorHandler: (error: any) => Observable<R>
  ): Observable<T | R> {
    return new SimpleObservable<T | R>((observer) => {
      this.subscribe({
        next: observer.next,
        error: (error) => {
          try {
            const errorObservable = errorHandler(error);
            errorObservable.subscribe(observer);
          } catch (handlerError) {
            if (observer.error) observer.error(handlerError);
          }
        },
        complete: observer.complete,
      });
    });
  }
}

/**
 * 调用处理器实现
 */
export class CallHandlerImpl<T = any> implements CallHandler<T> {
  constructor(private handler: () => Promise<T> | T) {}

  handle(): Observable<T> {
    try {
      const result = this.handler();
      if (result instanceof Promise) {
        return SimpleObservable.fromPromise(result);
      } else {
        return SimpleObservable.of(result);
      }
    } catch (error) {
      return new SimpleObservable<T>((observer) => {
        if (observer.error) observer.error(error);
      });
    }
  }
}

/**
 * 执行上下文实现
 */
export class InterceptorExecutionContext implements ExecutionContext {
  constructor(
    private targetClass: any,
    private handler: Function,
    private request?: any,
    private response?: any
  ) {}

  getClass(): any {
    return this.targetClass;
  }

  getHandler(): Function {
    return this.handler;
  }

  getRequest(): any {
    return this.request;
  }

  getResponse(): any {
    return this.response;
  }
}

/**
 * 拦截器执行器
 */
export class InterceptorExecutor {
  /**
   * 执行拦截器链
   * @param interceptors 拦截器数组
   * @param context 执行上下文
   * @param handler 原始处理器
   */
  static async execute<T = any>(
    interceptors: NestInterceptor[],
    context: ExecutionContext,
    handler: () => Promise<T> | T
  ): Promise<T> {
    if (interceptors.length === 0) {
      return await handler();
    }

    let currentHandler = new CallHandlerImpl(handler);

    // 从最后一个拦截器开始，向前构建调用链
    for (let i = interceptors.length - 1; i >= 0; i--) {
      const interceptor = interceptors[i];
      if (!interceptor) continue;
      const nextHandler = currentHandler;

      currentHandler = new CallHandlerImpl(async () => {
        const observable = await interceptor.intercept(context, nextHandler);
        return this.observableToPromise(observable);
      });
    }

    return this.observableToPromise(currentHandler.handle());
  }

  /**
   * 将可观察对象转换为Promise
   */
  private static observableToPromise<T>(observable: Observable<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      let hasValue = false;
      let value: T;

      const subscription = observable.subscribe({
        next: (val) => {
          hasValue = true;
          value = val;
        },
        error: (error) => {
          subscription.unsubscribe();
          reject(error);
        },
        complete: () => {
          subscription.unsubscribe();
          if (hasValue) {
            resolve(value);
          } else {
            resolve(undefined as any);
          }
        },
      });
    });
  }
}

/**
 * 内置日志拦截器 - 记录方法执行时间和参数
 */
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const className = context.getClass().name;
    const methodName = context.getHandler().name;

    console.log(`🔍 [拦截器] ${className}.${methodName} - 开始执行`);

    const observable = next.handle();
    return new SimpleObservable<any>((observer) => {
      observable.subscribe({
        next: (data: any) => {
          const duration = Date.now() - start;
          console.log(
            `✅ [拦截器] ${className}.${methodName} - 执行完成 (+${duration}ms)`
          );
          if (observer.next) observer.next(data);
        },
        error: observer.error,
        complete: observer.complete,
      });
    });
  }
}

/**
 * 缓存拦截器 - 基于方法参数的简单缓存
 */
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number; // 缓存存活时间（毫秒）

  constructor(ttl: number = 60000) {
    // 默认1分钟
    this.ttl = ttl;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const request = context.getRequest?.();

    // 生成缓存键
    const cacheKey = this.generateCacheKey(className, methodName, request);

    // 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`💾 [缓存拦截器] 缓存命中: ${cacheKey}`);
      return SimpleObservable.of(cached.data);
    }

    // 执行原方法并缓存结果
    const observable = next.handle();
    return new SimpleObservable<any>((observer) => {
      observable.subscribe({
        next: (data: any) => {
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
          console.log(`💾 [缓存拦截器] 数据已缓存: ${cacheKey}`);
          if (observer.next) observer.next(data);
        },
        error: observer.error,
        complete: observer.complete,
      });
    });
  }

  private generateCacheKey(
    className: string,
    methodName: string,
    request?: any
  ): string {
    const baseKey = `${className}.${methodName}`;
    if (request?.url) {
      const url = new URL(request.url);
      return `${baseKey}:${url.pathname}${url.search}`;
    }
    return baseKey;
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log("💾 [缓存拦截器] 缓存已清空");
  }

  /**
   * 清除指定缓存
   */
  clearCacheByKey(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`💾 [缓存拦截器] 缓存已删除: ${key}`);
    }
    return deleted;
  }
}

/**
 * 转换拦截器 - 统一响应格式
 */
export class TransformInterceptor implements NestInterceptor<any, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const observable = next.handle();
    return new SimpleObservable<any>((observer) => {
      observable.subscribe({
        next: (data: any) => {
          // 如果数据已经是标准格式，直接返回
          if (data && typeof data === "object" && "success" in data) {
            if (observer.next) observer.next(data);
            return;
          }

          // 转换为标准响应格式
          const transformed = {
            success: true,
            data: data,
            timestamp: new Date().toISOString(),
            path: context.getRequest?.()?.url || "unknown",
          };
          if (observer.next) observer.next(transformed);
        },
        error: observer.error,
        complete: observer.complete,
      });
    });
  }
}
