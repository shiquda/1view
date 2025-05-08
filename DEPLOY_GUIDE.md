# 1View Cloudflare Workers 部署指南

本指南将帮助您部署1View项目的Cloudflare Workers代理服务，以解决跨域资源共享(CORS)限制问题。

## 什么是Cloudflare Workers?

Cloudflare Workers是一个无服务器计算平台，可让您在Cloudflare的全球网络上运行JavaScript代码。对于1View项目，我们使用Cloudflare Workers创建一个代理服务，以绕过CORS限制，允许应用程序从任何API获取数据。

## 为什么需要部署Cloudflare Workers?

1View依赖于外部API来获取所需的数据，但是许多API都受到CORS限制，不允许直接从浏览器脚本访问。为了绕过这些限制，我们需要一个代理服务来进行转发。

但是，官方提供的代理服务可能存在不稳定的问题。如果你无法正常使用，或是比较注重自己的隐私，可以考虑自己部署一个Cloudflare Workers服务，然后在设置中选择使用自己的代理服务。

## 部署前准备

如果您还没有Cloudflare账户，请前往 [Cloudflare官网](https://dash.cloudflare.com/sign-up) 注册一个免费账户。

## 部署步骤

前往Cloudflare进行Workers的配置，你需要在Cloudflare的左侧找到Workers 和Pages，然后创建 > Workers > Hello world > 填写名称并部署 > 进入修改源码，粘贴[worker.js](/cloudflare/worker.js)的代码。

如果需要配置个人域名转发，你需要在CF进入域名的管理页面，然后找到左侧的“Workers 路由”，选择添加路由并绑定前面创建的Worker。

成功部署Worker后，您需要在1View应用中配置代理：

1. 打开1View应用
2. 点击右上角的设置图标
3. 在设置面板中找到"CORS代理"部分
4. 启用代理功能
5. 选择"自定义代理"并输入您的Worker URL模板：

```
https://1view-proxy.your-username.workers.dev/{url}
```

请确保将`{url}`作为占位符包含在内，1View会用实际的API URL替换它。

## 使用示例

### 代理服务测试

1. 访问您部署的Worker URL (例如 `https://1view-proxy.your-username.workers.dev/`)
2. 在页面上的输入框中输入一个API URL，例如 `https://api.github.com/users/octocat`
3. 点击"跳转"按钮
4. 您应该能看到GitHub API返回的JSON数据，这说明代理服务正常工作

## 免费版限制和注意事项

Cloudflare Workers免费版有以下限制：

- 每天100,000次请求
- 每个请求最多10ms CPU时间
- 没有自定义域名（使用workers.dev子域名）
- 无法使用某些高级功能

对于大多数个人用户，免费版足够使用。如果需要更多资源，可以考虑升级到付费计划。
