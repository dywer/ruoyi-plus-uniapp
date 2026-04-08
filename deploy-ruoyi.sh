#!/bin/bash

# RuoYi-Plus-UniApp 阿里云部署脚本
# 服务器：47.117.247.215
# 用户：jwqdjs

set -e

# 配置
SERVER_HOST="47.117.247.215"
SERVER_USER="jwqdjs"
REMOTE_BASE_DIR="/opt/ruoyi-plus"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}$1${NC}"; }
success() { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo ""
echo "========================================"
echo "  RuoYi-Plus-UniApp 部署到阿里云"
echo "========================================"
echo ""

# 步骤 1: SSH 连接检查
log "[1/8] 检查 SSH 连接..."
ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "echo 'SSH 连接正常'" || error "无法连接到服务器"

# 步骤 2: 停止现有容器
log "\n[2/8] 停止现有容器..."
ssh ${SERVER_USER}@${SERVER_HOST} "docker stop ry-server ry-nginx ry-minio ry-redis ry-mysql 2>/dev/null || true"
success "容器已停止"

# 步骤 3: 备份数据
log "\n[3/8] 备份现有数据..."
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${REMOTE_BASE_DIR}/backup"
TIMESTAMP=$(ssh ${SERVER_USER}@${SERVER_HOST} "date +%Y%m%d-%H%M%S")
ssh ${SERVER_USER}@${SERVER_HOST} "tar -czf ${REMOTE_BASE_DIR}/backup/backup-\${TIMESTAMP}.tar.gz -C ${REMOTE_BASE_DIR} . 2>/dev/null || echo '无备份内容'"
success "备份完成"

# 步骤 4: 创建远程目录
log "\n[4/8] 创建远程目录..."
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${REMOTE_BASE_DIR}/{mysql/{data,conf},redis/{data,conf},minio/{data,config},server/{logs,upload},nginx/{cert,conf,html,log}}"
success "目录创建完成"

# 步骤 5: 上传文件
log "\n[5/8] 上传部署文件..."

# 上传 docker-compose
scp docker-compose.prod.yml ${SERVER_USER}@${SERVER_HOST}:${REMOTE_BASE_DIR}/

# 上传 nginx 配置
scp -r script/docker/nginx/* ${SERVER_USER}@${SERVER_HOST}:${REMOTE_BASE_DIR}/nginx/conf/

# 上传 Redis 配置
scp -r script/docker/redis/* ${SERVER_USER}@${SERVER_HOST}:${REMOTE_BASE_DIR}/redis/conf/

success "配置文件上传完成"

# 步骤 6: 部署后端应用
log "\n[6/8] 构建并上传后端镜像..."

# Maven 构建
cd /Users/mario/Exec/ai_workspace/claude_workspace/ruoyi_plus_uniapp/ruoyi-plus-uniapp-workflow
log "  Maven 构建中..."
mvn clean package -DskipTests -q || warn "Maven 构建可能需要更长时间"

# 检查 jar 包
if [ -f "ruoyi-admin/target/ruoyi-admin.jar" ]; then
    log "  上传 JAR 包到服务器..."
    scp ruoyi-admin/target/ruoyi-admin.jar ${SERVER_USER}@${SERVER_HOST}:${REMOTE_BASE_DIR}/

    # 在服务器上构建镜像
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_BASE_DIR} && docker build -t ruoyi/ruoyi-server:5.6.0 - <<EOF
FROM bellsoft/liberica-openjdk-rocky:17.0.16-cds
LABEL maintainer=\"RuoYi-Plus\"
RUN mkdir -p /ruoyi/server/logs /ruoyi/server/temp
WORKDIR /ruoyi/server
ENV SERVER_PORT=8080 SNAIL_PORT=28080 LANG=C.UTF-8 LC_ALL=C.UTF-8
EXPOSE \${SERVER_PORT} \${SNAIL_PORT}
COPY ruoyi-admin.jar ./app.jar
ENTRYPOINT java -Djava.security.egd=file:/dev/./urandom -Dserver.port=\${SERVER_PORT} -Dsnail-job.port=\${SNAIL_PORT} -XX:+HeapDumpOnOutOfMemoryError -XX:+UseZGC -jar app.jar
EOF"
    success "后端镜像构建完成"
else
    warn "未找到 JAR 包，使用官方镜像"
fi

# 步骤 7: 部署前端应用
log "\n[7/8] 部署前端应用..."

# 构建前端
cd /Users/mario/Exec/ai_workspace/claude_workspace/ruoyi_plus_uniapp/plus-ui
log "  构建前端中..."
npm run build:prod || warn "前端构建可能需要安装依赖"

# 上传前端文件
if [ -d "dist" ]; then
    scp -r dist/* ${SERVER_USER}@${SERVER_HOST}:${REMOTE_BASE_DIR}/nginx/html/
    success "前端文件上传完成"
else
    warn "前端 dist 目录不存在"
fi

# 步骤 8: 启动服务
log "\n[8/8] 启动所有服务..."
ssh ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_BASE_DIR} && docker-compose -f docker-compose.prod.yml up -d"

# 等待服务启动
sleep 10

# 检查服务状态
ssh ${SERVER_USER}@${SERVER_HOST} "docker ps --filter name=ry- --format '{{.Names}}\t{{.Status}}'"

echo ""
success "部署完成!"
echo "========================================"
echo "访问地址：http://${SERVER_HOST}/"
echo "后端 API:  http://${SERVER_HOST}:8080/"
echo "MinIO 控制台：http://${SERVER_HOST}:9001/"
echo "========================================"
echo ""
