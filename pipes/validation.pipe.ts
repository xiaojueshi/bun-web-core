import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import type { PipeTransform, ArgumentMetadata } from "./pipe.interface";

/**
 * 验证选项配置
 */
export interface ValidationPipeOptions {
  /** 是否跳过缺失的属性 */
  skipMissingProperties?: boolean;
  /** 是否启用白名单过滤 */
  whitelist?: boolean;
  /** 是否在遇到非白名单属性时抛出异常 */
  forbidNonWhitelisted?: boolean;
  /** 是否禁止未知值 */
  forbidUnknownValues?: boolean;
  /** 是否拆解嵌套对象 */
  disableErrorMessages?: boolean;
  /** 错误消息工厂函数 */
  errorHttpStatusCode?: number;
  /** 异常工厂函数 */
  exceptionFactory?: (errors: ValidationError[]) => any;
  /** 自定义验证组 */
  groups?: string[];
  /** 是否总是验证 */
  always?: boolean;
  /** 是否严格验证 */
  strictGroups?: boolean;
  /** 是否排除外部值 */
  dismissDefaultMessages?: boolean;
  /** 验证上下文对象 */
  validationContext?: object;
  /** 是否停止在第一个错误 */
  stopAtFirstError?: boolean;
}

/**
 * 验证异常类
 */
export class ValidationException extends Error {
  constructor(
    public override readonly message: string,
    public readonly errors: ValidationError[]
  ) {
    super(message);
    this.name = "ValidationException";
  }
}

/**
 * 全局验证管道
 *
 * 使用 class-transformer 和 class-validator 进行数据转换和验证
 *
 * @example
 * ```typescript
 * // 在控制器中使用
 * @Post('/users')
 * async createUser(@Body() createUserDto: CreateUserDto) {
 *   return this.userService.create(createUserDto);
 * }
 * ```
 */
export class ValidationPipe implements PipeTransform<any> {
  private options: ValidationPipeOptions;

  constructor(options?: ValidationPipeOptions) {
    this.options = {
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      disableErrorMessages: false,
      errorHttpStatusCode: 400,
      stopAtFirstError: false,
      ...options,
    };
  }

  /**
   * 执行验证转换
   * @param value 待验证的值
   * @param metadata 参数元数据
   */
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    const { metatype } = metadata;

    // 如果没有元类型或者是基础类型，直接返回
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 仅对 body 参数进行验证
    if (metadata.type !== "body") {
      return value;
    }

    // 使用 class-transformer 进行转换
    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
    });

    // 使用 class-validator 进行验证
    const errors = await validate(object, {
      skipMissingProperties: this.options.skipMissingProperties,
      whitelist: this.options.whitelist,
      forbidNonWhitelisted: this.options.forbidNonWhitelisted,
      forbidUnknownValues: this.options.forbidUnknownValues,
      groups: this.options.groups,
      always: this.options.always,
      strictGroups: this.options.strictGroups,
      dismissDefaultMessages: this.options.dismissDefaultMessages,
      stopAtFirstError: this.options.stopAtFirstError,
    });

    if (errors.length > 0) {
      this.throwValidationException(errors);
    }

    return object;
  }

  /**
   * 判断是否需要验证的类型
   */
  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object, Buffer];
    return !types.includes(metatype);
  }

  /**
   * 抛出验证异常
   */
  private throwValidationException(errors: ValidationError[]): never {
    if (this.options.exceptionFactory) {
      throw this.options.exceptionFactory(errors);
    }

    const errorMessages = this.flattenValidationErrors(errors);
    const message = errorMessages.join(", ");

    throw new ValidationException(message, errors);
  }

  /**
   * 扁平化验证错误
   */
  private flattenValidationErrors(
    validationErrors: ValidationError[],
    parentPath = ""
  ): string[] {
    const messages: string[] = [];

    for (const error of validationErrors) {
      const currentPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints) {
        const constraintMessages = Object.values(error.constraints).map(
          (constraint) => `${currentPath}: ${constraint}`
        );
        messages.push(...constraintMessages);
      }

      if (error.children && error.children.length > 0) {
        const childMessages = this.flattenValidationErrors(
          error.children,
          currentPath
        );
        messages.push(...childMessages);
      }
    }

    return messages;
  }

  /**
   * 创建默认的异常工厂函数
   */
  static createExceptionFactory() {
    return (errors: ValidationError[]) => {
      const pipe = new ValidationPipe();
      return new ValidationException(
        pipe.flattenValidationErrors(errors).join(", "),
        errors
      );
    };
  }
}
