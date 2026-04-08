# WeChat Integration - 微信生态集成

## 职责范围

规范 RuoYi-Vue-Plus 项目中微信生态功能的集成，包括微信登录、微信分享、微信消息推送、小程序码生成等。

---

## 核心规范

### 1. 微信登录

#### 1.1 小程序登录流程

```java
@Service
public class WechatLoginService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private UserService userService;

    @Value("${wechat.miniapp.appid}")
    private String appId;

    @Value("${wechat.miniapp.secret}")
    private String secret;

    /**
     * 小程序登录
     */
    @Transactional
    public LoginResult miniappLogin(String code) {
        // 1. 调用微信 API 获取 openid
        String url = "https://api.weixin.qq.com/sns/jscode2session" +
                     "?appid={appid}&secret={secret}&js_code={code}&grant_type=authorization_code";

        Map<String, Object> response = restTemplate.getForObject(
            url, Map.class, appId, secret, code
        );

        String openid = (String) response.get("openid");
        String sessionKey = (String) response.get("session_key");

        // 2. 查询或创建用户
        User user = userService.findByWechatOpenid(openid);
        if (user == null) {
            user = createUserFromWechat(openid);
        }

        // 3. 生成登录 Token
        String token = jwtTokenProvider.generateToken(user.getId(), openid);

        return LoginResult.builder()
            .token(token)
            .user(user)
            .openid(openid)
            .build();
    }

    /**
     * 公众号网页授权登录
     */
    public LoginResult officialAccountLogin(String code) {
        // 获取用户信息
        String url = "https://api.weixin.qq.com/sns/oauth2/access_token" +
                     "?appid={appid}&secret={secret}&code={code}&grant_type=authorization_code";

        Map<String, Object> tokenResponse = restTemplate.getForObject(
            url, Map.class, appId, secret, code
        );

        String openid = (String) tokenResponse.get("openid");
        String accessToken = (String) tokenResponse.get("access_token");

        // 获取用户详细信息
        String userInfoUrl = "https://api.weixin.qq.com/sns/userinfo" +
                             "?access_token={access_token}&openid={openid}";

        Map<String, Object> userInfo = restTemplate.getForObject(
            userInfoUrl, Map.class, accessToken, openid
        );

        // 处理用户登录逻辑
        return processWechatUserInfo(userInfo);
    }
}
```

### 2. 微信分享

```java
@Service
public class WechatShareService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${wechat.miniapp.appid}")
    private String appId;

    @Value("${wechat.miniapp.appsecret}")
    private String appSecret;

    /**
     * 获取微信分享配置（公众号）
     */
    public WechatShareConfig getShareConfig(String url) {
        try {
            // 获取 access_token
            String accessToken = getAccessToken();

            // 获取 jsapi_ticket
            String ticket = getJsapiTicket(accessToken);

            // 生成签名
            String timestamp = String.valueOf(System.currentTimeMillis() / 1000);
            String nonceStr = RandomUtil.randomString(16);
            String signature = generateSignature(ticket, nonceStr, timestamp, url);

            return WechatShareConfig.builder()
                .appId(appId)
                .timestamp(timestamp)
                .nonceStr(nonceStr)
                .signature(signature)
                .build();

        } catch (Exception e) {
            throw new ServiceException("获取微信分享配置失败", e);
        }
    }

    private String getAccessToken() {
        String url = "https://api.weixin.qq.com/cgi-bin/token" +
                     "?grant_type=client_credential&appid={appid}&secret={secret}";

        Map<String, Object> response = restTemplate.getForObject(
            url, Map.class, appId, appSecret
        );

        return (String) response.get("access_token");
    }

    private String getJsapiTicket(String accessToken) {
        String url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket" +
                     "?access_token={access_token}&type=jsapi";

        Map<String, Object> response = restTemplate.getForObject(
            url, Map.class, accessToken
        );

        return (String) response.get("ticket");
    }

    private String generateSignature(String ticket, String nonceStr,
                                      String timestamp, String url) {
        String str = String.format("jsapi_ticket=%s&noncestr=%s&timestamp=%s&url=%s",
                                   ticket, nonceStr, timestamp, url);
        return DigestUtil.sha1(str);
    }
}
```

### 3. 微信消息推送（模板消息）

```java
@Service
public class WechatTemplateMessageService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${wechat.miniapp.appid}")
    private String appId;

    @Value("${wechat.miniapp.appsecret}")
    private String appSecret;

    /**
     * 发送模板消息
     */
    public void sendTemplateMessage(TemplateMessageRequest request) {
        try {
            String accessToken = getAccessToken();

            Map<String, Object> params = new HashMap<>();
            params.put("touser", request.getOpenid());
            params.put("template_id", request.getTemplateId());
            params.put("page", request.getPage());
            params.put("data", buildTemplateData(request.getData()));

            // 颜色需求（小程序已废弃 miniprogram 字段）
            if (StringUtils.isNotBlank(request.getColor())) {
                params.put("color", request.getColor());
            }

            String url = "https://api.weixin.qq.com/cgi-bin/message/subscribe/send" +
                         "?access_token={access_token}";

            restTemplate.postForObject(url, params, String.class, accessToken);

        } catch (Exception e) {
            log.error("发送微信模板消息失败", e);
        }
    }

    private Map<String, Object> buildTemplateData(Map<String, String> data) {
        Map<String, Object> result = new HashMap<>();
        for (Map.Entry<String, String> entry : data.entrySet()) {
            Map<String, String> item = new HashMap<>();
            item.put("value", entry.getValue());
            result.put(entry.getKey(), item);
        }
        return result;
    }

    /**
     * 发送订单支付成功通知
     */
    public void sendOrderPaidNotice(String openid, String orderNo,
                                    BigDecimal amount, Date payTime) {
        TemplateMessageRequest request = TemplateMessageRequest.builder()
            .openid(openid)
            .templateId("your_template_id")
            .page("pages/order/detail?id=" + orderNo)
            .data(Map.of(
                "character_string1", orderNo,
                "amount2", amount.toString(),
                "time3", DateUtil.format(payTime, "yyyy-MM-dd HH:mm:ss")
            ))
            .build();

        sendTemplateMessage(request);
    }

    /**
     * 发送发货通知
     */
    public void sendDeliveryNotice(String openid, String orderNo,
                                   String companyName, String trackingNo) {
        TemplateMessageRequest request = TemplateMessageRequest.builder()
            .openid(openid)
            .templateId("your_template_id")
            .page("pages/order/detail?id=" + orderNo)
            .data(Map.of(
                "character_string1", orderNo,
                "thing2", companyName,
                "character_string3", trackingNo
            ))
            .build();

        sendTemplateMessage(request);
    }
}
```

### 4. 小程序码生成

```java
@Service
public class WechatQrCodeService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${wechat.miniapp.appid}")
    private String appId;

    @Value("${wechat.miniapp.appsecret}")
    private String appSecret;

    /**
     * 生成小程序码（永久有效，数量有限）
     */
    public byte[] createQRCode(String scene, String page) {
        try {
            String accessToken = getAccessToken();

            Map<String, Object> params = new HashMap<>();
            params.put("scene", scene);  // 场景值，最长 32 字符
            params.put("page", page);     // 跳转页面
            params.put("width", 430);     // 二维码宽度

            String url = "https://api.weixin.qq.com/cgi-bin/wxa/qrcode" +
                         "?access_token={access_token}";

            return restTemplate.postForObject(url, params, byte[].class, accessToken);

        } catch (Exception e) {
            throw new ServiceException("生成小程序码失败", e);
        }
    }

    /**
     * 生成小程序码（永久有效，数量无限）
     */
    public byte[] createUnlimitedQRCode(String scene, String page) {
        try {
            String accessToken = getAccessToken();

            Map<String, Object> params = new HashMap<>();
            params.put("scene", scene);
            params.put("page", page);
            params.put("width", 430);
            params.put("auto_color", false);
            params.put("is_hyaline", true);  // 透明底色

            String url = "https://api.weixin.qq.com/wxa/getwxacodeunlimited" +
                         "?access_token={access_token}";

            return restTemplate.postForObject(url, params, byte[].class, accessToken);

        } catch (Exception e) {
            throw new ServiceException("生成小程序码失败", e);
        }
    }

    /**
     * 保存二维码到 OSS
     */
    public String saveQRCodeToOss(String scene, String page, String dir) {
        byte[] qrCodeData = createUnlimitedQRCode(scene, page);

        // 上传到 OSS
        String fileName = dir + "/qr_" + scene + "_" + System.currentTimeMillis() + ".png";
        ossService.upload(fileName, new ByteArrayInputStream(qrCodeData));

        return ossService.getUrl(fileName);
    }
}
```

### 5. 微信用户信息

```java
@Data
public class WechatUserInfo {

    /**
     * 用户唯一标识
     */
    private String openid;

    /**
     * 会话密钥
     */
    private String sessionKey;

    /**
     * 用户唯一标识（UnionID）
     */
    private String unionid;

    /**
     * 用户昵称
     */
    private String nickname;

    /**
     * 用户头像
     */
    private String avatarUrl;

    /**
     * 性别：0-未知 1-男 2-女
     */
    private Integer gender;

    /**
     * 国家
     */
    private String country;

    /**
     * 省份
     */
    private String province;

    /**
     * 城市
     */
    private String city;

    /**
     * 语言
     */
    private String language;

    /**
     * 手机号（需要用户授权）
     */
    private String phoneNumber;
}
```

### 6. 微信手机号解密

```java
@Service
public class WechatPhoneService {

    @Value("${wechat.miniapp.appid}")
    private String appId;

    /**
     * 解密微信手机号
     */
    public String decryptPhone(String encryptedData, String iv, String sessionKey) {
        try {
            // Base64 解码
            byte[] dataByte = Base64.decode(encryptedData);
            byte[] keyByte = Base64.decode(sessionKey);
            byte[] ivByte = Base64.decode(iv);

            // AES 解密
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            SecretKeySpec keySpec = new SecretKeySpec(keyByte, "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(ivByte);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);

            byte[] resultByte = cipher.doFinal(dataByte);
            String result = new String(resultByte, StandardCharsets.UTF_8);

            // 解析 JSON
            JSONObject json = JSON.parseObject(result);
            return json.getString("phoneNumber");

        } catch (Exception e) {
            throw new ServiceException("解密手机号失败", e);
        }
    }
}
```

---

## 配置文件

```yaml
wechat:
  miniapp:
    appid: wx1234567890
    appsecret: your_app_secret
  official-account:
    appid: your_official_account_appid
    appsecret: your_official_account_secret
  pay:
    mch-id: 1234567890
    mch-key: your_mch_key
    cert-path: classpath:/cert/apiclient_cert.p12
  template:
    order-paid: your_template_id
    order-shipped: your_template_id
```

---

## 触发关键词

- 微信
- 小程序
- 公众号
- 微信登录
- 微信分享
- 模板消息
- 小程序码

---

## 相关文件

- [payment-integration.md](./payment-integration.md) - 支付功能集成
- [security-guard.md](./security-guard.md) - 安全防护

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
