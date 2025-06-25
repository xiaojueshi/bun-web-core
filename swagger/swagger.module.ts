import { SwaggerGenerator } from "./swagger-generator";
import type { SwaggerConfig, OpenAPISpec } from "./swagger-generator";
import type { RouteInfo } from "../application/application";

/**
 * Swagger 模块 - 使用 Scalar UI
 */
export class SwaggerModule {
  /**
   * 设置 Swagger 文档
   * @param config Swagger 配置
   * @param routes 路由信息
   */
  static setup(
    config: SwaggerConfig,
    routes: RouteInfo[]
  ): {
    spec: OpenAPISpec;
    getSwaggerUI: () => string;
    getSwaggerSpec: () => string;
  } {
    const generator = new SwaggerGenerator(config);
    const spec = generator.generateSpec(routes);

    return {
      spec,
      getSwaggerUI: () => SwaggerModule.generateScalarUI(spec),
      getSwaggerSpec: () => JSON.stringify(spec, null, 2),
    };
  }

  /**
   * 生成 Scalar UI HTML - 更现代美观的 API 文档界面
   */
  private static generateScalarUI(spec: OpenAPISpec): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${spec.info.title}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <script
    id="api-reference"
    type="application/json">${JSON.stringify(spec, null, 2)}</script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
  }
}
