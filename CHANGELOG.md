# Changelog

所有值得注意的更改都会记录在此文件中。

本项目遵循[语义化版本控制](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 计划中的功能

- 添加更多装饰器支持
- 完善测试覆盖率
- 性能优化
- 文档完善

## [0.1.0-beta.6] - 2025-08-22

### ✨ 新增功能

- **路由系统增强**：
  - 实现通配符路由匹配功能，支持 `*` 和 `**` 通配符
  - `*` 匹配单个路径段（如 `/users/*` 匹配 `/users/123`）
  - `**` 匹配多个路径段（如 `/files/**` 匹配 `/files/path/to/file.txt`）
  - 支持参数和通配符组合使用（如 `/users/:id/*`）
  - 添加完整的测试用例覆盖各种通配符场景
  - 提供使用示例展示通配符路由功能

### 📚 文档完善

- 新增通配符路由使用示例 `examples/wildcard-routes-example.ts`

## [0.1.0-beta.5] - 2025-01-XX

### ✨ 新增功能

- **Swagger 文档生成优化**：
  - 改进方法名提取逻辑，优先使用路由信息中的方法名
  - 增强数组类型的 Schema 支持
  - 添加更多预定义类型的支持（ErrorResponse、ApiResponse）
  - 优化 Swagger UI 界面样式和初始化方式
- **应用功能增强**：
  - 新增 `getRoutes()` 方法，用于获取所有路由信息

### 📚 文档完善

- 新增 `docs/swagger-usage.md` 详细使用文档
- 新增 `examples/swagger-complete-example.ts` 完整示例代码
- 更新 README.md 中的项目名称引用

### 🔧 技术改进

- 优化 Swagger 生成器的类型推断逻辑
- 改进函数名提取算法，支持更多函数类型
- 增强 Swagger UI 的用户体验

## [0.1.0-beta.4] - 2025-07-15

### ✨ 新增功能

- 全局守卫、全局管道、全局拦截器均支持如下注册方式：
  - 传递类（自动依赖注入）
  - 传递实例
  - 工厂函数（可闭包传参/异步）
- 所有全局特性均支持异步工厂注册，极大提升灵活性
- 完善相关测试用例，覆盖所有注册方式和类型校验
- README 文档补充全局特性注册用法与最佳实践

## [0.1.0-beta.3] - 2024-XX-XX

### 🛠️ 变更

- 版本号统一升级为 0.1.0-beta.3

## [0.1.0-beta.1] - 2024-01-XX

### 🎉 初始版本

这是 xiaojueshi 个人开源项目 `@bun-framework/core` 的第一个 Beta 版本！

#### ✨ 新增功能

- **装饰器系统**: 完整的装饰器支持，包括 `@Controller`、`@Injectable`、`@Module` 等
- **依赖注入**: 内置 IoC 容器，支持构造函数注入和服务自动解析
- **HTTP 装饰器**: 支持 `@Get`、`@Post`、`@Put`、`@Delete` 等 HTTP 方法装饰器
- **参数装饰器**: 支持 `@Param`、`@Query`、`@Body`、`@Headers` 等参数提取
- **守卫系统**: 内置认证和权限控制守卫系统
- **异常过滤器**: 统一异常处理和错误响应格式化
- **数据验证**: 内置数据验证管道，集成 class-validator
- **拦截器**: 支持请求/响应拦截和转换
- **中间件**: 灵活的中间件系统
- **Swagger 支持**: 自动生成 API 文档，集成 Scalar UI
- **生命周期**: 完整的模块生命周期管理

#### 🔧 技术特性

- **TypeScript**: 完整的 TypeScript 支持和类型安全
- **Bun 优化**: 基于 Bun 运行时，性能优异
- **模块化**: 清晰的模块化架构
- **装饰器元数据**: 支持装饰器元数据反射

#### 📚 文档

- 完整的 README.md 文档
- API 参考文档
- 使用示例和最佳实践

#### 🚧 开发阶段说明

- 这是一个 Beta 版本，API 可能会有变化
- 欢迎提供反馈和建议
- 正在持续优化和完善功能

### 📦 依赖项

- `@scalar/api-reference`: ^1.31.18
- `class-transformer`: ^0.5.1
- `class-validator`: ^0.14.2
- `reflect-metadata`: ^0.1.13

### 📋 系统要求

- **Bun**: >=1.0.0
- **TypeScript**: >=5.0.0

---

## 贡献指南

如果您想为这个项目做贡献，请：

1. 检查现有的 [Issues](https://github.com/xiaojueshi/bun-web-core/issues)
2. 创建一个新的 Issue 来讨论您想要添加的功能
3. Fork 这个项目并创建您的特性分支
4. 提交您的更改并推送到您的分支
5. 创建一个 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
