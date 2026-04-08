# File OSS Management - 文件上传与 OSS 管理

## 职责范围

规范 RuoYi-Vue-Plus 项目中文件上传、对象存储（OSS）集成、文件管理、图片处理等功能的开发实践。

---

## 核心规范

### 1. 文件上传实体设计

```java
@Data
@TableName("sys_file")
public class SysFile extends BaseEntity {

    /**
     * 文件 ID
     */
    @TableId(type = IdType.ASSIGN_ID)
    private Long fileId;

    /**
     * 文件名称
     */
    private String fileName;

    /**
     * 文件原名
     */
    private String originalName;

    /**
     * 文件后缀
     */
    private String fileSuffix;

    /**
     * 文件类型（image/video/audio/document/other）
     */
    private String fileType;

    /**
     * 文件大小（字节）
     */
    private Long fileSize;

    /**
     * 文件 URL
     */
    private String fileUrl;

    /**
     * OSS 对象键
     */
    private String objectKey;

    /**
     * 上传用户 ID
     */
    private Long userId;

    /**
     * 上传部门 ID
     */
    private Long deptId;

    /**
     * 删除标记
     */
    private Boolean deleted;
}
```

### 2. 文件上传服务接口

```java
public interface FileService {

    /**
     * 上传文件
     */
    FileInfo upload(MultipartFile file, FileUploadRequest request);

    /**
     * 上传文件到指定路径
     */
    FileInfo upload(MultipartFile file, String dir);

    /**
     * 根据 URL 下载并上传
     */
    FileInfo uploadFromUrl(String url, String dir);

    /**
     * 删除文件
     */
    void delete(Long fileId);

    /**
     * 批量删除文件
     */
    void deleteBatch(List<Long> fileIds);

    /**
     * 获取文件信息
     */
    FileInfo getById(Long fileId);

    /**
     * 生成临时访问 URL
     */
    String generatePresignedUrl(Long fileId, Duration expiration);
}
```

### 3. OSS 配置

```java
@Configuration
@ConfigurationProperties(prefix = "oss")
@Data
public class OssProperties {

    /**
     * OSS 类型（aliyun/tencent/qiniu/minio）
     */
    private String type = "aliyun";

    /**
     * 端点
     */
    private String endpoint;

    /**
     * Access Key
     */
    private String accessKeyId;

    /**
     * Access Key Secret
     */
    private String accessKeySecret;

    /**
     * Bucket 名称
     */
    private String bucketName;

    /**
     * 自定义域名
     */
    private String customDomain;

    /**
     * 是否启用 HTTPS
     */
    private Boolean https = true;
}
```

```yaml
# application.yml
oss:
  type: aliyun
  endpoint: oss-cn-hangzhou.aliyuncs.com
  access-key-id: ${OSS_ACCESS_KEY_ID}
  access-key-secret: ${OSS_ACCESS_KEY_SECRET}
  bucket-name: ruoyi-prod
  custom-domain: https://cdn.example.com
  https: true
```

### 4. 阿里云 OSS 实现

```java
@Service
@Slf4j
public class AliyunOssService implements OssService {

    @Autowired
    private OssProperties ossProperties;

    private OSS ossClient;

    @PostConstruct
    public void init() {
        this.ossClient = OSSClientBuilder.create()
            .endpoint(ossProperties.getEndpoint())
            .credentialsProvider(new StaticCredentialsProvider(
                new BasicCredentials(
                    ossProperties.getAccessKeyId(),
                    ossProperties.getAccessKeySecret()
                )
            ))
            .build();
    }

    @Override
    public FileInfo upload(MultipartFile file, String dir) {
        try {
            // 生成对象键
            String objectKey = generateObjectKey(file.getOriginalFilename(), dir);
            
            // 上传到 OSS
            ossClient.putObject(
                ossProperties.getBucketName(),
                objectKey,
                file.getInputStream()
            );

            // 生成访问 URL
            String url = buildFileUrl(objectKey);

            // 构建文件信息
            return FileInfo.builder()
                .fileName(getFileName(objectKey))
                .originalName(file.getOriginalFilename())
                .fileSuffix(getFileSuffix(file.getOriginalFilename()))
                .fileType(detectFileType(file.getOriginalFilename()))
                .fileSize(file.getSize())
                .fileUrl(url)
                .objectKey(objectKey)
                .build();

        } catch (Exception e) {
            log.error("上传文件到 OSS 失败", e);
            throw new ServiceException("文件上传失败", e);
        }
    }

    @Override
    public void delete(String objectKey) {
        try {
            ossClient.deleteObject(ossProperties.getBucketName(), objectKey);
        } catch (Exception e) {
            log.error("删除 OSS 文件失败：{}", objectKey, e);
            throw new ServiceException("删除文件失败", e);
        }
    }

    @Override
    public String generatePresignedUrl(String objectKey, Duration expiration) {
        Date expirationDate = Date.from(Instant.now().plus(expiration));
        URL url = ossClient.generatePresignedUrl(
            ossProperties.getBucketName(),
            objectKey,
            expirationDate
        );
        return url.toString();
    }

    private String generateObjectKey(String originalName, String dir) {
        String suffix = getFileSuffix(originalName);
        String timestamp = String.valueOf(System.currentTimeMillis());
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return String.format("%s/%s_%s.%s", dir, timestamp, uuid, suffix);
    }

    private String buildFileUrl(String objectKey) {
        if (StringUtils.isNotBlank(ossProperties.getCustomDomain())) {
            return ossProperties.getCustomDomain() + "/" + objectKey;
        }
        return String.format("https://%s.%s/%s",
            ossProperties.getBucketName(),
            ossProperties.getEndpoint(),
            objectKey
        );
    }

    private String detectFileType(String fileName) {
        String suffix = getFileSuffix(fileName).toLowerCase();
        if (List.of("jpg", "jpeg", "png", "gif", "bmp", "webp").contains(suffix)) {
            return "image";
        } else if (List.of("mp4", "avi", "mov", "wmv").contains(suffix)) {
            return "video";
        } else if (List.of("mp3", "wav", "flac").contains(suffix)) {
            return "audio";
        } else if (List.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx").contains(suffix)) {
            return "document";
        }
        return "other";
    }
}
```

### 5. 文件上传 Controller

```java
@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final OssService ossService;

    /**
     * 单文件上传
     */
    @PostMapping("/upload")
    @SaCheckPermission("system:file:upload")
    public AjaxResult uploadFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "dir", defaultValue = "upload") String dir
    ) {
        if (file.isEmpty()) {
            return AjaxResult.error("上传文件不能为空");
        }

        // 校验文件大小（默认 10MB）
        if (file.getSize() > 10 * 1024 * 1024) {
            return AjaxResult.error("文件大小不能超过 10MB");
        }

        // 上传到 OSS
        FileInfo fileInfo = ossService.upload(file, dir);

        // 保存到数据库
        SysFile sysFile = convertToFile(fileInfo);
        fileService.save(sysFile);

        return AjaxResult.success()
            .put("fileId", sysFile.getFileId())
            .put("fileName", sysFile.getFileName())
            .put("fileUrl", sysFile.getFileUrl());
    }

    /**
     * 多文件上传
     */
    @PostMapping("/upload/batch")
    @SaCheckPermission("system:file:upload")
    public AjaxResult uploadBatch(
        @RequestParam("files") List<MultipartFile> files,
        @RequestParam(value = "dir", defaultValue = "upload") String dir
    ) {
        List<Map<String, Object>> result = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }

            FileInfo fileInfo = ossService.upload(file, dir);
            SysFile sysFile = convertToFile(fileInfo);
            fileService.save(sysFile);

            result.add(Map.of(
                "fileId", sysFile.getFileId(),
                "fileName", sysFile.getFileName(),
                "fileUrl", sysFile.getFileUrl()
            ));
        }

        return AjaxResult.success(result);
    }

    /**
     * 根据 ID 删除文件
     */
    @DeleteMapping("/{fileId}")
    @SaCheckPermission("system:file:delete")
    public AjaxResult deleteFile(@PathVariable Long fileId) {
        SysFile sysFile = fileService.getById(fileId);
        if (sysFile == null) {
            return AjaxResult.error("文件不存在");
        }

        // 删除 OSS 文件
        ossService.delete(sysFile.getObjectKey());

        // 删除数据库记录
        fileService.removeById(fileId);

        return AjaxResult.success();
    }

    /**
     * 生成临时访问链接
     */
    @GetMapping("/{fileId}/presigned-url")
    public AjaxResult getPresignedUrl(
        @PathVariable Long fileId,
        @RequestParam(value = "expires", defaultValue = "3600") Long expires
    ) {
        SysFile sysFile = fileService.getById(fileId);
        if (sysFile == null) {
            return AjaxResult.error("文件不存在");
        }

        String url = ossService.generatePresignedUrl(
            sysFile.getObjectKey(),
            Duration.ofSeconds(expires)
        );

        return AjaxResult.success().put("url", url);
    }
}
```

### 6. 图片处理服务

```java
@Service
public class ImageProcessService {

    @Autowired
    private OssService ossService;

    /**
     * 生成图片缩略图
     */
    public String generateThumbnail(String objectKey, int width, int height) {
        // 获取原图
        InputStream inputStream = ossService.getObject(objectKey);

        // 生成缩略图
        Thumbnails.Builder builder = Thumbnails.of(inputStream)
            .size(width, height)
            .keepAspectRatio(true)
            .outputQuality(0.8f)
            .outputFormat("jpg");

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try {
            builder.toOutputStream(outputStream);
        } catch (IOException e) {
            throw new ServiceException("生成缩略图失败", e);
        }

        // 上传缩略图
        String thumbnailKey = objectKey.replaceFirst(
            "(\\.[a-z]+)$",
            "_thumbnail" + "$1"
        );
        ossService.putObject(
            thumbnailKey,
            new ByteArrayInputStream(outputStream.toByteArray())
        );

        return thumbnailKey;
    }

    /**
     * 生成图片水印
     */
    public String addWatermark(String objectKey, String watermarkText) {
        // 获取原图
        InputStream inputStream = ossService.getObject(objectKey);

        // 添加水印
        BufferedImage image = null;
        try {
            image = ImageIO.read(inputStream);
        } catch (IOException e) {
            throw new ServiceException("读取图片失败", e);
        }

        Graphics2D g2d = image.createGraphics();
        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("Microsoft YaHei", Font.BOLD, 24));
        g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_ATOP, 0.5f));

        // 计算水印位置（右下角）
        int x = image.getWidth() - g2d.getFontMetrics().stringWidth(watermarkText) - 10;
        int y = image.getHeight() - 10;
        g2d.drawString(watermarkText, x, y);
        g2d.dispose();

        // 上传带水印的图片
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try {
            ImageIO.write(image, "jpg", outputStream);
        } catch (IOException e) {
            throw new ServiceException("保存图片失败", e);
        }

        String watermarkKey = objectKey.replaceFirst(
            "(\\.[a-z]+)$",
            "_watermark" + "$1"
        );
        ossService.putObject(
            watermarkKey,
            new ByteArrayInputStream(outputStream.toByteArray())
        );

        return watermarkKey;
    }

    /**
     * 获取图片信息
     */
    public ImageInfo getImageInfo(String objectKey) {
        InputStream inputStream = ossService.getObject(objectKey);

        try {
            BufferedImage image = ImageIO.read(inputStream);
            return ImageInfo.builder()
                .width(image.getWidth())
                .height(image.getHeight())
                .format(getImageFormat(objectKey))
                .build();
        } catch (IOException e) {
            throw new ServiceException("获取图片信息失败", e);
        }
    }
}
```

### 7. 文件类型校验

```java
@Component
public class FileValidator {

    /**
     * 允许的图片后缀
     */
    private static final Set<String> IMAGE_SUFFIXES = Set.of(
        "jpg", "jpeg", "png", "gif", "bmp", "webp"
    );

    /**
     * 允许的文档后缀
     */
    private static final Set<String> DOCUMENT_SUFFIXES = Set.of(
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"
    );

    /**
     * 校验文件类型
     */
    public void validate(MultipartFile file, String... allowedTypes) {
        if (file.isEmpty()) {
            throw new ServiceException("上传文件不能为空");
        }

        String originalName = file.getOriginalFilename();
        String suffix = getFileSuffix(originalName).toLowerCase();

        // 校验后缀
        for (String type : allowedTypes) {
            if ("image".equals(type) && IMAGE_SUFFIXES.contains(suffix)) {
                return;
            }
            if ("document".equals(type) && DOCUMENT_SUFFIXES.contains(suffix)) {
                return;
            }
        }

        throw new ServiceException("不支持的文件类型：" + suffix);
    }

    /**
     * 校验文件大小
     */
    public void validateSize(MultipartFile file, long maxSize) {
        if (file.getSize() > maxSize) {
            throw new ServiceException(
                String.format("文件大小不能超过 %sMB", maxSize / 1024 / 1024)
            );
        }
    }

    /**
     * 校验文件内容（通过魔数）
     */
    public void validateContent(MultipartFile file, String... allowedTypes) {
        try {
            byte[] header = new byte[16];
            InputStream inputStream = file.getInputStream();
            inputStream.read(header);
            inputStream.close();

            String hex = bytesToHex(header);

            // 检查文件魔数
            if (isJpeg(hex) && List.of(allowedTypes).contains("image")) {
                return;
            }
            if (isPng(hex) && List.of(allowedTypes).contains("image")) {
                return;
            }
            if (isPdf(hex) && List.of(allowedTypes).contains("document")) {
                return;
            }

            throw new ServiceException("文件内容不匹配");
        } catch (IOException e) {
            throw new ServiceException("文件校验失败", e);
        }
    }

    private boolean isJpeg(String hex) {
        return hex.startsWith("FFD8FF");
    }

    private boolean isPng(String hex) {
        return hex.startsWith("89504E470D0A1A0A");
    }

    private boolean isPdf(String hex) {
        return hex.startsWith("255044462D");
    }
}
```

---

## 配置文件

```yaml
# application.yml
oss:
  # 阿里云 OSS
  aliyun:
    enabled: true
    endpoint: oss-cn-hangzhou.aliyuncs.com
    access-key-id: ${OSS_ACCESS_KEY_ID}
    access-key-secret: ${OSS_ACCESS_KEY_SECRET}
    bucket-name: ruoyi-prod
    custom-domain: https://cdn.example.com

  # 腾讯云 COS
  tencent:
    enabled: false
    region: ap-guangzhou
    secret-id: ${COS_SECRET_ID}
    secret-key: ${COS_SECRET_KEY}
    bucket-name: ruoyi-1234567890

  # MinIO
  minio:
    enabled: false
    endpoint: http://localhost:9000
    access-key: minioadmin
    secret-key: minioadmin
    bucket-name: ruoyi

# 文件上传配置
spring:
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 100MB
```

---

## 触发关键词

- 文件上传
- OSS
- 对象存储
- 阿里云 OSS
- 腾讯云 COS
- MinIO
- 图片处理
- 缩略图
- 水印

---

## 相关文件

- [security-guard.md](./security-guard.md) - 安全防护
- [api-development.md](./api-development.md) - API 开发规范

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
