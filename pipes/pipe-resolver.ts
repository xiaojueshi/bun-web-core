import "reflect-metadata";
import type { Container } from "../container/container";
import type { PipeTransform } from "./pipe.interface";

/**
 * 支持的全局管道工厂类型
 * - 管道类（构造函数）
 * - 管道实例
 * - 工厂函数（同步/异步，支持闭包参数）
 */
export type PipeFactory =
  | PipeTransform
  | (new (...args: any[]) => PipeTransform)
  | (() => PipeTransform | Promise<PipeTransform>);

/**
 * 管道解析器类
 *
 * 负责管理全局管道和局部管道的注册、解析和执行
 */
export class PipeResolver {
  private static globalPipes: (() => PipeTransform | Promise<PipeTransform>)[] =
    [];
  private static globalContainer: Container | null = null;

  /**
   * 设置全局管道
   * @param pipes 支持管道类、实例、工厂函数
   * @param container 依赖注入容器
   */
  static setGlobalPipes(pipes: PipeFactory[], container: Container): void {
    // 类型校验与工厂函数转换，所有类型都包装为工厂函数
    const factories: (() => PipeTransform | Promise<PipeTransform>)[] =
      pipes.map((pipe) => {
        // 管道类（构造函数）
        if (
          typeof pipe === "function" &&
          pipe.prototype &&
          typeof pipe.prototype.transform === "function"
        ) {
          return () => {
            try {
              return container.resolve(
                pipe as new (...args: any[]) => PipeTransform
              );
            } catch {
              return new (pipe as new (...args: any[]) => PipeTransform)();
            }
          };
        }
        // 工厂函数（不带 prototype）
        if (typeof pipe === "function") {
          return pipe as () => PipeTransform | Promise<PipeTransform>;
        }
        // 实例
        if (pipe && typeof pipe.transform === "function") {
          return () => pipe;
        }
        throw new Error("useGlobalPipes 仅支持管道类、管道实例或工厂函数");
      });
    this.globalPipes = factories;
    this.globalContainer = container;
  }

  /**
   * 获取全局管道实例（支持异步工厂函数）
   * @param container 依赖注入容器
   * @returns Promise<PipeTransform[]> 全部管道实例
   */
  static async getGlobalPipes(container: Container): Promise<PipeTransform[]> {
    const factories: (() => PipeTransform | Promise<PipeTransform>)[] =
      this.globalPipes || [];
    const pipes = await Promise.all(
      factories.map(async (factory) => {
        const result = factory();
        return result instanceof Promise ? await result : result;
      })
    );
    return pipes;
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
