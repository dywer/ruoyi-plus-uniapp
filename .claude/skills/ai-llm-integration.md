# AI 与 LLM 集成技能 (AI & LLM Integration)

## 适用场景
- RAG 检索增强生成系统
- 向量数据库集成
- AI 大模型应用开发
- 智能客服系统
- 文档智能问答

## 核心技术栈

### AI/LLM 技术组件
| 组件 | 技术 | 说明 |
|------|------|------|
| 嵌入模型 | BGE/M3E | 中文文本向量化 |
| 向量数据库 | Milvus/Chroma | 向量存储与检索 |
| LLM 框架 | LangChain4j | Java 版 LangChain |
| 应用框架 | Spring AI | Spring 官方 AI 框架 |
| 向量搜索 | Elasticsearch | 混合搜索方案 |

### RAG 架构流程
```
┌─────────────────────────────────────────────────────────┐
│  文档导入  →  文本分块  →  向量化  →  存储向量数据库     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  用户问题  →  向量化  →  相似度检索  →  LLM 生成答案     │
└─────────────────────────────────────────────────────────┘
```

## Maven 依赖

### Spring AI 集成
```xml
<dependencies>
    <!-- Spring AI 核心 -->
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
        <version>1.0.0-M4</version>
    </dependency>
    
    <!-- Spring AI 向量存储 -->
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-pgvector-store-spring-boot-starter</artifactId>
        <version>1.0.0-M4</version>
    </dependency>
    
    <!-- LangChain4j (替代方案) -->
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-spring-boot-starter</artifactId>
        <version>0.34.0</version>
    </dependency>
    
    <!-- Milvus 向量数据库客户端 -->
    <dependency>
        <groupId>io.milvus</groupId>
        <artifactId>milvus-sdk-java</artifactId>
        <version>2.3.8</version>
    </dependency>
</dependencies>
```

## 向量数据库配置

### Milvus 配置
```yaml
milvus:
  host: localhost
  port: 19530
  username: root
  password: root123
  database: default
  collection: knowledge_base
  
spring:
  ai:
    vectorstore:
      milvus:
        enabled: true
        collection-name: knowledge_base
        dimension: 768  # BGE-M3 嵌入维度
```

### Chroma 配置（轻量级）
```yaml
spring:
  ai:
    vectorstore:
      chroma:
        enabled: true
        client:
          host: localhost
          port: 8000
        store:
          collection-name: knowledge_base
```

## 嵌入模型配置

### BGE-M3 嵌入模型
```java
@Configuration
public class EmbeddingConfig {

    @Bean
    public EmbeddingModel embeddingModel() {
        // 使用本地 BGE-M3 模型（通过 Ollama 部署）
        return new OllamaEmbeddingModel(
            OllamaApi.builder()
                .baseUrl("http://localhost:11434")
                .build(),
            OllamaEmbeddingOptions.builder()
                .model("bge-m3")
                .build()
        );
    }
    
    // 或使用 OpenAI Embedding
    @Bean
    public EmbeddingModel openAiEmbeddingModel(
            @Value("${openai.api-key}") String apiKey) {
        return new OpenAiEmbeddingModel(
            OpenAiApi.builder()
                .apiKey(apiKey)
                .build(),
            OpenAiEmbeddingOptions.builder()
                .model("text-embedding-3-small")
                .build()
        );
    }
}
```

## RAG 服务实现

### 文档处理服务
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentProcessingService {

    private final EmbeddingModel embeddingModel;
    private final VectorStore vectorStore;
    private final DocumentReader documentReader;

    /**
     * 导入文档
     */
    @Transactional
    public void importDocument(MultipartFile file, String category) {
        try {
            // 1. 读取文档内容
            List<Document> documents = documentReader.read(file);
            
            // 2. 文本分块（chunking）
            List<Document> chunks = chunkDocuments(documents, 500, 50);
            
            // 3. 添加元数据
            for (Document chunk : chunks) {
                chunk.getMetadata().put("category", category);
                chunk.getMetadata().put("source", file.getOriginalFilename());
                chunk.getMetadata().put("timestamp", System.currentTimeMillis());
            }
            
            // 4. 向量化并存储
            vectorStore.add(chunks);
            
            log.info("文档导入成功，共 {} 个分块", chunks.size());
        } catch (Exception e) {
            log.error("文档导入失败", e);
            throw new BusinessException("文档处理失败：" + e.getMessage());
        }
    }
    
    /**
     * 文档分块
     */
    private List<Document> chunkDocuments(List<Document> documents, 
                                           int chunkSize, int overlap) {
        List<Document> chunks = new ArrayList<>();
        
        for (Document doc : documents) {
            String content = doc.getContent();
            List<String> sentences = splitIntoSentences(content);
            
            StringBuilder currentChunk = new StringBuilder();
            for (String sentence : sentences) {
                if (currentChunk.length() + sentence.length() > chunkSize) {
                    // 保存当前分块
                    chunks.add(new Document(currentChunk.toString(), doc.getMetadata()));
                    // 保留重叠部分
                    currentChunk = new StringBuilder(
                        currentChunk.substring(currentChunk.length() - overlap)
                    );
                }
                currentChunk.append(sentence);
            }
            
            // 添加最后一个分块
            if (currentChunk.length() > 0) {
                chunks.add(new Document(currentChunk.toString(), doc.getMetadata()));
            }
        }
        
        return chunks;
    }
    
    private List<String> splitIntoSentences(String text) {
        return Arrays.asList(text.split("[.!?。！？]+"));
    }
}
```

### 问答服务
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class RagQaService {

    private final EmbeddingModel embeddingModel;
    private final VectorStore vectorStore;
    private final ChatClient chatClient;
    
    @Value("${rag.search.top-k:5}")
    private int topK;
    
    @Value("${rag.search.min-score:0.7}")
    private double minScore;

    /**
     * 智能问答
     */
    public QaResponse ask(String question, String category) {
        long startTime = System.currentTimeMillis();
        
        // 1. 问题向量化
        float[] questionEmbedding = embeddingModel.embed(question);
        
        // 2. 相似度检索
        SearchQuery query = SearchQuery.builder()
            .query(question)
            .topK(topK)
            .filterExpression(category != null ? "category == '" + category + "'" : null)
            .build();
        
        List<Document> relevantDocs = vectorStore.similaritySearch(query);
        
        // 3. 过滤低相关度文档
        List<Document> filteredDocs = relevantDocs.stream()
            .filter(doc -> calculateSimilarity(question, doc) >= minScore)
            .collect(Collectors.toList());
        
        if (filteredDocs.isEmpty()) {
            return QaResponse.noKnowledge(question);
        }
        
        // 4. 构建上下文
        String context = buildContext(filteredDocs);
        
        // 5. 调用 LLM 生成答案
        String prompt = buildPrompt(question, context);
        String answer = chatClient.prompt(prompt).call().content();
        
        // 6. 记录日志
        log.info("问答耗时：{}ms, 检索文档数：{}", 
            System.currentTimeMillis() - startTime, filteredDocs.size());
        
        return QaResponse.success(question, answer, filteredDocs);
    }
    
    /**
     * 构建上下文
     */
    private String buildContext(List<Document> docs) {
        return docs.stream()
            .map(Document::getContent)
            .collect(Collectors.joining("\n\n---\n\n"));
    }
    
    /**
     * 构建 Prompt
     */
    private String buildPrompt(String question, String context) {
        return String.format("""
            你是一个智能助手，请根据以下参考信息回答问题。
            
            【参考信息】
            %s
            
            【问题】
            %s
            
            【回答要求】
            1. 只根据参考信息回答，不要编造
            2. 如果参考信息不足以回答问题，请说明
            3. 回答简洁明了
            4. 如需引用原文，请注明出处
            
            【回答】
            """, context, question);
    }
    
    private double calculateSimilarity(String question, Document doc) {
        // 使用余弦相似度计算
        // 实际实现取决于 EmbeddingModel
        return 0.8; // 示例
    }
}
```

## 多模型路由

### 模型路由配置
```java
@Configuration
public class LlmRouterConfig {

    @Bean
    @Qualifier("simple-chat")
    public ChatClient simpleChatClient() {
        // 简单对话使用轻量模型
        return ChatClient.builder()
            .model("qwen-turbo")
            .temperature(0.7)
            .maxTokens(1000)
            .build();
    }
    
    @Bean
    @Qualifier("complex-reasoning")
    public ChatClient reasoningChatClient() {
        // 复杂推理使用强大模型
        return ChatClient.builder()
            .model("qwen-max")
            .temperature(0.3)
            .maxTokens(4000)
            .build();
    }
    
    @Bean
    @Qualifier("code-generation")
    public ChatClient codeChatClient() {
        // 代码生成使用代码专用模型
        return ChatClient.builder()
            .model("codellama-34b")
            .temperature(0.1)
            .maxTokens(2000)
            .build();
    }
}
```

### 智能路由服务
```java
@Service
@RequiredArgsConstructor
public class IntelligentRouterService {

    private final ChatClient simpleChatClient;
    private final ChatClient reasoningChatClient;
    private final ChatClient codeChatClient;
    
    /**
     * 根据问题类型路由到合适的模型
     */
    public Response routeAndAnswer(UserQuery query) {
        QueryType type = classifyQuery(query.getContent());
        
        ChatClient client = switch (type) {
            case SIMPLE -> simpleChatClient;
            case REASONING, MATH -> reasoningChatClient;
            case CODE -> codeChatClient;
            default -> simpleChatClient;
        };
        
        String response = client.prompt(query.getContent())
            .call()
            .content();
        
        return Response.success(response);
    }
    
    /**
     * 简单的问题分类
     */
    private QueryType classifyQuery(String content) {
        // 简单的基于规则的ha]s
        if (content.contains("```") || content.contains("代码") || 
            content.contains("function") || content.contains("class")) {
            return QueryType.CODE;
        }
        
        if (content.contains("为什么") || content.contains("如何证明") ||
            content.contains("推理") || content.contains("计算")) {
            return QueryType.REASONING;
        }
        
        return QueryType.SIMPLE;
    }
    
    enum QueryType {
        SIMPLE, REASONING, MATH, CODE
    }
}
```

## AI Agent 实现

### 工具定义
```java
/**
 * 可调用工具接口
 */
public interface ToolFunction {
    String getName();
    String getDescription();
    String execute(String input);
}

/**
 * 计算器工具
 */
@Component
public class CalculatorTool implements ToolFunction {
    
    @Override
    public String getName() {
        return "calculator";
    }
    
    @Override
    public String getDescription() {
        return "执行数学计算，支持加减乘除";
    }
    
    @Override
    public String execute(String input) {
        // 解析并计算表达式
        return String.valueOf(evaluateExpression(input));
    }
    
    private double evaluateExpression(String expr) {
        // 简化实现，实际应使用表达式解析器
        return 0;
    }
}

/**
 * 数据库查询工具
 */
@Component
public class DatabaseQueryTool implements ToolFunction {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Override
    public String getName() {
        return "database_query";
    }
    
    @Override
    public String getDescription() {
        return "查询数据库获取业务数据";
    }
    
    @Override
    public String execute(String sql) {
        // 注意：实际场景需要 SQL 注入防护
        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql);
        return toJson(results);
    }
}
```

### Agent 执行器
```java
@Service
@RequiredArgsConstructor
public class AgentExecutor {

    private final ChatClient chatClient;
    private final List<ToolFunction> tools;

    /**
     * 执行 Agent 任务（支持工具调用）
     */
    public Response executeAgentTask(String task) {
        String toolsDescription = buildToolsDescription();
        
        String systemPrompt = String.format("""
            你是一个智能 Agent，可以调用以下工具完成任务：
            
            %s
            
            请逐步思考：
            1. 分析任务需要什么工具
            2. 按顺序调用工具
            3. 整合工具返回结果
            4. 给出最终答案
            
            工具调用格式：
            CALL_TOOL: tool_name, input
            """, toolsDescription);
        
        // 多轮对话执行
        List<String> conversation = new ArrayList<>();
        conversation.add("System: " + systemPrompt);
        conversation.add("User: " + task);
        
        for (int i = 0; i < 5; i++) { // 最多 5 轮
            String response = chatClient.prompt(String.join("\n", conversation))
                .call()
                .content();
            
            if (response.contains("CALL_TOOL:")) {
                // 解析并执行工具调用
                ToolCall toolCall = parseToolCall(response);
                String result = executeTool(toolCall);
                conversation.add("Assistant: " + response);
                conversation.add("Tool Result: " + result);
            } else {
                // 返回最终答案
                return Response.success(response);
            }
        }
        
        return Response.error("任务执行超时");
    }
    
    private ToolCall parseToolCall(String response) {
        // 解析 CALL_TOOL: tool_name, input
        String[] parts = response.split("CALL_TOOL:\\s*")[1].split(",");
        return new ToolCall(parts[0].trim(), parts[1].trim());
    }
    
    private String executeTool(ToolCall call) {
        return tools.stream()
            .filter(t -> t.getName().equals(call.toolName))
            .findFirst()
            .map(t -> t.execute(call.input))
            .orElse("工具不存在");
    }
    
    private String buildToolsDescription() {
        return tools.stream()
            .map(t -> "- " + t.getName() + ": " + t.getDescription())
            .collect(Collectors.joining("\n"));
    }
    
    record ToolCall(String toolName, String input) {}
}
```

## 检查清单

### RAG 系统
- [ ] 文档分块策略合理
- [ ] 嵌入模型选择适当
- [ ] 向量检索准确率达标
- [ ] 上下文窗口利用充分
- [ ] 答案生成质量可控

### 性能优化
- [ ] 向量检索使用索引
- [ ] 缓存热点问题答案
- [ ] 批量向量化处理
- [ ] 异步处理长任务

### 安全合规
- [ ] 敏感数据脱敏处理
- [ ] 内容安全过滤
- [ ] 版权信息保留
- [ ] 审计日志完整
