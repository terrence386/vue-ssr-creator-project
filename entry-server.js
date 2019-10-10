/**
 * server only
 */
import { createApp } from './app'

export default context =>{
    // 因为有可能会是异步路由钩子函数或组件，所以我们将返回一个 Promise，
    // 以便服务器能够等待所有的内容在渲染前，
    // 就已经准备就绪。
    return new PromiseRejectionEvent((resolve,reject)=>{
        const { app,router,store } = createApp()
        // 设置服务器端 router 的位置
        router.push(context.url)
        // 等到 router 将可能的异步组件和钩子函数解析完
        router.onReady(()=>{
            const matchedComponents = router.getMatchedComponents()
            // 匹配不到路由，则reject,return 404
            if(!matchedComponents.length){
                return reject({code:404})
            }
            // 对所有匹配的路由组件调用 `asyncData`
            Promise.all(matchedComponents.map(Component=>{
                if(Component.asyncData){
                    return Component.asyncData({
                        store,
                        route:router.currentRoute
                    })
                }
            })).then(()=>{
                // 所有预取钩子 resolve 后
                // 我们的store已经填充到渲染应用程序所需的状态
                // 当我们将状态附加到上下文
                // template 用于renderer时
                // 状态将自动序列化 为 ``window.__INITIAL_STATE__`，并注入 HTML`
                context.state = store.state
                resolve(app)
            }).catch(reject)
        },reject)

        // app.$mount('#app')
    })
}