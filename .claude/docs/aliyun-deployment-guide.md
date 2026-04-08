# 阿里云镜像推送和 ECS 部署指南

## 一、阿里云镜像仓库配置

### 1.1 创建阿里云镜像仓库

1. 登录阿里云控制台：https://cr.console.aliyun.com/
2. 首次使用会提示开通服务，选择**个人版**（免费）
3. 设置登录密码（用于 Docker 登录）
4. 创建命名空间：
   - 进入「命名空间」→「创建命名空间」
   - 命名空间名称：`ruoyi-plus`（可自定义）
   - 名称必须唯一

5. 创建镜像仓库：
   - 进入「镜像仓库」→「创建镜像仓库」
   - 地域：选择离你近的（如华东 2-上海）
   - 名称：`ruoyi-server`
   - 镜像类型：选择「公有仓库」或「私有仓库」

6. 重复步骤 5 创建 `ruoyi-frontend` 仓库

### 1.2 本地 Docker 登录阿里云

```bash
# 设置变量（替换为你的值）
ALIYUN_REGISTRY=registry.cn-hangzhou.aliyuncs.com
ALIYUN_NAMESPACE=ruoyi-plus
ALIYUN_USERNAME=你的阿里云账号
ALIYUN_PASSWORD=你的阿里云密码（或镜像仓库密码）

# Docker 登录
docker login --username=${ALIYUN_USERNAME} --password-stdin ${ALIYUN_REGISTRY} <<< "${ALIYUN_PASSWORD}"
```

### 1.3 镜像打标签并推送

```bash
# 设置变量
ALIYUN_REGISTRY=registry.cn-hangzhou.aliyuncs.com
ALIYUN_NAMESPACE=ruoyi-plus

# 后端镜像
docker tag ruoyi_plus_uniapp-ruoyi-server:latest \
  ${ALIYUN_REGISTRY}/${ALIYUN_NAMESPACE}/ruoyi-server:latest

docker push ${ALIYUN_REGISTRY}/${ALIYUN_NAMESPACE}/ruoyi-server:latest

# 前端镜像
docker tag ruoyi_plus_uniapp-frontend:latest \
  ${ALIYUN_REGISTRY}/${ALIYUN_NAMESPACE}/ruoyi-frontend:latest

docker push ${ALIYUN_REGISTRY}/${ALIYUN_NAMESPACE}/ruoyi-frontend:latest
```

---

## 二、阿里云 ECS 配置

### 2.1 ECS 服务器准备

1. 登录 ECS 控制台：https://ecs.console.aliyun.com/
2. 创建或选择现有 ECS 实例
3. 确保安全组开放以下端口：
   - 80 (HTTP)
   - 443 (HTTPS)
   - 8080 (后端 API)
   - 3306 (MySQL，建议仅内网访问)
   - 6379 (Redis，建议仅内网访问)

### 2.2 SSH 连接配置

```bash
# 设置变量（替换为你的值）
ECS_HOST=你的 ECS 公网 IP
ECS_USER=root
ECS_KEY_PATH=~/.ssh/aliyun_ecs.pem

# 测试连接
ssh -i ${ECS_KEY_PATH} ${ECS_USER}@${ECS_HOST}
```

### 2.3 ECS 服务器初始化

```bash
# SSH 登录 ECS
ssh -i ${ECS_KEY_PATH} ${ECS_USER}@${ECS_HOST}

# 安装 Docker（CentOS/RHEL）
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 安装 MySQL（可选，如使用外部数据库可跳过）
# 建议 ECS 只运行应用容器，数据库使用阿里云 RDS

# 安装 Redis（可选，如使用外部 Redis 可跳过）
# 建议 ECS 只运行应用容器，缓存使用阿里云 Redis
```

### 2.4 配置 ECS 登录阿里云镜像仓库

```bash
# 在 ECS 上执行
docker login --username=你的阿里云账号 --password=你的阿里云密码 registry.cn-hangzhou.aliyuncs.com
```

---

## 三、部署到 ECS

### 3.1 方式一：自动部署脚本

```bash
# 在本地执行（需要 sshpass）
brew install sshpass  # macOS
# 或 apt-get install sshpass  # Linux

# 设置变量
ECS_HOST=你的 ECS 公网 IP
ECS_USER=root
ECS_KEY_PATH=~/.ssh/aliyun_ecs.pem
ALIYUN_REGISTRY=registry.cn-hangzhou.aliyuncs.com
ALIYUN_NAMESPACE=ruoyi-plus

# 复制 docker-compose 文件到 ECS
scp -i ${ECS_KEY_PATH} docker-compose.all.yml ${ECS_USER}@${ECS_HOST}:/opt/ruoyi/

# SSH 登录 ECS 并部署
ssh -i ${ECS_KEY_PATH} ${ECS_USER}@${ECS_HOST} << 'EOF'
cd /opt/ruoyi

# 修改 docker-compose.all.yml 中的镜像地址
sed -i 's|build:|image: registry.cn-hangzhou.aliyuncs.com/ruoyi-plus/ruoyi-server:latest|g' docker-compose.all.yml
sed -i '/context:/d' docker-compose.all.yml
sed -i '/dockerfile:/d' docker-compose.all.yml

# 登录镜像仓库
docker login --username=你的阿里云账号 --password=你的阿里云密码 registry.cn-hangzhou.aliyuncs.com

# 拉取镜像并启动
docker pull registry.cn-hangzhou.aliyuncs.com/ruoyi-plus/ruoyi-server:latest
docker-compose up -d
EOF
```

### 3.2 方式二：手动部署

1. **登录 ECS 服务器**
   ```bash
   ssh -i ~/.ssh/aliyun_ecs.pem root@你的 ECS 公网 IP
   ```

2. **创建部署目录**
   ```bash
   mkdir -p /opt/ruoyi
   cd /opt/ruoyi
   ```

3. **登录阿里云镜像仓库**
   ```bash
   docker login --username=你的阿里云账号 --password=你的阿里云密码 registry.cn-hangzhou.aliyuncs.com
   ```

4. **拉取镜像**
   ```bash
   docker pull registry.cn-hangzhou.aliyuncs.com/ruoyi-plus/ruoyi-server:latest
   docker pull registry.cn-hangzhou.aliyuncs.com/ruoyi-plus/ruoyi-frontend:latest
   ```

5. **创建 docker-compose.yml**
   ```bash
   cat > docker-compose.yml << 'YAML'
   version: '3.8'
   services:
     ruoyi-server:
       image: registry.cn-hangzhou.aliyuncs.com/ruoyi-plus/ruoyi-server:latest
       container_name: ry-server
       restart: unless-stopped
       environment:
         TZ: Asia/Shanghai
         SERVER_PORT: 8080
         SPRING_PROFILES_ACTIVE: prod
       ports:
         - "8080:8080"
       networks:
         - ruoyi-network
     
     ruoyi-frontend:
       image: registry.cn-hangzhou.aliyuncs.com/ruoyi-plus/ruoyi-frontend:latest
       container_name: ry-frontend
       restart: unless-stopped
       environment:
         TZ: Asia/Shanghai
       ports:
         - "80:80"
       depends_on:
         - ruoyi-server
       networks:
         - ruoyi-network
   
   networks:
     ruoyi-network:
       driver: bridge
   YAML
   ```

6. **启动服务**
   ```bash
   docker-compose up -d
   ```

---

## 四、验证部署

### 4.1 检查容器状态

```bash
# 在 ECS 上执行
docker ps
docker logs ry-server --tail 20
docker logs ry-frontend --tail 20
```

### 4.2 访问测试

- **前端**: http://你的 ECS 公网 IP
- **后端 API**: http://你的 ECS 公网 IP:8080/swagger-ui/index.html

---

## 五、快速推送脚本

保存为 `push-to-aliyun.sh`：

```bash
#!/bin/bash
set -e

# 配置变量
ALIYUN_REGISTRY="registry.cn-hangzhou.aliyuncs.com"
ALIYUN_NAMESPACE="ruoyi-plus"
ALIYUN_USERNAME="你的阿里云账号"
ALIYUN_PASSWORD="你的阿里云密码"

# Docker 登录
echo ">>> Docker 登录..."
docker login --username=${ALIYUN_USERNAME} --password-stdin ${ALIYUN_REGISTRY} <<< "${ALIYUN_PASSWORD}"

# 推送后端镜像
echo ">>> 推送后端镜像..."
docker tag ruoyi_plus_uniapp-ruoyi-server:latest \
  ${ALIYUN_REGISTRY}/${ALIYUN_NAMESPACE}/ruoyi-server:latest
docker push ${ALIYUN_REGISTRY}/${ALIYUN_NAMESPACE}/ruoyi-server:latest

# 推送前端镜像
echo ">>> 推送前端镜像..."
docker tag ruoyi_plus_uniapp-frontend:latest \
  ${ALIYUN_REGISTRY}/${ALIYUN_NAMESPACE}/ruoyi-frontend:latest
docker push ${ALIYUN_REGISTRY}/${ALIYUN_NAMESPACE}/ruoyi-frontend:latest

echo ">>> 推送完成！"
echo ">>> 下一步：登录 ECS 服务器执行部署"
```

---

## 六、一键部署脚本

保存为 `deploy-to-ecs.sh`：

```bash
#!/bin/bash
set -e

# ECS 配置
ECS_HOST="你的 ECS 公网 IP"
ECS_USER="root"
ECS_KEY="~/.ssh/aliyun_ecs.pem"

# 阿里云配置
ALIYUN_REGISTRY="registry.cn-hangzhou.aliyuncs.com"
ALIYUN_NAMESPACE="ruoyi-plus"
ALIYUN_USERNAME="你的阿里云账号"
ALIYUN_PASSWORD="你的阿里云密码"

echo ">>> 复制部署文件到 ECS..."
scp -i ${ECS_KEY} docker-compose.all.yml ${ECS_USER}@${ECS_HOST}:/opt/ruoyi/

echo ">>> 远程部署..."
ssh -i ${ECS_KEY} ${ECS_USER}@${ECS_HOST} << EOF
cd /opt/ruoyi

# Docker 登录
docker login --username=${ALIYUN_USERNAME} --password-stdin ${ALIYUN_REGISTRY} <<< "${ALIYUN_PASSWORD}"

# 拉取镜像
docker pull ${ALIYUN_REGISTRY}/${ALIYUN_NAMESPACE}/ruoyi-server:latest
docker pull ${ALIYUN_REGISTRY}/${ALIYUN_NAMESPACE}/ruoyi-frontend:latest

# 启动服务
docker-compose up -d

# 检查状态
docker ps
echo ">>> 部署完成！"
echo ">>> 访问地址：http://${ECS_HOST}"
EOF
```

---

## 七、需要替换的变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `你的阿里云账号` | 阿里云账号名 | `myaliyun@163.com` |
| `你的阿里云密码` | 阿里云密码或镜像仓库密码 | `MyP@ssw0rd` |
| `ruoyi-plus` | 命名空间名称（自定义） | `mycompany` |
| `你的 ECS 公网 IP` | ECS 公网地址 | `47.100.xx.xx` |
| `~/.ssh/aliyun_ecs.pem` | SSH 密钥文件路径 | `/Users/xxx/.ssh/ecs.pem` |

---

## 八、故障排查

### 8.1 镜像推送失败

```bash
# 检查登录状态
docker login -u 你的账号 -p 你的密码 registry.cn-hangzhou.aliyuncs.com

# 检查网络连接
ping registry.cn-hangzhou.aliyuncs.com

# 使用 HTTPS 加速（国内）
export DOCKER_HUB_MIRROR=https://你的镜像加速器 ID.mirror.aliyuncs.com
```

### 8.2 ECS 连接失败

```bash
# 检查安全组
# 确保 ECS 安全组允许 22 端口入站

# 检查密钥权限
chmod 400 ~/.ssh/aliyun_ecs.pem

# 详细日志
ssh -vvv -i ~/.ssh/aliyun_ecs.pem root@你的 ECS IP
```

### 8.3 容器启动失败

```bash
# 查看日志
docker logs ry-server
docker logs ry-frontend

# 检查端口占用
netstat -tlnp | grep -E '80|8080'

# 资源检查
docker stats
free -h
df -h
```
