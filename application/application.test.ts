import { test, expect } from "bun:test";
import { Application } from "./application";

// 模拟模块元数据
class FakeModule {}
Reflect.defineMetadata("module", true, FakeModule);
Reflect.defineMetadata("imports", [], FakeModule);
Reflect.defineMetadata("controllers", [], FakeModule);
Reflect.defineMetadata("providers", [], FakeModule);

test("Application 可以正常实例化", () => {
  const app = new Application(FakeModule);
  expect(app).toBeInstanceOf(Application);
});

test("设置全局守卫不报错", () => {
  const app = new Application(FakeModule);
  expect(() => app.useGlobalGuards(class {})).not.toThrow();
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
