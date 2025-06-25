import "reflect-metadata";

/**
 * 用于标记控制器类的装饰器
 * @param prefix 路由前缀
 */
export function Controller(prefix: string = ""): ClassDecorator {
  return function <T extends Function>(target: T): T {
    Reflect.defineMetadata("controller", true, target);
    Reflect.defineMetadata("path", prefix, target);
    return target;
  };
}
