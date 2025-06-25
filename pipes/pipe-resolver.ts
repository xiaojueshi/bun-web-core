import "reflect-metadata";
import type { Container } from "../container/container";
import type { PipeTransform } from "./pipe.interface";

/**
 * 管道解析器类
 *
 * 负责管理全局管道和局部管道的注册、解析和执行
 */
export class PipeResolver {
  private static globalPipes: (
    | PipeTransform
    | (new (...args: any[]) => PipeTransform)
  )[] = [];
  private static globalContainer: Container | null = null;

  /**
   * 设置全局管道
   * @param pipes 管道类或实例数组
   * @param container 依赖注入容器
   */
  static setGlobalPipes(
    pipes: (PipeTransform | (new (...args: any[]) => PipeTransform))[],
    container: Container
  ): void {
    this.globalPipes = pipes;
    this.globalContainer = container;
  }

  /**
   * 获取全局管道实例
   * @param container 依赖注入容器
   * @returns 管道实例数组
   */
  static getGlobalPipes(container: Container): PipeTransform[] {
    return this.createPipeInstances(this.globalPipes, container);
  }

  /**
   * 解析方法级别的管道
   * @param target 目标类
   * @param methodName 方法名
   * @param container 依赖注入容器
   * @returns 管道实例数组
   */
  static resolvePipes(
    target: any,
    methodName: string,
    container: Container
  ): PipeTransform[] {
    const methodPipes = Reflect.getMetadata("pipes", target, methodName) || [];
    const classPipes = Reflect.getMetadata("pipes", target) || [];

    const localPipes = [...classPipes, ...methodPipes];
    return this.createPipeInstances(localPipes, container);
  }

  /**
   * 解析参数级别的管道
   * @param target 目标类
   * @param methodName 方法名
   * @param parameterIndex 参数索引
   * @param container 依赖注入容器
   * @returns 管道实例数组
   */
  static resolveParameterPipes(
    target: any,
    methodName: string,
    parameterIndex: number,
    container: Container
  ): PipeTransform[] {
    const paramPipes =
      Reflect.getMetadata("param-pipes", target, methodName) || {};
    const pipes = paramPipes[parameterIndex] || [];

    return this.createPipeInstances(pipes, container);
  }

  /**
   * 创建管道实例
   * @param pipeDefs 管道定义数组
   * @param container 依赖注入容器
   * @returns 管道实例数组
   */
  private static createPipeInstances(
    pipeDefs: (PipeTransform | (new (...args: any[]) => PipeTransform))[],
    container: Container
  ): PipeTransform[] {
    return pipeDefs.map((pipeDef) => {
      if (typeof pipeDef === "function") {
        // 管道类，需要实例化
        try {
          return container.resolve(pipeDef);
        } catch {
          return new pipeDef();
        }
      } else {
        // 已经是实例
        return pipeDef;
      }
    });
  }

  /**
   * 执行管道转换
   * @param value 原始值
   * @param pipes 管道数组
   * @param metadata 参数元数据
   * @returns 转换后的值
   */
  static async executePipes(
    value: any,
    pipes: PipeTransform[],
    metadata: any
  ): Promise<any> {
    let transformedValue = value;

    for (const pipe of pipes) {
      try {
        transformedValue = await pipe.transform(transformedValue, metadata);
      } catch (error) {
        console.error("管道执行错误:", error);
        throw error;
      }
    }

    return transformedValue;
  }
}
