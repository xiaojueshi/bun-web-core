import "reflect-metadata";
import type { ExceptionFilter } from "../filters/exception.filter";

/**
 * 异常过滤器构造函数类型
 */
export type ExceptionFilterClass = new (...args: any[]) => ExceptionFilter;

/**
 * @Catch 装饰器 - 标记异常过滤器要捕获的异常类型
 * @param exceptions 异常类型数组
 */
export function Catch(
  ...exceptions: (new (...args: any[]) => any)[]
): ClassDecorator {
  return function <T extends Function>(target: T): T {
    Reflect.defineMetadata("catch:exceptions", exceptions, target);
    return target;
  };
}

/**
 * @UseFilters 装饰器 - 用于应用异常过滤器到控制器或方法
 * @param filters 异常过滤器类数组或实例数组
 */
export function UseFilters(
  ...filters: (ExceptionFilterClass | ExceptionFilter)[]
): ClassDecorator & MethodDecorator {
  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) {
    if (propertyKey && descriptor) {
      // 方法装饰器
      const existingFilters: (ExceptionFilterClass | ExceptionFilter)[] =
        Reflect.getMetadata("filters", target, propertyKey) || [];
      const allFilters = [...existingFilters, ...filters];
      Reflect.defineMetadata("filters", allFilters, target, propertyKey);
    } else {
      // 类装饰器
      const existingFilters: (ExceptionFilterClass | ExceptionFilter)[] =
        Reflect.getMetadata("filters", target) || [];
      const allFilters = [...existingFilters, ...filters];
      Reflect.defineMetadata("filters", allFilters, target);
    }
  };
}

/**
 * 异常过滤器解析器类 - 负责解析和创建异常过滤器实例
 */
export class FilterResolver {
  /**
   * 解析控制器和方法的异常过滤器
   * @param controllerClass 控制器类
   * @param methodName 方法名
   * @param container 依赖注入容器
   */
  static resolveFilters(
    controllerClass: any,
    methodName: string,
    container: any
  ): ExceptionFilter[] {
    const filters: ExceptionFilter[] = [];

    // 获取控制器级别的过滤器
    const controllerFilters: (ExceptionFilterClass | ExceptionFilter)[] =
      Reflect.getMetadata("filters", controllerClass) || [];

    // 获取方法级别的过滤器
    const methodFilters: (ExceptionFilterClass | ExceptionFilter)[] =
      Reflect.getMetadata("filters", controllerClass.prototype, methodName) ||
      [];

    // 合并过滤器（控制器过滤器在前，方法过滤器在后）
    const allFilterDefs = [...controllerFilters, ...methodFilters];

    // 创建过滤器实例
    for (const filterDef of allFilterDefs) {
      try {
        let filterInstance: ExceptionFilter;

        if (typeof filterDef === "function") {
          // 过滤器类，需要实例化
          try {
            filterInstance = container.resolve(filterDef);
          } catch {
            // 如果容器中没有，直接创建实例
            filterInstance = new filterDef();
          }
        } else {
          // 已经是实例
          filterInstance = filterDef;
        }

        filters.push(filterInstance);
      } catch (error) {
        console.error(`创建异常过滤器实例失败:`, error);
      }
    }

    return filters;
  }

  /**
   * 获取全局异常过滤器
   * @param container 依赖注入容器
   */
  static getGlobalFilters(container: any): ExceptionFilter[] {
    const globalFilters: (ExceptionFilterClass | ExceptionFilter)[] =
      Reflect.getMetadata("global:filters", container) || [];

    return globalFilters.map((filterDef) => {
      if (typeof filterDef === "function") {
        try {
          return container.resolve(filterDef);
        } catch {
          return new filterDef();
        }
      } else {
        return filterDef;
      }
    });
  }

  /**
   * 设置全局异常过滤器
   * @param filters 过滤器类或实例数组
   * @param container 依赖注入容器
   */
  static setGlobalFilters(
    filters: (ExceptionFilterClass | ExceptionFilter)[],
    container: any
  ): void {
    Reflect.defineMetadata("global:filters", filters, container);
  }

  /**
   * 检查过滤器是否能处理指定异常
   * @param filter 过滤器实例
   * @param exception 异常对象
   */
  static canHandle(filter: ExceptionFilter, exception: any): boolean {
    const filterClass = filter.constructor;
    const caughtExceptions =
      Reflect.getMetadata("catch:exceptions", filterClass) || [];

    // 如果没有指定捕获的异常类型，则可以处理所有异常
    if (caughtExceptions.length === 0) {
      return true;
    }

    // 检查异常是否匹配任何指定的异常类型
    return caughtExceptions.some((ExceptionClass: any) => {
      return (
        exception instanceof ExceptionClass ||
        exception.constructor === ExceptionClass
      );
    });
  }
}
