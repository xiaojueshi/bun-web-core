import { Application } from "../application/application";
import type { ApplicationOptions } from "../application/application";

/**
 * 应用程序工厂类
 */
export class ApplicationFactory {
  /**
   * 创建应用程序实例
   * @param AppModule 根模块
   * @param options 应用程序选项
   */
  static create(AppModule: any, options?: ApplicationOptions): Application {
    return new Application(AppModule, options);
  }
}
