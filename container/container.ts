import "reflect-metadata";

/**
 * 依赖注入容器
 */
export class Container {
  private static instance: Container;
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();

  /**
   * 获取容器单例
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * 注册服务
   * @param token 服务标识
   * @param target 服务类
   */
  register<T>(token: string, target: new (...args: any[]) => T): void {
    this.services.set(token, target);
  }

  /**
   * 解析服务
   * @param token 服务标识或类构造函数
   */
  resolve<T>(token: string | (new (...args: any[]) => T)): T {
    const serviceToken = typeof token === "string" ? token : token.name;

    // 检查是否是单例
    const isInjectable =
      typeof token === "function" && Reflect.getMetadata("injectable", token);
    const scope =
      typeof token === "function"
        ? Reflect.getMetadata("scope", token)
        : "singleton";

    if (scope === "singleton" && this.singletons.has(serviceToken)) {
      return this.singletons.get(serviceToken);
    }

    const ServiceClass =
      typeof token === "string"
        ? this.services.get(token)
        : (token as new (...args: any[]) => T);

    if (!ServiceClass) {
      throw new Error(`服务 ${serviceToken} 未找到`);
    }

    // 获取构造函数参数类型
    const paramTypes =
      Reflect.getMetadata("design:paramtypes", ServiceClass) || [];

    // 递归解析依赖
    const dependencies = paramTypes.map((paramType: any) => {
      if (
        paramType === String ||
        paramType === Number ||
        paramType === Boolean
      ) {
        return undefined;
      }
      return this.resolve(paramType);
    });

    const instance = new ServiceClass(...dependencies);

    // 如果是单例，缓存实例
    if (scope === "singleton") {
      this.singletons.set(serviceToken, instance);
    }

    return instance;
  }

  /**
   * 清除所有服务
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }
}
