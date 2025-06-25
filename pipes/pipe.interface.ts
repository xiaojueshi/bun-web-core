import "reflect-metadata";

/**
 * 参数元数据接口 - 描述参数的类型和上下文信息
 */
export interface ArgumentMetadata {
  /** 参数类型 */
  type: "body" | "query" | "param" | "custom";
  /** 参数的元类型（构造函数） */
  metatype?: any;
  /** 参数的键名 */
  data?: string;
}

/**
 * 管道转换接口 - 所有管道都必须实现此接口
 *
 * @template T 输入类型
 * @template R 输出类型
 *
 * @example
 * ```typescript
 * export class MyPipe implements PipeTransform<string, number> {
 *   transform(value: string, metadata: ArgumentMetadata): number {
 *     return parseInt(value, 10);
 *   }
 * }
 * ```
 */
export interface PipeTransform<T = any, R = any> {
  /**
   * 转换方法 - 接收原始值并返回转换后的值
   * @param value 原始值
   * @param metadata 参数元数据
   * @returns 转换后的值
   */
  transform(value: T, metadata: ArgumentMetadata): R | Promise<R>;
}

/**
 * 管道元数据接口
 */
export interface PipeMetadata {
  /** 参数索引 */
  index: number;
  /** 管道实例或构造函数 */
  pipe: PipeTransform | (new (...args: any[]) => PipeTransform);
  /** 管道参数 */
  data?: any;
}

/**
 * 内置的解析整数管道
 *
 * @example
 * ```typescript
 * // 在控制器中使用
 * @Get('/:id')
 * getUser(@Param('id', ParseIntPipe) id: number) {
 *   return this.userService.findById(id);
 * }
 * ```
 */
export class ParseIntPipe implements PipeTransform<string, number> {
  constructor(
    private options?: {
      /** 是否可选 */
      optional?: boolean;
      /** 最小值 */
      min?: number;
      /** 最大值 */
      max?: number;
      /** 错误状态码 */
      errorHttpStatusCode?: number;
      /** 异常工厂函数 */
      exceptionFactory?: (error: string) => any;
    }
  ) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    if (
      this.options?.optional &&
      (value === undefined || value === null || value === "")
    ) {
      return 0; // 或者返回默认值
    }

    const val = parseInt(value, 10);

    if (isNaN(val)) {
      this.throwError(`参数 "${metadata.data || "unknown"}" 必须是整数`);
    }

    if (this.options?.min !== undefined && val < this.options.min) {
      this.throwError(
        `参数 "${metadata.data || "unknown"}" 不能小于 ${this.options.min}`
      );
    }

    if (this.options?.max !== undefined && val > this.options.max) {
      this.throwError(
        `参数 "${metadata.data || "unknown"}" 不能大于 ${this.options.max}`
      );
    }

    return val;
  }

  private throwError(message: string): never {
    if (this.options?.exceptionFactory) {
      throw this.options.exceptionFactory(message);
    }

    const { BadRequestException } = require("../filters/exception.filter");
    throw new BadRequestException(message);
  }
}

// 注意：PipeExecutor 已被 PipeResolver 替代，保留此类仅为向后兼容
/**
 * @deprecated 使用 PipeResolver 替代
 * 管道执行器 - 负责执行管道转换
 */
export class PipeExecutor {
  /**
   * @deprecated 使用 PipeResolver.executePipes 替代
   * 执行管道转换
   */
  static async execute(
    value: any,
    pipes: PipeTransform[],
    metadata: ArgumentMetadata
  ): Promise<any> {
    console.warn(
      "PipeExecutor.execute 已被弃用，请使用 PipeResolver.executePipes"
    );

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

  /**
   * @deprecated 使用 PipeResolver.createPipeInstances 替代
   * 从管道定义数组创建管道实例
   */
  static createPipeInstances(
    pipeDefs: (PipeTransform | (new (...args: any[]) => PipeTransform))[],
    container?: any
  ): PipeTransform[] {
    console.warn(
      "PipeExecutor.createPipeInstances 已被弃用，请使用 PipeResolver"
    );

    return pipeDefs.map((pipeDef) => {
      if (typeof pipeDef === "function") {
        // 管道类，需要实例化
        try {
          if (container) {
            return container.resolve(pipeDef);
          } else {
            return new pipeDef();
          }
        } catch {
          return new pipeDef();
        }
      } else {
        // 已经是实例
        return pipeDef;
      }
    });
  }
}
