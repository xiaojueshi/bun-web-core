import "reflect-metadata";

/**
 * 模块初始化接口
 */
export interface OnModuleInit {
  /**
   * 模块初始化钩子 - 在模块初始化时调用
   */
  onModuleInit(): void | Promise<void>;
}

/**
 * 模块销毁接口
 */
export interface OnModuleDestroy {
  /**
   * 模块销毁钩子 - 在模块销毁时调用
   */
  onModuleDestroy(): void | Promise<void>;
}

/**
 * 应用初始化接口
 */
export interface OnApplicationBootstrap {
  /**
   * 应用启动钩子 - 在应用完全启动后调用
   */
  onApplicationBootstrap(): void | Promise<void>;
}

/**
 * 应用关闭接口
 */
export interface OnApplicationShutdown {
  /**
   * 应用关闭钩子 - 在应用关闭前调用
   */
  onApplicationShutdown(signal?: string): void | Promise<void>;
}

/**
 * 生命周期事件类型
 */
export type LifecycleEvent =
  | "onModuleInit"
  | "onModuleDestroy"
  | "onApplicationBootstrap"
  | "onApplicationShutdown";

/**
 * 生命周期钩子管理器
 */
export class LifecycleManager {
  private static moduleInstances: Map<string, any[]> = new Map();
  private static applicationListeners: Map<LifecycleEvent, any[]> = new Map();
  private static shutdownListeners: (() => Promise<void> | void)[] = [];

  /**
   * 注册模块实例
   * @param moduleName 模块名称
   * @param instances 模块中的实例数组
   */
  static registerModuleInstances(moduleName: string, instances: any[]): void {
    this.moduleInstances.set(moduleName, instances);
  }

  /**
   * 注册应用监听器
   * @param event 生命周期事件
   * @param listener 监听器实例
   */
  static registerApplicationListener(
    event: LifecycleEvent,
    listener: any
  ): void {
    const listeners = this.applicationListeners.get(event) || [];
    listeners.push(listener);
    this.applicationListeners.set(event, listeners);
  }

  /**
   * 触发模块初始化
   * @param moduleName 模块名称
   */
  static async triggerModuleInit(moduleName: string): Promise<void> {
    const instances = this.moduleInstances.get(moduleName) || [];

    console.log(`🔄 [生命周期] 初始化模块: ${moduleName}`);

    for (const instance of instances) {
      if (this.hasLifecycleHook(instance, "onModuleInit")) {
        try {
          await (instance as OnModuleInit).onModuleInit();
          console.log(
            `✅ [生命周期] ${instance.constructor.name}.onModuleInit 执行完成`
          );
        } catch (error) {
          console.error(
            `❌ [生命周期] ${instance.constructor.name}.onModuleInit 执行失败:`,
            error
          );
        }
      }
    }
  }

  /**
   * 触发模块销毁
   * @param moduleName 模块名称
   */
  static async triggerModuleDestroy(moduleName: string): Promise<void> {
    const instances = this.moduleInstances.get(moduleName) || [];

    console.log(`🔄 [生命周期] 销毁模块: ${moduleName}`);

    for (const instance of instances) {
      if (this.hasLifecycleHook(instance, "onModuleDestroy")) {
        try {
          await (instance as OnModuleDestroy).onModuleDestroy();
          console.log(
            `✅ [生命周期] ${instance.constructor.name}.onModuleDestroy 执行完成`
          );
        } catch (error) {
          console.error(
            `❌ [生命周期] ${instance.constructor.name}.onModuleDestroy 执行失败:`,
            error
          );
        }
      }
    }
  }

  /**
   * 触发应用启动
   */
  static async triggerApplicationBootstrap(): Promise<void> {
    console.log("🚀 [生命周期] 应用启动完成，执行启动钩子");

    const listeners =
      this.applicationListeners.get("onApplicationBootstrap") || [];

    for (const listener of listeners) {
      if (this.hasLifecycleHook(listener, "onApplicationBootstrap")) {
        try {
          await (listener as OnApplicationBootstrap).onApplicationBootstrap();
          console.log(
            `✅ [生命周期] ${listener.constructor.name}.onApplicationBootstrap 执行完成`
          );
        } catch (error) {
          console.error(
            `❌ [生命周期] ${listener.constructor.name}.onApplicationBootstrap 执行失败:`,
            error
          );
        }
      }
    }
  }

  /**
   * 触发应用关闭
   * @param signal 关闭信号
   */
  static async triggerApplicationShutdown(signal?: string): Promise<void> {
    console.log(`🛑 [生命周期] 应用关闭 (信号: ${signal || "UNKNOWN"})`);

    const listeners =
      this.applicationListeners.get("onApplicationShutdown") || [];

    for (const listener of listeners) {
      if (this.hasLifecycleHook(listener, "onApplicationShutdown")) {
        try {
          await (listener as OnApplicationShutdown).onApplicationShutdown(
            signal
          );
          console.log(
            `✅ [生命周期] ${listener.constructor.name}.onApplicationShutdown 执行完成`
          );
        } catch (error) {
          console.error(
            `❌ [生命周期] ${listener.constructor.name}.onApplicationShutdown 执行失败:`,
            error
          );
        }
      }
    }

    // 执行自定义关闭监听器
    for (const shutdownListener of this.shutdownListeners) {
      try {
        await shutdownListener();
      } catch (error) {
        console.error("❌ [生命周期] 自定义关闭监听器执行失败:", error);
      }
    }
  }

  /**
   * 添加关闭监听器
   * @param listener 关闭监听器函数
   */
  static addShutdownListener(listener: () => Promise<void> | void): void {
    this.shutdownListeners.push(listener);
  }

  /**
   * 检查实例是否具有特定的生命周期钩子
   * @param instance 实例对象
   * @param hook 钩子名称
   */
  private static hasLifecycleHook(
    instance: any,
    hook: LifecycleEvent
  ): boolean {
    return instance && typeof instance[hook] === "function";
  }

  /**
   * 自动发现并注册生命周期监听器
   * @param instances 实例数组
   */
  static autoRegisterLifecycleListeners(instances: any[]): void {
    for (const instance of instances) {
      // 检查并注册应用启动监听器
      if (this.hasLifecycleHook(instance, "onApplicationBootstrap")) {
        this.registerApplicationListener("onApplicationBootstrap", instance);
      }

      // 检查并注册应用关闭监听器
      if (this.hasLifecycleHook(instance, "onApplicationShutdown")) {
        this.registerApplicationListener("onApplicationShutdown", instance);
      }
    }
  }

  /**
   * 清理所有注册的监听器（用于测试）
   */
  static clearAll(): void {
    this.moduleInstances.clear();
    this.applicationListeners.clear();
    this.shutdownListeners.length = 0;
  }

  /**
   * 获取模块实例统计信息
   */
  static getModuleStats(): { moduleName: string; instanceCount: number }[] {
    const stats: { moduleName: string; instanceCount: number }[] = [];

    for (const [moduleName, instances] of this.moduleInstances.entries()) {
      stats.push({
        moduleName,
        instanceCount: instances.length,
      });
    }

    return stats;
  }

  /**
   * 设置进程信号监听器（用于优雅关闭）
   */
  static setupGracefulShutdown(): void {
    const signals = ["SIGTERM", "SIGINT", "SIGQUIT"];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`🛑 [生命周期] 接收到信号: ${signal}`);
        await this.triggerApplicationShutdown(signal);
        process.exit(0);
      });
    });

    // 处理未捕获的异常
    process.on("uncaughtException", async (error) => {
      console.error("💥 [生命周期] 未捕获的异常:", error);
      await this.triggerApplicationShutdown("uncaughtException");
      process.exit(1);
    });

    // 处理未处理的Promise拒绝
    process.on("unhandledRejection", async (reason, promise) => {
      console.error(
        "💥 [生命周期] 未处理的Promise拒绝:",
        reason,
        "Promise:",
        promise
      );
      await this.triggerApplicationShutdown("unhandledRejection");
      process.exit(1);
    });
  }
}

/**
 * 生命周期装饰器 - 用于标记生命周期钩子方法
 */
export function LifecycleHook(event: LifecycleEvent) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const existingHooks = Reflect.getMetadata("lifecycle:hooks", target) || [];
    existingHooks.push({ event, method: propertyKey });
    Reflect.defineMetadata("lifecycle:hooks", existingHooks, target);
  };
}

/**
 * 模块配置接口（扩展原有的模块装饰器）
 */
export interface ModuleLifecycleOptions {
  /** 模块初始化顺序（数字越小越早初始化）*/
  initOrder?: number;
  /** 是否启用生命周期钩子 */
  enableLifecycle?: boolean;
  /** 自定义初始化函数 */
  onInit?: () => Promise<void> | void;
  /** 自定义销毁函数 */
  onDestroy?: () => Promise<void> | void;
}

/**
 * 带生命周期的模块装饰器
 */
export function LifecycleModule(options: ModuleLifecycleOptions = {}) {
  return function (target: any) {
    // 保留原有的模块元数据
    Reflect.defineMetadata("module", true, target);

    // 添加生命周期配置
    Reflect.defineMetadata(
      "lifecycle:options",
      {
        initOrder: 0,
        enableLifecycle: true,
        ...options,
      },
      target
    );
  };
}
