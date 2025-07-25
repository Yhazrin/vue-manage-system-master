import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { usePermissStore } from '../store/permiss';
import Home from '../views/home.vue';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// 新增多端路由分组
const userRoutes = [
    {
        path: '/user',
        name: 'UserDashboard',
        meta: { title: '用户中心', requiresAuth: true, role: 'USER' },
        component: () => import('@/views/user/Dashboard.vue'),
        children: [
            {
                path: 'orders',
                name: 'UserOrders',
                component: () => import('@/views/user/Orders.vue'),
                meta: { title: '我的订单' }
            },
            {
                path: 'profile',
                name: 'UserProfile',
                component: () => import('@/views/user/Profile.vue'),
                meta: { title: '个人资料' }
            },
            {
                path: 'booking/:id',
                name: 'Booking',
                component: () => import('@/views/user/Booking.vue'),
                meta: { title: '预约陪玩师', requiresAuth: true }
            }
        ]
    }
];

const companionRoutes = [
    {
        path: '/companion',
        name: 'CompanionDashboard',
        meta: { title: '陪玩师工作台', requiresAuth: true, role: 'COMPANION' },
        component: () => import('@/views/companion/Dashboard.vue'),
        children: [
            {
                path: 'orders',
                name: 'CompanionOrders',
                component: () => import('@/views/companion/Orders.vue'),
                meta: { title: '订单管理' }
            },
            {
                path: 'profile',
                name: 'CompanionProfile',
                component: () => import('@/views/companion/Profile.vue'),
                meta: { title: '个人资料' }
            },
            {
                path: 'withdrawals',
                name: 'CompanionWithdrawals',
                component: () => import('@/views/companion/Withdrawals.vue'),
                meta: { title: '提现管理' }
            }
        ]
    }
];

const adminRoutes = [
    {
        path: '/admin',
        name: 'AdminDashboard',
        meta: { title: '管理后台', requiresAuth: true, role: 'ADMIN' },
        component: () => import('@/views/admin/Dashboard.vue'),
        children: [
            {
                path: 'users',
                name: 'AdminUsers',
                component: () => import('@/views/admin/Users.vue'),
                meta: { title: '用户管理' }
            },
            {
                path: 'companions',
                name: 'AdminCompanions',
                component: () => import('@/views/admin/Companions.vue'),
                meta: { title: '陪玩师管理' }
            },
            {
                path: 'orders',
                name: 'AdminOrders',
                component: () => import('@/views/admin/Orders.vue'),
                meta: { title: '订单管理' }
            },
            {
                path: 'withdrawals',
                name: 'AdminWithdrawals',
                component: () => import('@/views/admin/Withdrawals.vue'),
                meta: { title: '提现审核' }
            }
        ]
    }
];

// 合并所有路由
const routes: RouteRecordRaw[] = [
    ...userRoutes,
    ...companionRoutes,
    ...adminRoutes,
    {
        path: '/',
        name: 'HomePage',
        component: () => import('../views/HomePage.vue'), // 直接导入首页组件
        meta: {
            title: '首页',
            noAuth: true
        }
    },
    // 取消以下页面的注释
    {
        path: '/login',
        meta: {
            title: '登录',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "login" */ '../views/pages/login.vue'),
    },
    {
        path: '/register',
        meta: {
            title: '注册',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "register" */ '../views/pages/register.vue'),
    },
    {
        path: '/reset-pwd',
        meta: {
            title: '重置密码',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "reset-pwd" */ '../views/pages/reset-pwd.vue'),
    },
    {
        path: '/403',
        meta: {
            title: '没有权限',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "403" */ '../views/pages/403.vue'),
    },
    {
        path: '/404',
        meta: {
            title: '找不到页面',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "404" */ '../views/pages/404.vue'),
    },
    { path: '/:path(.*)', redirect: '/404' },
    ];
    
    const router = createRouter({
        history: createWebHashHistory(),
        routes,
    });
    
    router.beforeEach((to, from, next) => {
      NProgress.start();
      const userRole = localStorage.getItem('role');
      const permiss = usePermissStore();
    
      if (!userRole && to.meta.noAuth !== true) {
        next('/login');
      } else if (to.meta.role && to.meta.role !== userRole) {
        // 验证路由所需角色与用户角色是否匹配
        next('/403');
      } else if (typeof to.meta.permiss == 'string' && !permiss.key.includes(to.meta.permiss)) {
        next('/403');
      } else {
        next();
      }
    });
    
    router.afterEach(() => {
        NProgress.done();
    });
    
    export default router;
