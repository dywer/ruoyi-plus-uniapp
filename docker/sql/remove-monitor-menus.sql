-- 移除 Admin 监控和任务调度中心菜单
-- 适用场景：已移除 ruoyi-job 和 spring-boot-admin-client 模块

-- 删除 Admin 监控菜单 (menu_id=117)
DELETE FROM sys_menu WHERE menu_id = 117;

-- 删除任务调度中心菜单 (menu_id=120)
DELETE FROM sys_menu WHERE menu_id = 120;

-- 验证删除结果
SELECT menu_id, menu_name, path, component, order_num
FROM sys_menu
WHERE parent_id = 2
ORDER BY order_num;
