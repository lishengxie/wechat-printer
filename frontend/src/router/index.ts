import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      component: () => import('@/components/AppShell.vue'),
      children: [
        {
          path: '',
          redirect: '/dashboard/articles'
        },
        {
          path: 'articles',
          name: 'ArticleList',
          component: () => import('@/pages/ArticleListPage.vue')
        },
        {
          path: 'templates',
          name: 'TemplateList',
          component: () => import('@/pages/TemplateListPage.vue')
        },
        {
          path: 'ai-config',
          name: 'AIConfig',
          component: () => import('@/pages/AIConfigPage.vue')
        },
        {
          path: 'help/markdown',
          name: 'HelpMarkdown',
          component: () => import('@/pages/HelpMarkdownPage.vue')
        }
      ]
    },
    {
      path: '/editor/article/:articleId',
      name: 'ArticleEditor',
      component: () => import('@/pages/EditorPage.vue')
    },
    {
      path: '/editor/template/:layoutId',
      name: 'TemplateEditor',
      component: () => import('@/pages/EditorPage.vue')
    },
    {
      path: '/admin/users',
      name: 'UserManagement',
      component: () => import('@/components/AppShell.vue'),
      children: [
        {
          path: '',
          component: () => import('@/pages/UserManagementPage.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.public) {
    next()
    return
  }

  if (!authStore.isAuthenticated) {
    next('/login')
    return
  }

  if (to.path.startsWith('/admin') && !authStore.isAdmin) {
    next('/dashboard')
    return
  }

  next()
})

export default router
