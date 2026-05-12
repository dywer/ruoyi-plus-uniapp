# DevOps 与 CI/CD 技能 (DevOps and CI/CD Best Practices)

## 适用场景
- CI/CD 流水线设计
- 自动化部署配置
- Docker 容器化
- Kubernetes 编排
- 监控告警设置

## 核心技术栈

### CI/CD 工具
| 工具 | 用途 | 适用场景 |
|------|------|----------|
| GitHub Actions | CI/CD 流水线 | GitHub 项目 |
| Jenkins | 持续集成/部署 | 企业自建 |
| GitLab CI | 一体化 DevOps | GitLab 项目 |
| ArgoCD | GitOps 部署 | K8s 环境 |

### 容器化技术
| 工具 | 用途 |
|------|------|
| Docker | 容器打包 |
| Docker Compose | 本地多容器编排 |
| Kubernetes | 生产环境编排 |
| Helm | K8s 包管理 |

### 监控工具
| 工具 | 用途 |
|------|------|
| Prometheus | 指标监控 |
| Grafana | 可视化看板 |
| ELK Stack | 日志分析 |
| SkyWalking | 链路追踪 |

## GitHub Actions 配置

### 基础 CI 流水线
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: maven
    
    - name: Build with Maven
      run: mvn -B package --file pom.xml
    
    - name: Run tests
      run: mvn test
    
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results
        path: target/surefire-reports/
```

### 带缓存的构建
```yaml
name: CI with Cache

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Cache Maven dependencies
      uses: actions/cache@v4
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
        restore-keys: ${{ runner.os }}-m2
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Build
      run: mvn -B package -DskipTests
    
    - name: Run tests
      run: mvn test
    
    - name: Upload JAR
      uses: actions/upload-artifact@v4
      with:
        name: application
        path: target/*.jar
```

### 多环境部署
```yaml
# .github/workflows/deploy.yml
name: Deploy Pipeline

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy-dev:
    runs-on: ubuntu-latest
    environment: development
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Build Docker image
      run: |
        docker build -t myapp:${{ github.ref_name }} .
    
    - name: Push to Registry
      run: |
        docker push myapp:${{ github.ref_name }}
    
    - name: Deploy to Dev
      run: |
        kubectl set image deployment/myapp myapp=myapp:${{ github.ref_name }}
        -n development

  deploy-prod:
    runs-on: ubuntu-latest
    environment: production
    needs: deploy-dev
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Prod
      run: |
        kubectl set image deployment/myapp myapp=myapp:${{ github.ref_name }}
        -n production
```

### 代码质量检查
```yaml
name: Code Quality

on:
  pull_request:
    branches: [main]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Run Spotless Check
      run: mvn spotless:check
    
    - name: Run PMD
      run: mvn pmd:check
    
    - name: Run SpotBugs
      run: mvn spotbugs:check
    
    - name: Check test coverage
      run: mvn jacoco:check
    
    - name: SonarQube Scan
      uses: sonarsource/sonarqube-scan-action@v4
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

## Docker 配置

### Dockerfile 模板 (Spring Boot)
```dockerfile
# 多阶段构建
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser

COPY --from=build /app/target/*.jar app.jar

# 设置时区
ENV TZ=Asia/Shanghai

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Docker Compose (开发环境)
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/ry-vue
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=root123
      - SPRING_DATA_REDIS_HOST=redis
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - ruoyi-network

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: ry-vue
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./sql:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ruoyi-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - ruoyi-network

networks:
  ruoyi-network:
    driver: bridge

volumes:
  mysql-data:
  redis-data:
```

## Kubernetes 配置

### Deployment 配置
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ruoyi-app
  namespace: production
  labels:
    app: ruoyi
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ruoyi
  template:
    metadata:
      labels:
        app: ruoyi
    spec:
      containers:
      - name: app
        image: myregistry/ruoyi:v1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: JAVA_OPTS
          value: "-Xms512m -Xmx1024m"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
```

### Service 配置
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ruoyi-service
  namespace: production
spec:
  selector:
    app: ruoyi
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ruoyi-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ruoyi-service
            port:
              number: 80
```

### ConfigMap 和 Secret
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ruoyi-config
  namespace: production
data:
  application.yml: |
    server:
      port: 8080
    spring:
      profiles:
        active: prod
    logging:
      level:
        root: INFO
        org.dromara: DEBUG
---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ruoyi-secrets
  namespace: production
type: Opaque
stringData:
  DB_PASSWORD: "your-db-password"
  REDIS_PASSWORD: "your-redis-password"
  JWT_SECRET: "your-jwt-secret"
```

## 监控配置

### Prometheus 配置
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ruoyi-app'
    static_configs:
      - targets: ['ruoyi-service:8080']
    metrics_path: '/actuator/prometheus'
```

### Grafana 告警规则
```yaml
# alerting-rules.yml
groups:
- name: ruoyi-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "高错误率告警"
      description: "应用 {{ $labels.instance }} 错误率超过阈值"
  
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "高响应时间告警"
      description: "应用 {{ $labels.instance }} P95 响应时间超过 2 秒"
```

## 检查清单

### CI/CD 检查
- [ ] 代码提交触发自动构建
- [ ] 单元测试自动执行
- [ ] 代码质量检查通过
- [ ] 构建产物自动归档
- [ ] 部署流程自动化

### Docker 检查
- [ ] 使用多阶段构建减小镜像体积
- [ ] 使用非 root 用户运行
- [ ] 设置合理的健康检查
- [ ] 配置资源限制
- [ ] 敏感信息不写入镜像

### K8s 检查
- [ ] 配置资源请求和限制
- [ ] 设置健康检查探针
- [ ] 使用 ConfigMap/Secret管理配置
- [ ] 配置 HPA 自动扩缩容
- [ ] 设置 Pod 反亲和性

### 监控检查
- [ ] 关键指标采集完整
- [ ] 告警规则配置合理
- [ ] 告警通知渠道畅通
- [ ] 日志集中收集
- [ ] 链路追踪启用
