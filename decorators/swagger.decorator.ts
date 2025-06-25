import "reflect-metadata";

/**
 * API 操作选项接口
 */
export interface ApiOperationOptions {
  /** 操作摘要 */
  summary?: string;
  /** 操作描述 */
  description?: string;
  /** 操作 ID */
  operationId?: string;
  /** 标签 */
  tags?: string[];
}

/**
 * API 响应选项接口
 */
export interface ApiResponseOptions {
  /** 状态码 */
  status: number;
  /** 描述 */
  description: string;
  /** 响应类型 */
  type?: any;
  /** 示例 */
  example?: any;
}

/**
 * API 参数选项接口
 */
export interface ApiParamOptions {
  /** 参数名称 */
  name: string;
  /** 参数描述 */
  description?: string;
  /** 参数类型 */
  type?: "string" | "number" | "boolean";
  /** 是否必需 */
  required?: boolean;
  /** 示例值 */
  example?: any;
}

/**
 * API 请求体选项接口
 */
export interface ApiBodyOptions {
  /** 描述 */
  description?: string;
  /** 请求体类型 */
  type?: any;
  /** 示例 */
  example?: any;
  /** 是否必需 */
  required?: boolean;
}

/**
 * API 标签选项接口
 */
export interface ApiTagsOptions {
  /** 标签名称 */
  name: string;
  /** 标签描述 */
  description?: string;
}

/**
 * API 操作装饰器 - 描述 API 端点
 */
export function ApiOperation(options: ApiOperationOptions): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const existingOperations =
      Reflect.getMetadata("swagger:operations", target.constructor) || {};
    existingOperations[propertyKey as string] = options;
    Reflect.defineMetadata(
      "swagger:operations",
      existingOperations,
      target.constructor
    );
    return descriptor;
  };
}

/**
 * API 响应装饰器 - 描述 API 响应
 */
export function ApiResponse(options: ApiResponseOptions): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const existingResponses =
      Reflect.getMetadata("swagger:responses", target.constructor) || {};
    if (!existingResponses[propertyKey as string]) {
      existingResponses[propertyKey as string] = [];
    }
    existingResponses[propertyKey as string].push(options);
    Reflect.defineMetadata(
      "swagger:responses",
      existingResponses,
      target.constructor
    );
    return descriptor;
  };
}

/**
 * API 参数装饰器 - 描述路径参数
 */
export function ApiParam(options: ApiParamOptions): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const existingParams =
      Reflect.getMetadata("swagger:params", target.constructor) || {};
    if (!existingParams[propertyKey as string]) {
      existingParams[propertyKey as string] = [];
    }
    existingParams[propertyKey as string].push(options);
    Reflect.defineMetadata(
      "swagger:params",
      existingParams,
      target.constructor
    );
    return descriptor;
  };
}

/**
 * API 请求体装饰器 - 描述请求体
 */
export function ApiBody(options: ApiBodyOptions): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const existingBodies =
      Reflect.getMetadata("swagger:bodies", target.constructor) || {};
    existingBodies[propertyKey as string] = options;
    Reflect.defineMetadata(
      "swagger:bodies",
      existingBodies,
      target.constructor
    );
    return descriptor;
  };
}

/**
 * API 标签装饰器 - 为控制器添加标签
 */
export function ApiTags(...tags: string[]): ClassDecorator {
  return function <T extends Function>(target: T): T {
    Reflect.defineMetadata("swagger:tags", tags, target);
    return target;
  };
}
