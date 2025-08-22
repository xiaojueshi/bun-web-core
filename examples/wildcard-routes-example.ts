import { Controller, Get, Post, ApplicationFactory } from "../index";
import { Module } from "../decorators/module.decorator";

// 示例控制器，演示通配符路由的使用
@Controller("/api")
class WildcardController {
  // 匹配 /api/users/123, /api/users/456 等
  @Get("/users/:id")
  getUser(req: Request) {
    // @ts-ignore
    const id = req.params.id;
    return { id, name: `User ${id}` };
  }

  // 匹配 /api/files/document.txt, /api/files/image.png 等单个文件
  @Get("/files/*")
  getFile(req: Request) {
    return { message: "获取单个文件信息" };
  }

  // 匹配 /api/docs/guide/intro.md, /api/docs/api/reference.md 等多级路径
  @Get("/docs/**")
  getDocument(req: Request) {
    // @ts-ignore
    const path = req.params["**"];
    return { path, content: `文档内容: ${path}` };
  }

  // 匹配 /api/data/users.json, /api/data/config/app.json 等
  @Post("/data/**")
  createData(req: Request) {
    // @ts-ignore
    const path = req.params["**"];
    return { path, message: `创建数据: ${path}` };
  }
}

@Module({
  controllers: [WildcardController],
  providers: [],
})
class WildcardModule {}

// 创建应用程序实例
const app = ApplicationFactory.create(WildcardModule, {
  port: 3000,
  globalPrefix: "/v1"
});

// 启动服务器
app.listen().catch(console.error);

export default app;