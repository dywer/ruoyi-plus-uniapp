#!/bin/bash
set -e

# RuoYi-Vue-Plus Docker 构建脚本

echo "========================================"
echo "  RuoYi-Vue-Plus Docker 构建脚本"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
WORKFLOW_DIR="${PROJECT_ROOT}/ruoyi-plus-uniapp-workflow"

echo ""
echo -e "${GREEN}[1/5] 检查环境...${NC}"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误：Docker 未安装${NC}"
    exit 1
fi
echo "✓ Docker 已安装：$(docker --version)"

# 检查 Docker Compose
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误：Docker Compose 未安装${NC}"
    exit 1
fi
echo "✓ Docker Compose 已安装"

# 检查 Java
if ! command -v java &> /dev/null; then
    echo -e "${YELLOW}警告：Java 未安装，将无法执行本地构建${NC}"
fi

echo ""
echo -e "${GREEN}[2/5] 进入后端目录...${NC}"
cd "${WORKFLOW_DIR}"

echo ""
echo -e "${GREEN}[3/5] Maven 清理并打包...${NC}"
if command -v mvn &> /dev/null; then
    mvn clean package -DskipTests -Pdev
    echo "✓ Maven 打包完成"
else
    echo -e "${YELLOW}跳过：Maven 未安装${NC}"
fi

echo ""
echo -e "${GREEN}[4/5] 检查 JAR 文件...${NC}"
JAR_FILE="${WORKFLOW_DIR}/ruoyi-admin/target/ruoyi-admin.jar"
if [ -f "${JAR_FILE}" ]; then
    echo "✓ JAR 文件已生成：${JAR_FILE}"
    JAR_SIZE=$(du -h "${JAR_FILE}" | cut -f1)
    echo "  文件大小：${JAR_SIZE}"
else
    echo -e "${YELLOW}警告：JAR 文件未找到，将使用远程镜像${NC}"
fi

echo ""
echo -e "${GREEN}[5/5] 构建 Docker 镜像...${NC}"
cd "${PROJECT_ROOT}"

# 创建 Docker 镜像
if [ -f "${JAR_FILE}" ]; then
    # 复制 JAR 到临时构建目录
    mkdir -p "${PROJECT_ROOT}/.docker-build"
    cp "${JAR_FILE}" "${PROJECT_ROOT}/.docker-build/ruoyi-admin.jar"
    cp "${WORKFLOW_DIR}/ruoyi-admin/Dockerfile" "${PROJECT_ROOT}/.docker-build/"

    docker build -t ruoyi/ruoyi-server:5.6.0 "${PROJECT_ROOT}/.docker-build"
    rm -rf "${PROJECT_ROOT}/.docker-build"
    echo "✓ Docker 镜像构建完成：ruoyi/ruoyi-server:5.6.0"
else
    echo -e "${YELLOW}跳过：本地无 JAR 文件，将使用远程镜像${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}  构建完成！${NC}"
echo "========================================"
echo ""
echo "下一步操作："
echo "  1. 复制环境配置：cp .env.example .env"
echo "  2. 编辑环境配置：vim .env"
echo "  3. 启动开发环境：docker compose -f docker-compose.dev.yml up -d"
echo "  4. 查看日志：docker compose -f docker-compose.dev.yml logs -f"
echo ""
