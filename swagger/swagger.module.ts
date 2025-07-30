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
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #app {
      height: 100vh;
      width: 100vw;
    }
  </style>
</head>
<body>
  <div id="app"></div>

  <!-- Load the Scalar API Reference Script -->
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

  <!-- Initialize the Scalar API Reference -->
  <script>
    Scalar.createApiReference('#app', {
      url: '/docs-json'
    });
  </script>
</body>
</html>`;
  }
}
