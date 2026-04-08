# Payment Integration - 支付功能集成

## 职责范围

规范 RuoYi-Vue-Plus 项目中支付功能的集成，包括微信支付、支付宝支付、支付回调处理、订单状态管理等。

---

## 核心规范

### 1. 支付方式枚举

```java
public enum PayType {
    /**
     * 微信支付
     */
    WECHAT("wechat", "微信支付"),

    /**
     * 支付宝支付
     */
    ALIPAY("alipay", "支付宝支付"),

    /**
     * 银行卡支付
     */
    BANK_CARD("bank_card", "银行卡支付"),

    /**
     * 余额支付
     */
    BALANCE("balance", "余额支付");

    private final String code;
    private final String name;

    PayType(String code, String name) {
        this.code = code;
        this.name = name;
    }
}
```

### 2. 订单实体设计

```java
@Data
@TableName("pay_order")
public class PayOrder extends BaseEntity {

    /**
     * 订单 ID
     */
    @TableId(type = IdType.ASSIGN_ID)
    private Long orderId;

    /**
     * 用户 ID
     */
    private Long userId;

    /**
     * 订单编号（业务）
     */
    private String orderNo;

    /**
     * 支付订单号（第三方）
     */
    private String payOrderNo;

    /**
     * 支付类型
     */
    @Enumerated(EnumType.STRING)
    private PayType payType;

    /**
     * 订单金额（单位：分）
     */
    private Long amount;

    /**
     * 订单状态：0-待支付 1-已支付 2-支付失败 3-已退款
     */
    private Integer status;

    /**
     * 支付完成时间
     */
    private Date payTime;

    /**
     * 回调数据
     */
    private String callbackData;

    /**
     * 退款金额
     */
    private Long refundAmount;

    /**
     * 退款时间
     */
    private Date refundTime;
}
```

### 3. 支付服务接口

```java
public interface PayService {

    /**
     * 创建支付订单
     */
    PayOrder createOrder(PayOrderRequest request);

    /**
     * 发起支付（获取支付参数）
     */
    PayResponse pay(PayRequest request);

    /**
     * 处理支付回调
     */
    String handleCallback(String payType, Map<String, String> params);

    /**
     * 查询订单状态
     */
    PayOrder queryOrder(String orderNo);

    /**
     * 退款
     */
    RefundResponse refund(RefundRequest request);

    /**
     * 关闭订单
     */
    void closeOrder(String orderNo);
}
```

### 4. 微信支付实现

```java
@Service
@Slf4j
public class WechatPayServiceImpl implements PayService {

    @Autowired
    private PayOrderService payOrderService;

    @Autowired
    private WechatPayConfig wechatPayConfig;

    @Override
    public PayOrder createOrder(PayOrderRequest request) {
        // 1. 生成订单号
        String orderNo = generateOrderNo(request.getBizType());

        // 2. 创建订单
        PayOrder payOrder = new PayOrder();
        payOrder.setOrderNo(orderNo);
        payOrder.setUserId(request.getUserId());
        payOrder.setPayType(PayType.WECHAT);
        payOrder.setAmount(request.getAmount());
        payOrder.setStatus(0);  // 待支付
        payOrderService.save(payOrder);

        return payOrder;
    }

    @Override
    public PayResponse pay(PayRequest request) {
        PayOrder order = payOrderService.getByOrderNo(request.getOrderNo());
        if (order == null) {
            throw new ServiceException("订单不存在");
        }
        if (order.getStatus() != 0) {
            throw new ServiceException("订单状态异常");
        }

        // 构建微信支付参数
        WxPayUnifiedOrderV3Request wxRequest = new WxPayUnifiedOrderV3Request();
        wxRequest.setOutTradeNo(order.getOrderNo());
        wxRequest.setAmount(new WxPayUnifiedOrderV3Request.Amount()
            .setTotal(order.getAmount().intValue())
            .setCurrency("CNY"));
        wxRequest.setDescription("订单支付");
        wxRequest.setNotifyUrl(wechatPayConfig.getNotifyUrl());

        // 调用微信支付 API
        WxPayUnifiedOrderV3Result.JSAPI result = wechatPayService.unifiedOrderV3(wxRequest);

        // 返回前端支付参数
        return PayResponse.builder()
            .appId(result.getAppId())
            .timeStamp(result.getTimeStamp())
            .nonceStr(result.getNonceStr())
            .packageValue(result.getPackageVal())
            .signType(result.getSignType())
            .paySign(result.getPaySign())
            .build();
    }

    @Override
    public String handleCallback(String payType, Map<String, String> params) {
        try {
            // 验证签名
            String xml = mapToXml(params);
            WxPayOrderNotifyResult result = WxPayOrderNotifyResult.fromXML(xml);

            // 验证签名
            wxPayService.parseOrderNotifyResult(result);

            // 更新订单状态
            String outTradeNo = result.getOutTradeNo();
            PayOrder order = payOrderService.getByOrderNo(outTradeNo);
            if (order == null) {
                log.error("回调订单不存在：{}", outTradeNo);
                return wxPayService.buildNotifyResult(false);
            }

            // 检查金额
            Integer totalFee = result.getTotalFee();
            if (!order.getAmount().equals((long) totalFee * 100)) {
                log.error("回调金额不一致：{}", outTradeNo);
                return wxPayService.buildNotifyResult(false);
            }

            // 更新订单
            order.setStatus(1);  // 已支付
            order.setPayOrderNo(result.getTransactionId());
            order.setPayTime(new Date());
            order.setCallbackData(JSON.toJSONString(params));
            payOrderService.updateById(order);

            // 发送支付成功事件
            eventPublisher.publishEvent(new PaySuccessEvent(order));

            log.info("微信支付回调成功：{}", outTradeNo);
            return wxPayService.buildNotifyResult(true);

        } catch (Exception e) {
            log.error("微信支付回调失败", e);
            return wxPayService.buildNotifyResult(false);
        }
    }

    private String generateOrderNo(String bizType) {
        return bizType + System.currentTimeMillis() +
               RandomUtil.randomNumbers(6);
    }
}
```

### 5. 支付宝支付实现

```java
@Service
@Slf4j
public class AlipayServiceImpl implements PayService {

    @Autowired
    private AlipayClient alipayClient;

    @Autowired
    private PayOrderService payOrderService;

    @Override
    public PayResponse pay(PayRequest request) {
        PayOrder order = payOrderService.getByOrderNo(request.getOrderNo());

        // 构建支付宝请求
        AlipayTradeAppPayRequest alipayRequest = new AlipayTradeAppPayRequest();
        alipayRequest.setNotifyUrl(alipayConfig.getNotifyUrl());
        alipayRequest.setBizContent("{" +
            "\"out_trade_no\":\"" + order.getOrderNo() + "\"," +
            "\"total_amount\":" + order.getAmount().divide(BigDecimal.valueOf(100)) + "," +
            "\"subject\":\"订单支付\"," +
            "\"product_code\":\"QUICK_MSECURITY_PAY\"" +
            "}");

        // 获取支付参数
        AlipayTradeAppPayResponse response = alipayClient.sdkExecute(alipayRequest);

        return PayResponse.builder()
            .orderNo(order.getOrderNo())
            .payInfo(response.getBody())
            .build();
    }

    @Override
    public String handleCallback(String payType, Map<String, String> params) {
        try {
            // 验证签名
            boolean signVerified = AlipaySignature.rsaCheckV1(
                params,
                alipayConfig.getAlipayPublicKey(),
                alipayConfig.getCharset(),
                alipayConfig.getSignType()
            );

            if (!signVerified) {
                log.error("支付宝回调签名验证失败");
                return "failure";
            }

            // 处理回调
            String outTradeNo = params.get("out_trade_no");
            String tradeNo = params.get("trade_no");
            String tradeStatus = params.get("trade_status");

            PayOrder order = payOrderService.getByOrderNo(outTradeNo);
            if (order == null) {
                log.error("回调订单不存在：{}", outTradeNo);
                return "failure";
            }

            if ("TRADE_SUCCESS".equals(tradeStatus) || "TRADE_FINISHED".equals(tradeStatus)) {
                order.setStatus(1);
                order.setPayOrderNo(tradeNo);
                order.setPayTime(new Date());
                payOrderService.updateById(order);

                eventPublisher.publishEvent(new PaySuccessEvent(order));
            }

            log.info("支付宝回调成功：{}", outTradeNo);
            return "success";

        } catch (Exception e) {
            log.error("支付宝回调失败", e);
            return "failure";
        }
    }
}
```

### 6. 退款功能

```java
@Service
public class RefundServiceImpl {

    @Autowired
    private PayOrderService payOrderService;

    @Autowired
    private WxPayService wxPayService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RefundResponse refund(RefundRequest request) {
        PayOrder order = payOrderService.getByOrderNo(request.getOrderNo());
        if (order == null) {
            throw new ServiceException("订单不存在");
        }
        if (order.getStatus() != 1) {
            throw new ServiceException("订单未支付");
        }

        // 检查退款金额
        if (request.getRefundAmount().compareTo(order.getAmount()) > 0) {
            throw new ServiceException("退款金额不能超过订单金额");
        }

        // 检查是否已退款
        if (order.getRefundAmount() != null && order.getRefundAmount() > 0) {
            throw new ServiceException("订单已退款");
        }

        // 调用微信退款 API
        WxPayRefundRequest wxRequest = new WxPayRefundRequest();
        wxRequest.setOutTradeNo(order.getOrderNo());
        wxRequest.setOutRefundNo(generateRefundNo());
        wxRequest.setTotalFee(order.getAmount().intValue());
        wxRequest.setRefundFee(request.getRefundAmount().intValue());
        wxRequest.setRefundDesc(request.getReason());

        WxPayRefundResult refundResult = wxPayService.refund(wxRequest);

        // 更新订单状态
        order.setRefundAmount(request.getRefundAmount());
        order.setRefundTime(new Date());
        order.setStatus(3);  // 已退款
        payOrderService.updateById(order);

        return RefundResponse.builder()
            .refundNo(refundResult.getOutRefundNo())
            .refundAmount(request.getRefundAmount())
            .build();
    }

    private String generateRefundNo() {
        return "RF" + System.currentTimeMillis() + RandomUtil.randomNumbers(6);
    }
}
```

### 7. 支付配置

```java
@Configuration
@ConfigurationProperties(prefix = "pay.wechat")
@Data
public class WechatPayConfig {

    /**
     *  appId
     */
    private String appId;

    /**
     * 商户号
     */
    private String mchId;

    /**
     * 商户私钥
     */
    private String privateKeyPath;

    /**
     * 商户证书序列号
     */
    private String merchantSerialNumber;

    /**
     * API v3 密钥
     */
    private String apiV3Key;

    /**
     * 回调地址
     */
    private String notifyUrl;

    @Bean
    public WxPayService wxPayService() {
        WxPayConfig wxPayConfig = new WxPayConfig();
        wxPayConfig.setAppId(this.appId);
        wxPayConfig.setMchId(this.mchId);
        wxPayConfig.setPrivateKeyPath(this.privateKeyPath);
        wxPayConfig.setMerchantSerialNumber(this.merchantSerialNumber);
        wxPayConfig.setApiV3Key(this.apiV3Key);
        wxPayConfig.setNotifyUrl(this.notifyUrl);

        WxPayService wxPayService = new WxPayService();
        wxPayService.setConfig(wxPayConfig);
        return wxPayService;
    }
}
```

```yaml
# application.yml
pay:
  wechat:
    app-id: wx1234567890
    mch-id: 1234567890
    private-key-path: classpath:/cert/apiclient_key.pem
    merchant-serial-number: XXXXXXXXXXXXXXXX
    api-v3-key: your_api_v3_key
    notify-url: https://your-domain.com/api/pay/callback/wechat
  alipay:
    app-id: 2021000000000000
    private-key: your_private_key
    alipay-public-key: your_alipay_public_key
    notify-url: https://your-domain.com/api/pay/callback/alipay
```

---

## 触发关键词

- 支付
- 微信支付
- 支付宝
- 退款
- 订单

---

## 相关文件

- [security-guard.md](./security-guard.md) - 安全防护
- [error-handler.md](./error-handler.md) - 异常处理

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
