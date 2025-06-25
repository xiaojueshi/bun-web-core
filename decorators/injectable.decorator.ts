import "reflect-metadata";

/**
 * 用于标记可注入的类的装饰器
 * @param options 可选配置参数
 */
export function Injectable(options?: {
  scope?: "singleton" | "transient";
}): ClassDecorator {
  return function <T extends Function>(target: T): T {
    Reflect.defineMetadata("injectable", true, target);
    Reflect.defineMetadata("scope", options?.scope || "singleton", target);
    return target;
  };
}
