import Vue from 'vue'
import App from './app.vue'
// import { sync } from 'vuex-router-sync'
import { createRouter } from './src/router/index'
export function createApp(){
    const router = createRouter()
    // sync(store, router)
    const app =  new Vue({
        router,
        render:h=>h(App)
    })
    return {app,router}
}