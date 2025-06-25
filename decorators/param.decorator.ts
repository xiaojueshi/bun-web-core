import "reflect-metadata";
import { PipeResolver } from "../pipes/pipe-resolver";
import type { ArgumentMetadata } from "../pipes/pipe.interface";

/**
 * 参数装饰器类型
 */
export enum ParamType {
  PARAM = "param",
  QUERY = "query",
  BODY = "body",
  HEADERS = "headers",
  REQUEST = "request",
  RESPONSE = "response",
}

/**
 * 参数元数据接口
 */
export interface ParamMetadata {
  /** 参数索引 */
  index: number;
  /** 参数类型 */
  type: ParamType;
  /** 参数键名 */
  key?: string;
  /** 管道数组 */
  pipes?: any[];
}

/**
 * 执行上下文接口
 */
export interface ExecutionContext {
  /** 获取请求对象 */
  getRequest(): any;
  /** 获取响应对象 */
  getResponse(): any;
  /** 获取处理器 */
  getHandler(): Function;
  /** 获取类 */
  getClass(): any;
}

/**
 * 创建参数装饰器的工厂函数
 */
function createParamDecorator(
  type: ParamType,
  key?: string
): ParameterDecorator {
  return function (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    if (!propertyKey) return;

    const propertyKeyStr = String(propertyKey);
    const existingParams: ParamMetadata[] =
      Reflect.getMetadata("params", target, propertyKeyStr) || [];

    existingParams.push({
      index: parameterIndex,
      type,
      key,
    });

    Reflect.defineMetadata("params", existingParams, target, propertyKeyStr);
  };
}

/**
 * @Param 装饰器 - 获取路径参数
 * @param key 参数名，如果不提供则返回所有参数
 */
export function Param(key?: string): ParameterDecorator {
  return createParamDecorator(ParamType.PARAM, key);
}

/**
 * @Query 装饰器 - 获取查询参数
 * @param key 参数名，如果不提供则返回所有查询参数
 */
export function Query(key?: string): ParameterDecorator {
  return createParamDecorator(ParamType.QUERY, key);
}

/**
 * @Body 装饰器 - 获取请求体
 * @param key 属性名，如果不提供则返回整个请求体
 */
export function Body(key?: string): ParameterDecorator {
  return createParamDecorator(ParamType.BODY, key);
}

/**
 * @Headers 装饰器 - 获取请求头
 * @param key 头部名称，如果不提供则返回所有头部
 */
export function Headers(key?: string): ParameterDecorator {
  return createParamDecorator(ParamType.HEADERS, key);
}

/**
 * @Req 装饰器 - 获取原始请求对象
 */
export function Req(): ParameterDecorator {
  return createParamDecorator(ParamType.REQUEST);
}

/**
 * @Request 装饰器 - @Req 的别名
 */
export const Request = Req;

/**
 * @Res 装饰器 - 获取原始响应对象
 */
export function Res(): ParameterDecorator {
  return createParamDecorator(ParamType.RESPONSE);
}

/**
 * @Response 装饰器 - @Res 的别名
 */
export const Response = Res;

/**
 * 参数解析器类 - 处理参数装饰器的解析逻辑
 */
export class ParamResolver {
  /**
   * 解析方法参数
   * @param target 目标类
   * @param methodName 方法名
   * @param request 请求对象
   * @param container 依赖注入容器
   */
  static async resolveParams(
    target: any,
    methodName: string,
    request: any,
    container?: any
  ): Promise<any[]> {
    const params: ParamMetadata[] =
      Reflect.getMetadata("params", target, methodName) || [];

    const paramTypes =
      Reflect.getMetadata("design:paramtypes", target, methodName) || [];
    const resolvedParams: any[] = new Array(paramTypes.length);

    // 解析 URL 参数
    const url = new URL(request.url);
    const pathParams = this.extractPathParams(url.pathname, request);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // 解析请求体
    let body: any = null;
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      try {
        const contentType = request.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          body = await request.json();
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          const formData = await request.formData();
          body = Object.fromEntries(formData.entries());
        }
      } catch (error) {
        console.warn("解析请求体失败:", error);
      }
    }

    // 处理参数装饰器
    for (const param of params) {
      let value: any;

      switch (param.type) {
        case ParamType.PARAM:
          value = param.key ? pathParams[param.key] : pathParams;
          break;
        case ParamType.QUERY:
          value = param.key ? queryParams[param.key] : queryParams;
          break;
        case ParamType.BODY:
          value = param.key && body ? body[param.key] : body;
          break;
        case ParamType.HEADERS:
          const headers = Object.fromEntries(request.headers.entries());
          value = param.key ? headers[param.key.toLowerCase()] : headers;
          break;
        case ParamType.REQUEST:
          value = request;
          break;
        case ParamType.RESPONSE:
          value = this.createResponseProxy();
          break;
        default:
          value = undefined;
      }

      // 如果有容器，执行管道转换
      if (container) {
        const transformedValue = await this.executeParameterPipes(
          value,
          target,
          methodName,
          param,
          paramTypes[param.index],
          container
        );
        resolvedParams[param.index] = transformedValue;
      } else {
        resolvedParams[param.index] = value;
      }
    }

    // 填充未被装饰器处理的参数（保持向后兼容）
    for (let i = 0; i < paramTypes.length; i++) {
      if (resolvedParams[i] === undefined) {
        // 如果没有参数装饰器，默认传入请求对象（向后兼容）
        resolvedParams[i] = request;
      }
    }

    return resolvedParams;
  }

  /**
   * 从路径中提取参数
   */
  private static extractPathParams(
    pathname: string,
    request: any
  ): Record<string, string> {
    // 如果请求对象已经包含路由参数，直接使用
    if ((request as any).params) {
      return (request as any).params;
    }

    // 备用方案：简化实现
    const params: Record<string, string> = {};
    const pathSegments = pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];

    // 如果最后一个段是数字，可能是 ID
    if (lastSegment && /^\d+$/.test(lastSegment)) {
      params.id = lastSegment;
    }

    return params;
  }

  /**
   * 执行参数管道转换
   */
  private static async executeParameterPipes(
    value: any,
    target: any,
    methodName: string,
    param: ParamMetadata,
    paramType: any,
    container: any
  ): Promise<any> {
    // 获取全局管道
    const globalPipes = PipeResolver.getGlobalPipes(container);

    // 获取参数级别的管道
    const parameterPipes = PipeResolver.resolveParameterPipes(
      target,
      methodName,
      param.index,
      container
    );

    // 获取方法级别的管道
    const methodPipes = PipeResolver.resolvePipes(
      target,
      methodName,
      container
    );

    // 合并所有管道：全局 -> 方法 -> 参数
    const allPipes = [...globalPipes, ...methodPipes, ...parameterPipes];

    if (allPipes.length === 0) {
      return value;
    }

    // 创建参数元数据
    const metadata: ArgumentMetadata = {
      type: param.type as any,
      metatype: paramType,
      data: param.key,
    };

    // 执行管道转换
    return PipeResolver.executePipes(value, allPipes, metadata);
  }

  /**
   * 创建响应代理对象
   */
  private static createResponseProxy(): any {
    return {
      status: (code: number) => ({ code }),
      json: (data: any) => {
        return {
          type: "response",
          status: 200,
          headers: { "Content-Type": "application/json" },
          data: JSON.stringify(data),
        };
      },
      send: (data: any) => {
        return {
          type: "response",
          status: 200,
          data: data ? String(data) : "",
        };
      },
    };
  }
}
