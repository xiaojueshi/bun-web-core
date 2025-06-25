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
 * 拦截器解析器类
 */
export class InterceptorResolver {
  private static globalInterceptors: (new (
    ...args: any[]
  ) => NestInterceptor)[] = [];

  /**
   * 设置全局拦截器
   * @param interceptors 拦截器类数组
   * @param container 依赖注入容器
   */
  static setGlobalInterceptors(
    interceptors: (new (...args: any[]) => NestInterceptor | NestInterceptor)[],
    container: any
  ): void {
    this.globalInterceptors = interceptors as (new (
      ...args: any[]
    ) => NestInterceptor)[];
  }

  /**
   * 获取全局拦截器实例
   * @param container 依赖注入容器
   */
  static getGlobalInterceptors(container: any): NestInterceptor[] {
    return this.globalInterceptors.map((InterceptorClass) => {
      try {
        return container.resolve(InterceptorClass);
      } catch {
        return new InterceptorClass();
      }
    });
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
