import "reflect-metadata";
import type { CanActivate } from "../guards/guard.interface";

/**
 * 守卫构造函数类型
 */
export type GuardClass = new (...args: any[]) => CanActivate;

/**
 * UseGuards 装饰器 - 用于应用守卫到控制器或方法
 * @param guards 守卫类数组
 */
export function UseGuards(
  ...guards: GuardClass[]
): ClassDecorator & MethodDecorator {
  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) {
    if (propertyKey && descriptor) {
      // 方法装饰器
      const existingGuards: GuardClass[] =
        Reflect.getMetadata("guards", target, propertyKey) || [];
      const allGuards = [...existingGuards, ...guards];
      Reflect.defineMetadata("guards", allGuards, target, propertyKey);
    } else {
      // 类装饰器
      const existingGuards: GuardClass[] =
        Reflect.getMetadata("guards", target) || [];
      const allGuards = [...existingGuards, ...guards];
      Reflect.defineMetadata("guards", allGuards, target);
    }
  };
}

/**
 * 守卫解析器类 - 负责解析和创建守卫实例
 */
export class GuardResolver {
  /**
   * 解析控制器和方法的守卫
   * @param controllerClass 控制器类
   * @param methodName 方法名
   * @param container 依赖注入容器
   */
  static resolveGuards(
    controllerClass: any,
    methodName: string,
    container: any
  ): CanActivate[] {
    const guards: CanActivate[] = [];

    // 获取控制器级别的守卫
    const controllerGuards: GuardClass[] =
      Reflect.getMetadata("guards", controllerClass) || [];

    // 获取方法级别的守卫
    const methodGuards: GuardClass[] =
      Reflect.getMetadata("guards", controllerClass.prototype, methodName) ||
      [];

    // 合并守卫（控制器守卫在前，方法守卫在后）
    const allGuardClasses = [...controllerGuards, ...methodGuards];

    // 创建守卫实例
    for (const GuardClass of allGuardClasses) {
      try {
        // 尝试从容器中解析守卫
        let guardInstance: CanActivate;
        try {
          guardInstance = container.resolve(GuardClass);
        } catch {
          // 如果容器中没有，直接创建实例
          guardInstance = new GuardClass();
        }
        guards.push(guardInstance);
      } catch (error) {
        console.error(`创建守卫实例失败: ${GuardClass.name}`, error);
      }
    }

    return guards;
  }

  /**
   * 获取全局守卫
   * @param container 依赖注入容器
   */
  static getGlobalGuards(container: any): CanActivate[] {
    const globalGuards: GuardClass[] =
      Reflect.getMetadata("global:guards", container) || [];

    return globalGuards.map((GuardClass) => {
      try {
        return container.resolve(GuardClass);
      } catch {
        return new GuardClass();
      }
    });
  }

  /**
   * 设置全局守卫
   * @param guards 守卫类数组
   * @param container 依赖注入容器
   */
  static setGlobalGuards(guards: GuardClass[], container: any): void {
    Reflect.defineMetadata("global:guards", guards, container);
  }
}
