import "reflect-metadata";
import type { NestInterceptor } from "../interceptors/interceptor.interface";

/**
 * 拦截器装饰器 - 用于在类或方法上应用拦截器
 * @param interceptors 拦截器类或实例数组
 */
export function UseInterceptors(
  ...interceptors: (new (...args: any[]) => NestInterceptor)[]
) {
  return function (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ) {
    if (propertyKey && descriptor) {
      // 方法级别的拦截器
      const existingInterceptors =
        Reflect.getMetadata("interceptors:method", target, propertyKey) || [];
      Reflect.defineMetadata(
        "interceptors:method",
        [...existingInterceptors, ...interceptors],
        target,
        propertyKey
      );
    } else {
      // 类级别的拦截器
      const existingInterceptors =
        Reflect.getMetadata("interceptors:class", target) || [];
      Reflect.defineMetadata(
        "interceptors:class",
        [...existingInterceptors, ...interceptors],
        target
      );
    }
  };
}

/**
 * 支持的全局拦截器工厂类型
 * - 拦截器类（构造函数）
 * - 拦截器实例
 * - 工厂函数（同步/异步，支持闭包参数）
 */
export type InterceptorFactory =
  | NestInterceptor
  | (new (...args: any[]) => NestInterceptor)
  | (() => NestInterceptor | Promise<NestInterceptor>);

/**
 * 拦截器解析器类
 */
export class InterceptorResolver {
  private static globalInterceptors: (() =>
    | NestInterceptor
    | Promise<NestInterceptor>)[] = [];

  /**
   * 设置全局拦截器
   * @param interceptors 支持拦截器类、实例、工厂函数
   * @param container 依赖注入容器
   */
  static setGlobalInterceptors(
    interceptors: InterceptorFactory[],
    container: any
  ): void {
    // 类型校验与工厂函数转换
    const factories = interceptors.map((interceptor) => {
      // 拦截器类
      if (
        typeof interceptor === "function" &&
        interceptor.prototype &&
        typeof interceptor.prototype.intercept === "function"
      ) {
        return () => {
          try {
            return container.resolve(interceptor);
          } catch {
            return new (interceptor as new (
              ...args: any[]
            ) => NestInterceptor)();
          }
        };
      }
      // 工厂函数
      if (typeof interceptor === "function") {
        return interceptor as () => NestInterceptor | Promise<NestInterceptor>;
      }
      // 实例
      if (interceptor && typeof interceptor.intercept === "function") {
        return () => interceptor;
      }
      throw new Error(
        "useGlobalInterceptors 仅支持拦截器类、拦截器实例或工厂函数"
      );
    });
    this.globalInterceptors = factories;
  }

  /**
   * 获取全局拦截器实例（支持异步工厂函数）
   * @param container 依赖注入容器
   * @returns Promise<NestInterceptor[]> 全部拦截器实例
   */
  static async getGlobalInterceptors(
    container: any
  ): Promise<NestInterceptor[]> {
    const factories: (() => NestInterceptor | Promise<NestInterceptor>)[] =
      this.globalInterceptors || [];
    const interceptors = await Promise.all(
      factories.map(async (factory) => {
        const result = factory();
        return result instanceof Promise ? await result : result;
      })
    );
    return interceptors;
  }

  /**
   * 解析拦截器
   * @param controllerClass 控制器类
   * @param methodName 方法名
   * @param container 依赖注入容器
   */
  static resolveInterceptors(
    controllerClass: any,
    methodName: string,
    container: any
  ): NestInterceptor[] {
    const interceptors: NestInterceptor[] = [];

    // 获取类级别的拦截器
    const classInterceptors: (new (...args: any[]) => NestInterceptor)[] =
      Reflect.getMetadata("interceptors:class", controllerClass) || [];

    // 获取方法级别的拦截器
    const methodInterceptors: (new (...args: any[]) => NestInterceptor)[] =
      Reflect.getMetadata(
        "interceptors:method",
        controllerClass.prototype,
        methodName
      ) || [];

    // 合并所有拦截器
    const allInterceptorClasses = [...classInterceptors, ...methodInterceptors];

    // 创建拦截器实例
    for (const InterceptorClass of allInterceptorClasses) {
      try {
        const interceptor = container.resolve(InterceptorClass);
        interceptors.push(interceptor);
      } catch {
        // 如果依赖注入失败，尝试直接实例化
        try {
          const interceptor = new InterceptorClass();
          interceptors.push(interceptor);
        } catch (error) {
          console.warn(`创建拦截器实例失败: ${InterceptorClass.name}`, error);
        }
      }
    }

    return interceptors;
  }
}

/**
 * 拦截器标记装饰器 - 用于标记一个类为拦截器
 */
export function Interceptor() {
  return function (target: any) {
    Reflect.defineMetadata("interceptor", true, target);
  };
}
