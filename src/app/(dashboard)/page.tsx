import { createClient } from '@/lib/supabase/server'

export default async function OverviewPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const stats = [
    {
      label: 'Total Outstanding',
      value: '₹12,45,000',
      change: '+12%',
      positive: false,
    },
    {
      label: 'Cash Flow Forecast',
      value: '₹8,32,000',
      change: '+8%',
      positive: true,
    },
    {
      label: 'Recovery Rate',
      value: '73.2%',
      change: '+5.1%',
      positive: true,
    },
    {
      label: 'Avg Collection Time',
      value: '18 days',
      change: '-3 days',
      positive: true,
    },
  ]

  const recentActivity = [
    {
      id: 1,
      action: 'Payment received',
      client: 'Acme Corp',
      amount: '₹45,000',
      time: '2 hours ago',
    },
    {
      id: 2,
      action: 'Invoice overdue',
      client: 'Beta Industries',
      amount: '₹1,20,000',
      time: '5 hours ago',
    },
    {
      id: 3,
      action: 'AI prediction updated',
      client: 'Gamma Ltd',
      amount: '₹78,500',
      time: '1 day ago',
    },
    {
      id: 4,
      action: 'Payment plan created',
      client: 'Delta Services',
      amount: '₹2,10,000',
      time: '2 days ago',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening with your receivables today.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stat.value}
            </p>
            <p
              className={`mt-1 text-sm font-medium ${
                stat.positive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stat.change} from last month
            </p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {activity.action}
                </p>
                <p className="text-sm text-gray-500">{activity.client}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {activity.amount}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
