## 细则
1. app\src\routes\routePaths.ts
本地环境跑起来需要去除路由中的data 生产环境则需要加上
signIn: { path: '/signin' },//开发
signIn: { path: '/data/signin' },//生产

2.app\src\services\api\provider\DirectClickHouseProvider.ts
238行的groupId 测试环境需要写死 因为的单独跑的项目

3.webpack.config.babel.js
114行 同1 本地开发环境需要去掉data

4.app\src\components\axios.ts
与后端的交互走这个文件 上生产记得修改head



## Install

```bash

# ! don't forget to add !  
echo 'nodeLinker: node-modules' > .yarnrc.yml


# Yarn setup 
yarn set version 3.1.1
yarn -v


# Install js libs
yarn install

# Run on http://0.0.0.0:9000/  
yarn start

# Build html+js to /dist/ 
yarn build


```