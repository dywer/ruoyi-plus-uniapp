#!/bin/bash

# RuoYi 后端修复部署脚本
# 用于修复数据库连接问题

set -e

echo "======================================"
echo "  RuoYi 后端修复部署脚本"
echo "======================================"

# 1. 停止当前后端容器
echo "[1/6] 停止后端容器..."
docker stop ry-server 2>/dev/null || true
docker rm ry-server 2>/dev/null || true
echo "✓ 后端容器已清理"

# 2. 确保 MySQL 服务正常运行
echo "[2/6] 检查 MySQL 服务..."
docker ps | grep ry-mysql || (echo "MySQL 未运行，启动中..." && docker start ry-mysql)
sleep 3

# 3. 测试数据库连接
echo "[3/6] 测试数据库连接..."
docker exec ry-mysql mysql -uroot -pRy@2026Secure -e "SELECT 'MySQL 正常';" || {
    echo "⚠️ MySQL 连接失败，检查密码..."
    # 如果密码不对，使用默认密码
    docker exec ry-mysql mysql -uroot -proot -e "SELECT 1;" 2>/dev/null && \
        echo "使用默认密码 root" || \
        echo "⚠️ 需要手动配置 MySQL"
}

# 4. 创建/更新数据库
echo "[4/6] 初始化数据库..."
docker exec ry-mysql mysql -uroot -pRy@2026Secure -e "
CREATE DATABASE IF NOT EXISTS \`ry-vue\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE DATABASE IF NOT EXISTS \`ry-vue-workflow\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
" 2>/dev/null || {
    echo "⚠️ 数据库创建失败，可能已存在或密码不同"
    docker exec ry-mysql mysql -uroot -proot -e "
CREATE DATABASE IF NOT EXISTS \`ry-vue\` DEFAULT CHARACTER SET utf8mb4;
" 2>/dev/null || echo "⚠️ 请手动检查 MySQL 配置"
}

# 5. 更新 Docker Compose 环境变量
echo "[5/6] 更新 Docker Compose 配置..."
cd /opt/ruoyi-plus

# 创建.env 文件
cat > .env << 'EOF'
DB_HOST=ry-mysql
DB_PORT=3306
DB_NAME=ry-vue
DB_USERNAME=root
DB_PASSWORD=Ry@2026Secure
REDIS_HOST=ry-redis
REDIS_PORT=6379
REDIS_PASSWORD=
EOF

echo "✓ 环境变量配置完成"

# 6. 启动后端服务
echo "[6/6] 启动后端服务..."
docker compose -f docker-compose.prod.yml up -d ry-server

echo ""
echo "======================================"
echo "  等待后端启动..."
echo "======================================"

# 等待并检查
for i in {1..10}; do
    sleep 5
    STATUS=$(docker inspect --format='{{.State.Status}}' ry-server 2>/dev/null || echo "not_found")
    if [ "$STATUS" = "running" ]; then
        HEALTH=$(docker exec ry-server curl -s http://localhost:8080/actuator/health 2>/dev/null || echo "starting")
        echo "第 $i 次检查：后端状态=$STATUS 健康检查=$HEALTH"
        if [[ "$HEALTH" == *"UP"* ]]; then
            echo ""
            echo "======================================"
            echo "  ✅ 后端启动成功!"
            echo "======================================"
            exit 0
        fi
    else
        echo "第 $i 次检查：后端状态=$STATUS"
        if [ "$STATUS" = "exited" ]; then
            echo "⚠️ 后端容器已退出，查看日志..."
            docker logs ry-server --tail 30
            exit 1
        fi
    fi
done

echo ""
echo "⚠️ 后端启动超时，查看日志..."
docker logs ry-server --tail 50
