# AI LangChain4j - AI 大模型集成

## 职责范围

规范 RuoYi-Vue-Plus 项目中使用 LangChain4j 框架集成大语言模型（LLM）的开发实践，包括 RAG 检索增强生成、向量数据库、AI Agent、智能对话等功能。

---

## 核心规范

### 1. Maven 依赖配置

```xml
<dependencies>
    <!-- LangChain4j 核心 -->
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j</artifactId>
        <version>1.0.0-beta1</version>
    </dependency>

    <!-- OpenAI 模型支持 -->
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-open-ai</artifactId>
        <version>1.0.0-beta1</version>
    </dependency>

    <!-- 本地模型支持（Ollama） -->
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-ollama</artifactId>
        <version>1.0.0-beta1</version>
    </dependency>

    <!-- 向量数据库（Chroma） -->
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-chroma</artifactId>
        <version>1.0.0-beta1</version>
    </dependency>

    <!-- 向量数据库（Milvus） -->
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-milvus</artifactId>
        <version>1.0.0-beta1</version>
    </dependency>

    <!-- PDF 文档解析 -->
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-document-parser-apache-pdfbox</artifactId>
        <version>1.0.0-beta1</version>
    </dependency>

    <!-- Easy RAG -->
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-easy-rag</artifactId>
        <version>1.0.0-beta1</version>
    </dependency>
</dependencies>
```

### 2. AI 配置类

```java
@Configuration
@ConfigurationProperties(prefix = "ai")
@Data
public class AiProperties {

    /**
     * 模型类型（openai/ollama/qwen）
     */
    private String model = "openai";

    /**
     * OpenAI API Key
     */
    private String openaiApiKey;

    /**
     * OpenAI API URL
     */
    private String openaiBaseUrl = "https://api.openai.com/v1";

    /**
     * 模型名称
     */
    private String modelName = "gpt-4o-mini";

    /**
     * Ollama 地址
     */
    private String ollamaBaseUrl = "http://localhost:11434";

    /**
     * Ollama 模型名称
     */
    private String ollamaModelName = "qwen2.5:7b";

    /**
     * 向量数据库类型（chroma/milvus）
     */
    private String vectorStore = "chroma";

    /**
     * Chroma URL
     */
    private String chromaUrl = "http://localhost:8000";

    /**
     * Milvus URL
     */
    private String milvusUrl = "http://localhost:19530";

    /**
     * 温度参数（0.0-1.0）
     */
    private Double temperature = 0.7;

    /**
     * 最大 Token 数
     */
    private Integer maxTokens = 2048;
}
```

```yaml
# application.yml
ai:
  model: openai
  openai-api-key: ${OPENAI_API_KEY}
  openai-base-url: https://api.openai.com/v1
  model-name: gpt-4o-mini
  temperature: 0.7
  max-tokens: 2048
  vector-store: chroma
  chroma-url: http://localhost:8000
```

### 3. AI 服务配置

```java
@Configuration
public class AiConfig {

    @Autowired
    private AiProperties aiProperties;

    /**
     * 创建 ChatLanguageModel
     */
    @Bean
    public ChatLanguageModel chatLanguageModel() {
        if ("ollama".equals(aiProperties.getModel())) {
            return OllamaChatModel.builder()
                .baseUrl(aiProperties.getOllamaBaseUrl())
                .modelName(aiProperties.getOllamaModelName())
                .temperature(aiProperties.getTemperature())
                .maxRetries(3)
                .logRequests(true)
                .logResponses(true)
                .build();
        } else {
            return OpenAiChatModel.builder()
                .baseUrl(aiProperties.getOpenaiBaseUrl())
                .apiKey(aiProperties.getOpenaiApiKey())
                .modelName(aiProperties.getModelName())
                .temperature(aiProperties.getTemperature())
                .maxTokens(aiProperties.getMaxTokens())
                .logRequests(true)
                .logResponses(true)
                .build();
        }
    }

    /**
     * 创建 EmbeddingModel
     */
    @Bean
    public EmbeddingModel embeddingModel() {
        if ("ollama".equals(aiProperties.getModel())) {
            return OllamaEmbeddingModel.builder()
                .baseUrl(aiProperties.getOllamaBaseUrl())
                .modelName(aiProperties.getOllamaModelName())
                .build();
        } else {
            return OpenAiEmbeddingModel.builder()
                .baseUrl(aiProperties.getOpenaiBaseUrl())
                .apiKey(aiProperties.getOpenaiApiKey())
                .modelName("text-embedding-3-small")
                .build();
        }
    }

    /**
     * 创建向量数据库
     */
    @Bean
    public EmbeddingStore<TextSegment> embeddingStore(EmbeddingModel embeddingModel) {
        if ("chroma".equals(aiProperties.getVectorStore())) {
            return ChromaEmbeddingStore.builder()
                .baseUrl(aiProperties.getChromaUrl())
                .collectionName("ruoyi-documents")
                .build();
        } else if ("milvus".equals(aiProperties.getVectorStore())) {
            return MilvusEmbeddingStore.builder()
                .host("localhost")
                .port(19530)
                .collectionName("ruoyi-documents")
                .dimension(1536)
                .build();
        }
        throw new IllegalArgumentException("不支持的向量数据库类型：" + aiProperties.getVectorStore());
    }
}
```

### 4. AI 对话服务

```java
@Service
public class AiChatService {

    @Autowired
    private ChatLanguageModel chatModel;

    /**
     * 简单对话
     */
    public String chat(String userMessage) {
        return chatModel.chat(userMessage);
    }

    /**
     * 带系统提示词的对话
     */
    public String chatWithSystem(String systemPrompt, String userMessage) {
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(SystemMessage.from(systemPrompt));
        messages.add(UserMessage.from(userMessage));

        Response<AiMessage> response = chatModel.generate(messages);
        return response.content().text();
    }

    /**
     * 多轮对话
     */
    public String multiTurnChat(List<ChatMessage> messages) {
        Response<AiMessage> response = chatModel.generate(messages);
        return response.content().text();
    }

    /**
     * 流式对话
     */
    public TokenStream streamingChat(String userMessage, StreamingResponseHandler<String> handler) {
        return chatModel.generate(userMessage, handler);
    }
}
```

### 5. RAG 检索增强生成

```java
@Service
public class RagService {

    @Autowired
    private ChatLanguageModel chatModel;

    @Autowired
    private EmbeddingModel embeddingModel;

    @Autowired
    private EmbeddingStore<TextSegment> embeddingStore;

    private EmbeddingStoreIngestor ingestor;

    @PostConstruct
    public void init() {
        this.ingestor = EmbeddingStoreIngestor.builder()
            .embeddingModel(embeddingModel)
            .embeddingStore(embeddingStore)
            .build();
    }

    /**
     *  ingest 文档
     */
    public void ingestDocument(MultipartFile file) {
        try {
            Path tempFile = Files.createTempFile("doc-", ".txt");
            file.transferTo(tempFile);

            Document document = Document.from(tempFile);
            ingestor.ingest(document);

            Files.delete(tempFile);
        } catch (IOException e) {
            throw new ServiceException("文档导入失败", e);
        }
    }

    /**
     * RAG 检索问答
     */
    public String ragQuery(String query, int maxResults) {
        // 向量化查询
        Embedding queryEmbedding = embeddingModel.embed(query).content();

        // 检索相关文档
        List<EmbeddingMatch<TextSegment>> matches = embeddingStore.findRelevant(
            queryEmbedding,
            maxResults
        );

        // 构建上下文
        StringBuilder context = new StringBuilder();
        for (EmbeddingMatch<TextSegment> match : matches) {
            context.append(match.embedded().text()).append("\n\n");
        }

        // 构建提示词
        String systemPrompt = String.format(
            "你是一个智能助手。请根据以下上下文回答用户的问题：\n\n%s",
            context.toString()
        );

        return chatWithSystem(systemPrompt, query);
    }

    /**
     * 使用 AI 助手进行对话
     */
    public Assistant createAssistant(String instructions) {
        return AiServices.builder(Assistant.class)
            .chatLanguageModel(chatModel)
            .contentRetriever(createContentRetriever())
            .build();
    }

    private ContentRetriever createContentRetriever() {
        return new EmbeddingStoreContentRetriever(embeddingStore, embeddingModel);
    }

    /**
     * AI 助手接口
     */
    interface Assistant {
        String chat(String userMessage);
    }
}
```

### 6. AI Controller

```java
@RestController
@RequestMapping("/ai")
public class AiController {

    @Autowired
    private AiChatService aiChatService;

    @Autowired
    private RagService ragService;

    /**
     * 简单对话
     */
    @PostMapping("/chat")
    public AjaxResult chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String response = aiChatService.chat(message);
        return AjaxResult.success().put("response", response);
    }

    /**
     * 流式对话（SSE）
     */
    @GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamingChat(
        @RequestParam String message
    ) {
        return Flux.create(emitter -> {
            aiChatService.streamingChat(message, new StreamingResponseHandler<String>() {
                @Override
                public void onNext(String token) {
                    emitter.next(ServerSentEvent.builder(token).build());
                }

                @Override
                public void onComplete(String response) {
                    emitter.complete();
                }

                @Override
                public void onError(Throwable error) {
                    emitter.error(error);
                }
            });
        });
    }

    /**
     * 上传文档
     */
    @PostMapping("/rag/ingest")
    public AjaxResult ingestDocument(@RequestParam("file") MultipartFile file) {
        ragService.ingestDocument(file);
        return AjaxResult.success("文档导入成功");
    }

    /**
     * RAG 检索问答
     */
    @PostMapping("/rag/query")
    public AjaxResult ragQuery(@RequestBody Map<String, Object> request) {
        String query = (String) request.get("query");
        Integer maxResults = (Integer) request.getOrDefault("maxResults", 3);

        String response = ragService.ragQuery(query, maxResults);
        return AjaxResult.success().put("response", response);
    }
}
```

### 7. AI Agent 设计

```java
@Service
public class AiAgentService {

    @Autowired
    private ChatLanguageModel chatModel;

    @Autowired
    private EmbeddingModel embeddingModel;

    @Autowired
    private EmbeddingStore<TextSegment> embeddingStore;

    /**
     * 创建数据分析 Agent
     */
    public DataAnalysisAgent createDataAnalysisAgent() {
        return AiServices.builder(DataAnalysisAgent.class)
            .chatLanguageModel(chatModel)
            .tools(new DataAnalysisTools())
            .build();
    }

    /**
     * 创建客服 Agent
     */
    public CustomerServiceAgent createCustomerServiceAgent() {
        String instructions = "你是一个专业的客服助手，负责回答用户关于 RuoYi 框架的问题。";

        return AiServices.builder(CustomerServiceAgent.class)
            .chatLanguageModel(chatModel)
            .contentRetriever(createContentRetriever())
            .systemMessageProvider(chatMemoryId -> instructions)
            .build();
    }

    /**
     * 创建代码审查 Agent
     */
    public CodeReviewAgent createCodeReviewAgent() {
        String instructions = "你是一个专业的代码审查助手，负责审查 Java 代码的质量、安全性和规范性。";

        return AiServices.builder(CodeReviewAgent.class)
            .chatLanguageModel(chatModel)
            .systemMessageProvider(chatMemoryId -> instructions)
            .build();
    }

    private ContentRetriever createContentRetriever() {
        return new EmbeddingStoreContentRetriever(embeddingStore, embeddingModel);
    }

    /**
     * 数据分析 Agent 接口
     */
    interface DataAnalysisAgent {
        String analyze(String data);

        @Tool("计算两个数的和")
        double add(double a, double b);

        @Tool("计算两个数的积")
        double multiply(double a, double b);
    }

    /**
     * 客服 Agent 接口
     */
    interface CustomerServiceAgent {
        String chat(String userMessage);
    }

    /**
     * 代码审查 Agent 接口
     */
    interface CodeReviewAgent {
        String review(String code);
    }
}
```

### 8. 工具类封装

```java
@Component
public class DataAnalysisTools {

    /**
     * 查询数据库统计
     */
    @Tool("查询系统中的统计数据")
    public String queryStatistics(String metric) {
        // 实现数据库查询逻辑
        return "统计数据：" + metric;
    }

    /**
     * 发送通知
     */
    @Tool("发送系统通知")
    public void sendNotification(String message, String recipient) {
        // 实现通知发送逻辑
        log.info("发送通知给 {}: {}", recipient, message);
    }
}
```

### 9. 响应式 AI 服务（WebFlux）

```java
@Service
@RequiredArgsConstructor
public class ReactiveAiService {

    private final ChatLanguageModel chatModel;

    /**
     * 流式响应
     */
    public Flux<String> streamResponse(String userMessage) {
        return Flux.create(emitter -> {
            chatModel.generate(userMessage, new StreamingResponseHandler<String>() {
                @Override
                public void onNext(String token) {
                    emitter.next(token);
                }

                @Override
                public void onComplete(String response) {
                    emitter.complete();
                }

                @Override
                public void onError(Throwable error) {
                    emitter.error(error);
                }
            });
        });
    }
}
```

---

## 配置文件

```yaml
# application.yml
ai:
  model: openai
  openai-api-key: ${OPENAI_API_KEY:your-api-key}
  openai-base-url: https://api.openai.com/v1
  model-name: gpt-4o-mini
  temperature: 0.7
  max-tokens: 2048
  vector-store: chroma
  chroma-url: http://localhost:8000

# Ollama 配置（可选）
ollama:
  enabled: false
  base-url: http://localhost:11434
  model-name: qwen2.5:7b
```

---

## 触发关键词

- AI
- LLM
- 大模型
- LangChain4j
- RAG
- 向量数据库
- Chat
- Agent
- 智能对话
-  embeddings

---

## 相关文件

- [performance-optimization.md](./performance-optimization.md) - 性能优化
- [security-guard.md](./security-guard.md) - 安全防护

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
