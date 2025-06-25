import "reflect-metadata";

/**
 * 模块配置接口
 */
export interface ModuleMetadata {
  /** 导入的模块 */
  imports?: any[];
  /** 控制器 */
  controllers?: any[];
  /** 提供者（服务） */
  providers?: any[];
  /** 导出的提供者 */
  exports?: any[];
}

/**
 * 用于标记模块类的装饰器
 * @param metadata 模块元数据
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return function <T extends Function>(target: T): T {
    Reflect.defineMetadata("module", true, target);
    Reflect.defineMetadata("imports", metadata.imports || [], target);
    Reflect.defineMetadata("controllers", metadata.controllers || [], target);
    Reflect.defineMetadata("providers", metadata.providers || [], target);
    Reflect.defineMetadata("exports", metadata.exports || [], target);
    return target;
  };
}
