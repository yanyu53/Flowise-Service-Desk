// assets
import {
    IconHierarchy,
    IconBuildingStore,
    IconTicket,
    IconHeadset,
    IconUserSearch,
    IconMessages,
    IconCode,
    IconCoin,
    IconFileSearch
} from '@tabler/icons-react'

// constant
const icons = {
    IconHierarchy,
    IconBuildingStore,
    IconTicket,
    IconHeadset,
    IconUserSearch,
    IconMessages,
    IconCode,
    IconCoin,
    IconFileSearch
}

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const dashboard = {
    id: 'dashboard',
    title: '',
    type: 'group',
    children: [
        {
            id: 'primary',
            title: '',
            type: 'group',
            children: [
                {
                    id: 'chatflows',
                    title: '聊天流',
                    type: 'item',
                    url: '/chatflows',
                    icon: icons.IconHierarchy,
                    breadcrumbs: true,
                    permission: 'chatflows:view'
                },
                {
                    id: 'supportWorkbench',
                    title: '客服工作台',
                    type: 'item',
                    url: '/support/workbench',
                    icon: icons.IconHeadset,
                    breadcrumbs: true
                },
                {
                    id: 'supportCustomers',
                    title: '客户',
                    type: 'item',
                    url: '/support/customers',
                    icon: icons.IconUserSearch,
                    breadcrumbs: true
                },
                {
                    id: 'supportConversations',
                    title: '会话',
                    type: 'item',
                    url: '/support/conversations',
                    icon: icons.IconMessages,
                    breadcrumbs: true
                },
                {
                    id: 'supportWidget',
                    title: '网页小组件',
                    type: 'item',
                    url: '/support/widget',
                    icon: icons.IconCode,
                    breadcrumbs: true
                },
                {
                    id: 'supportUsage',
                    title: '用量/成本',
                    type: 'item',
                    url: '/support/usage',
                    icon: icons.IconCoin,
                    breadcrumbs: true
                },
                {
                    id: 'supportAudit',
                    title: '审计日志',
                    type: 'item',
                    url: '/support/audit',
                    icon: icons.IconFileSearch,
                    breadcrumbs: true
                },
                {
                    id: 'supportTickets',
                    title: '工单',
                    type: 'item',
                    url: '/support/tickets',
                    icon: icons.IconTicket,
                    breadcrumbs: true,
                    permission: 'supportTickets:view'
                },
                {
                    id: 'marketplaces',
                    title: '市场',
                    type: 'item',
                    url: '/marketplaces',
                    icon: icons.IconBuildingStore,
                    breadcrumbs: true,
                    permission: 'templates:marketplace,templates:custom'
                }
            ]
        }
    ]
}

export default dashboard
