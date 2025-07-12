#!/bin/bash

# @bun-framework/core 构建脚本
# 使用方法: ./build.sh [clean|build|test|publish]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印带颜色的信息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查是否有 Bun
check_bun() {
    if ! command -v bun &> /dev/null; then
        print_error "Bun 未找到，请先安装 Bun: https://bun.sh"
        exit 1
    fi
    print_success "Bun 已找到: $(bun --version)"
}

# 清理构建文件
clean() {
    print_info "清理构建文件..."
    rm -rf dist/
    rm -f *.tsbuildinfo
    print_success "清理完成"
}

# 安装依赖
install_deps() {
    print_info "安装依赖..."
    bun install
    print_success "依赖安装完成"
}

# 类型检查
type_check() {
    print_info "进行类型检查..."
    bun run type-check
    print_success "类型检查通过"
}

# 运行测试
run_tests() {
    print_info "运行测试..."
    bun test
    print_success "测试通过"
}

# 构建项目
build() {
    print_info "构建项目..."
    bun run build
    print_success "构建完成"
}

# 发布到 NPM
publish() {
    print_info "准备发布到 NPM..."
    
    # 检查是否登录 NPM
    if ! bun publish --dry-run &> /dev/null; then
        print_warning "请先登录 NPM: npm login"
        exit 1
    fi
    
    # 确认发布
    echo -e "${YELLOW}即将发布 @bun-framework/core 到 NPM${NC}"
    echo "当前版本: $(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d ' ')"
    read -p "确认发布吗? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "正在发布..."
        bun publish
        print_success "发布成功！"
    else
        print_info "取消发布"
    fi
}

# 完整构建流程
full_build() {
    print_info "开始完整构建流程..."
    clean
    install_deps
    type_check
    run_tests
    build
    print_success "完整构建流程完成！"
}

# 主逻辑
main() {
    check_bun
    
    case "${1:-full}" in
        clean)
            clean
            ;;
        install)
            install_deps
            ;;
        type-check)
            type_check
            ;;
        test)
            run_tests
            ;;
        build)
            build
            ;;
        publish)
            full_build
            publish
            ;;
        full)
            full_build
            ;;
        *)
            echo "使用方法: $0 [clean|install|type-check|test|build|publish|full]"
            echo ""
            echo "命令说明:"
            echo "  clean      - 清理构建文件"
            echo "  install    - 安装依赖"
            echo "  type-check - 类型检查"
            echo "  test       - 运行测试"
            echo "  build      - 构建项目"
            echo "  publish    - 构建并发布到 NPM"
            echo "  full       - 完整构建流程 (默认)"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@" 