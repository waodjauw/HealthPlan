/**
 * 后端地址 —— 出包前按实际情况改这里。
 *
 * - 安卓模拟器访问宿主机：http://10.0.2.2:3000
 * - 安卓真机 / 平板（同一 WiFi）：http://192.168.x.x:3000（电脑 ipconfig 查）
 * - 生产环境：https://your-domain.com
 *
 * 注意：安卓 9+ 默认禁止明文 HTTP。开发阶段已在 app.json 里开了
 * android.usesCleartextTraffic = true；上生产请换成 HTTPS。
 */
export const API_BASE = 'https://healthplan-api.onrender.com'
