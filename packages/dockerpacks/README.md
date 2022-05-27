# @wxcloud/dockerpacks

A powerful library for generating a Dockerfile file from arbitrary source codes.

This library is under heavy development, and the API is not stable yet.

See [Dockerpacks](https://cloud.weixin.qq.com/cli/terminology/dockerpacks.html) for more details.

# Key Goals

- Generate Dockerfile for a given source code.
- Enhance the generated Dockerfile with best practice for Wechat CloudRun.
- Hackable generation progress and customized dockerpacks.

# FAQs

- Is there a developer API?
  - Yes. You can `import { Dockerpacks } from @wxcloud/dockerpacks` and use it.
- Is this open source?
  - Soon. We are working on it.
- How is it different from Buildpacks?
  - A lot. But key difference is that we generate plain Dockerfile instead of built images.

# Credits and Prior Art

Dockerpacks is inspired by the following projects:
- [Buildpacks](https://buildpacks.io/)
- [cloud66-oss/starter](https://github.com/cloud66-oss/starter)

# License

Copyright (c) 2022 WeChat CloudRun. All Rights Reserved

Licensed under the MIT license