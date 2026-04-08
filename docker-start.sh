#!/bin/bash
set -e

# RuoYi-Vue-Plus Docker 启动脚本

echo "========================================"
echo "  RuoYi-Vue-Plus Docker 启动脚本"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "${PROJECT_ROOT}"

# 默认使用开发环境
ENV=${1:-dev}
COMPOSE_FILE="docker-compose.${ENV}.yml"

echo ""
echo -e "${BLUE}环境：${ENV}${NC}"
echo -e "${BLUE}配置文件：${COMPOSE_FILE}${NC}"

# 检查配置文件
if [ ! -f "${COMPOSE_FILE}" ]; then
    echo -e "${RED}错误：配置文件不存在 ${COMPOSE_FILE}${NC}"
    exit 1
fi

# 检查环境文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}警告：.env 文件不存在，复制 .env.example${NC}"
    cp .env.example .env
fi

echo ""
echo -e "${GREEN}[1/4] 检查 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误：Docker 未安装${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[2/4] 创建必要目录...${NC}"
mkdir -p docker/{mysql/{conf,data},redis/{conf,data},minio/{data,config},nginx/{conf,conf.d,html,log,cert},server/{logs,temp},snailjob/logs}
echo "✓ 目录创建完成"

echo ""
echo -e "${GREEN}[3/4] 拉取最新镜像...${NC}"
if command -v docker compose &> /dev/null; then
    docker compose -f "${COMPOSE_FILE}" pull
else
    docker-compose -f "${COMPOSE_FILE}" pull
fi
echo "✓ 镜像拉取完成"

echo ""
echo -e "${GREEN}[4/4] 启动服务...${NC}"
if command -v docker compose &> /dev/null; then
    docker compose -f "${COMPOSE_FILE}" up -d
else
    docker-compose -f "${COMPOSE_FILE}" up -d
fi
echo "✓ 服务启动完成"

echo ""
echo "========================================"
echo -e "${GREEN}  启动完成！${NC}"
echo "========================================"
echo ""

# 等待服务启动
echo -e "${BLUE}等待服务启动...${NC}"
sleep 10

echo ""
echo "服务状态："
echo "----------------------------------------"
if command -v docker compose &> /dev/null; then
    docker compose -f "${COMPOSE_FILE}" ps
else
    docker-compose -f "${COMPOSE_FILE}" ps
fi

echo ""
echo "访问地址："
echo "----------------------------------------"
echo -e "  前端：           ${GREEN}http://localhost${NC}"
echo -e "  后端 API：       ${GREEN}http://localhost:8080${NC}"
echo -e "  Swagger 文档：   ${GREEN}http://localhost:8080/swagger-ui/index.html${NC}"
echo -e "  MinIO 控制台：   ${GREEN}http://localhost:9001${NC}"
echo -e "  SnailJob 控制台：${GREEN}http://localhost:17888${NC}"
echo ""
echo "默认账号密码："
echo "----------------------------------------"
echo "  用户名：admin"
echo "  密码：admin123"
echo ""
echo "常用命令："
echo "----------------------------------------"
echo "  查看日志：docker compose -f ${COMPOSE_FILE} logs -f"
echo "  停止服务：docker compose -f ${COMPOSE_FILE} down"
echo "  重启服务：docker compose -f ${COMPOSE_FILE} restart"
echo "  进入容器：docker compose -f ${COMPOSE_FILE} exec ruoyi-server bash"
echo ""
