import "reflect-metadata";

/**
 * HTTP 方法类型
 */
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

/**
 * 路由元数据接口
 */
export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  methodName: string;
}

/**
 * 创建 HTTP 方法装饰器的工厂函数
 */
function createMethodDecorator(method: HttpMethod) {
  return function (path: string = ""): MethodDecorator {
    return function (
      target: any,
      propertyKey: string | symbol,
      descriptor: PropertyDescriptor
    ) {
      const routes: RouteMetadata[] =
        Reflect.getMetadata("routes", target.constructor) || [];
      routes.push({
        method,
        path,
        methodName: propertyKey as string,
      });
      Reflect.defineMetadata("routes", routes, target.constructor);
      return descriptor;
    };
  };
}

/**
 * GET 方法装饰器
 */
export const Get = createMethodDecorator("GET");

/**
 * POST 方法装饰器
 */
export const Post = createMethodDecorator("POST");

/**
 * PUT 方法装饰器
 */
export const Put = createMethodDecorator("PUT");

/**
 * DELETE 方法装饰器
 */
export const Delete = createMethodDecorator("DELETE");

/**
 * PATCH 方法装饰器
 */
export const Patch = createMethodDecorator("PATCH");
