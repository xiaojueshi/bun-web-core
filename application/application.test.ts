import { test, expect } from "bun:test";
import { Application } from "./application";

// 模拟模块元数据
class FakeModule {}
Reflect.defineMetadata("module", true, FakeModule);
Reflect.defineMetadata("imports", [], FakeModule);
Reflect.defineMetadata("controllers", [], FakeModule);
Reflect.defineMetadata("providers", [], FakeModule);

class TestGuard {
  canActivate() {
    return true;
  }
}
class ParamGuard {
  constructor(public value: string) {}
  canActivate() {
    return this.value === "ok";
  }
}
class AsyncGuard {
  async canActivate() {
    return true;
  }
}

class TestPipe {
  transform(v: any) {
    return v + "-pipe";
  }
}
class ParamPipe {
  constructor(public value: string) {}
  transform(v: any) {
    return v + this.value;
  }
}
class AsyncPipe {
  async transform(v: any) {
    return v + "-async";
  }
}

class TestInterceptor {
  intercept(context: any, next: any) {
    return {
      subscribe: (o: any) => {
        o.next && o.next("ok");
        o.complete && o.complete();
        return { unsubscribe() {} };
      },
    };
  }
}
class ParamInterceptor {
  constructor(public value: string) {}
  intercept(context: any, next: any) {
    return {
      subscribe: (o: any) => {
        o.next && o.next(this.value);
        o.complete && o.complete();
        return { unsubscribe() {} };
      },
    };
  }
}
class AsyncInterceptor {
  async intercept(context: any, next: any) {
    return {
      subscribe: (o: any) => {
        o.next && o.next("async");
        o.complete && o.complete();
        return { unsubscribe() {} };
      },
    };
  }
}

test("Application 可以正常实例化", () => {
  const app = new Application(FakeModule);
  expect(app).toBeInstanceOf(Application);
});

test("设置全局守卫不报错", () => {
  const app = new Application(FakeModule);
  class DummyGuard {
    canActivate() {
      return true;
    }
  }
  expect(() => app.useGlobalGuards(DummyGuard)).not.toThrow();
});

test("设置全局异常过滤器不报错", () => {
  const app = new Application(FakeModule);
  expect(() => app.useGlobalFilters(class {})).not.toThrow();
});

test("设置全局管道不报错", () => {
  const app = new Application(FakeModule);
  expect(() =>
    app.useGlobalPipes(
      class {
        transform(v: any) {
          return v;
        }
      }
    )
  ).not.toThrow();
});

test("加载无效模块时抛出异常", () => {
  class InvalidModule {}
  expect(() => new Application(InvalidModule)).toThrow(/不是一个有效的模块/);
});

test("useGlobalGuards 支持守卫实例", () => {
  const app = new Application(FakeModule);
  const instance = new ParamGuard("ok");
  expect(() => app.useGlobalGuards(instance)).not.toThrow();
});

test("useGlobalGuards 支持同步工厂函数", () => {
  const app = new Application(FakeModule);
  expect(() => app.useGlobalGuards(() => new ParamGuard("ok"))).not.toThrow();
});

test("useGlobalGuards 支持异步工厂函数", async () => {
  const app = new Application(FakeModule);
  expect(() => app.useGlobalGuards(async () => new AsyncGuard())).not.toThrow();
  const guards = await (
    await import("../decorators/guard.decorator")
  ).GuardResolver.getGlobalGuards(app["container"]);
  expect(guards[0]).toBeInstanceOf(AsyncGuard);
  const dummyContext = {
    getRequest: () => ({}),
    getResponse: () => ({}),
    getHandler: () => () => {},
    getClass: () => ({}),
  };
  expect(await guards[0].canActivate(dummyContext)).toBe(true);
});

test("useGlobalGuards 类型校验异常", () => {
  const app = new Application(FakeModule);
  // @ts-expect-error 故意传递错误类型
  expect(() => app.useGlobalGuards(123)).toThrow(
    /仅支持守卫类、守卫实例或工厂函数/
  );
});

test("useGlobalPipes 支持管道实例", () => {
  const app = new Application(FakeModule);
  const instance = new ParamPipe("-ok");
  expect(() => app.useGlobalPipes(instance)).not.toThrow();
});

test("useGlobalPipes 支持同步工厂函数", () => {
  const app = new Application(FakeModule);
  expect(() => app.useGlobalPipes(() => new ParamPipe("-ok"))).not.toThrow();
});

test("useGlobalPipes 支持异步工厂函数", async () => {
  const app = new Application(FakeModule);
  expect(() => app.useGlobalPipes(async () => new AsyncPipe())).not.toThrow();
  const pipes = await (
    await import("../pipes/pipe-resolver")
  ).PipeResolver.getGlobalPipes(app["container"]);
  expect(pipes[0]).toBeInstanceOf(AsyncPipe);
  const dummyMeta = { type: "custom" as const };
  expect(await pipes[0].transform("v", dummyMeta)).toBe("v-async");
});

test("useGlobalPipes 类型校验异常", () => {
  const app = new Application(FakeModule);
  // @ts-expect-error 故意传递错误类型
  expect(() => app.useGlobalPipes(123)).toThrow(
    /仅支持管道类、管道实例或工厂函数/
  );
});

test("useGlobalInterceptors 支持拦截器实例", () => {
  const app = new Application(FakeModule);
  const instance = new ParamInterceptor("ok");
  expect(() => app.useGlobalInterceptors(instance)).not.toThrow();
});

test("useGlobalInterceptors 支持同步工厂函数", () => {
  const app = new Application(FakeModule);
  expect(() =>
    app.useGlobalInterceptors(() => new ParamInterceptor("ok"))
  ).not.toThrow();
});

test("useGlobalInterceptors 支持异步工厂函数", async () => {
  const app = new Application(FakeModule);
  expect(() =>
    app.useGlobalInterceptors(async () => new AsyncInterceptor())
  ).not.toThrow();
  const interceptors = await (
    await import("../decorators/interceptor.decorator")
  ).InterceptorResolver.getGlobalInterceptors(app["container"]);
  expect(interceptors[0]).toBeInstanceOf(AsyncInterceptor);
  // 这里只测试类型和实例化，具体拦截器链执行由框架内部测试
});

test("useGlobalInterceptors 类型校验异常", () => {
  const app = new Application(FakeModule);
  // @ts-expect-error 故意传递错误类型
  expect(() => app.useGlobalInterceptors(123)).toThrow(
    /仅支持拦截器类、拦截器实例或工厂函数/
  );
});

// 通配符路由测试
test("matchRoute 支持静态路径匹配", () => {
  const app = new Application(FakeModule);
  // @ts-ignore 访问私有方法进行测试
  const matchRoute = app["matchRoute"].bind(app);
  
  expect(matchRoute("/users", "/users")).toEqual({});
  expect(matchRoute("/users/list", "/users/list")).toEqual({});
  expect(matchRoute("/users", "/posts")).toBeNull();
});

test("matchRoute 支持参数路径匹配", () => {
  const app = new Application(FakeModule);
  // @ts-ignore 访问私有方法进行测试
  const matchRoute = app["matchRoute"].bind(app);
  
  expect(matchRoute("/users/:id", "/users/123")).toEqual({ id: "123" });
  expect(matchRoute("/users/:id/posts/:postId", "/users/123/posts/456")).toEqual({ id: "123", postId: "456" });
  expect(matchRoute("/users/:id", "/users")).toBeNull();
});

test("matchRoute 支持单段通配符匹配", () => {
  const app = new Application(FakeModule);
  // @ts-ignore 访问私有方法进行测试
  const matchRoute = app["matchRoute"].bind(app);
  
  expect(matchRoute("/users/*", "/users/123")).toEqual({});
  expect(matchRoute("/files/*", "/files/document.txt")).toEqual({});
  expect(matchRoute("/api/*/info", "/api/v1/info")).toEqual({});
  expect(matchRoute("/users/*", "/users/123/posts")).toBeNull();
});

test("matchRoute 支持多段通配符匹配", () => {
  const app = new Application(FakeModule);
  // @ts-ignore 访问私有方法进行测试
  const matchRoute = app["matchRoute"].bind(app);
  
  expect(matchRoute("/files/**", "/files/path/to/file.txt")).toEqual({ "**": "path/to/file.txt" });
  expect(matchRoute("/api/**", "/api/v1/users/123")).toEqual({ "**": "v1/users/123" });
  expect(matchRoute("/static/**", "/static/css/main.css")).toEqual({ "**": "css/main.css" });
});

test("matchRoute 支持参数和通配符组合", () => {
  const app = new Application(FakeModule);
  // @ts-ignore 访问私有方法进行测试
  const matchRoute = app["matchRoute"].bind(app);
  
  expect(matchRoute("/users/:id/*", "/users/123/posts")).toEqual({ id: "123" });
  expect(matchRoute("/files/:category/**", "/files/documents/path/to/file.txt")).toEqual({ 
    category: "documents", 
    "**": "path/to/file.txt" 
  });
});
