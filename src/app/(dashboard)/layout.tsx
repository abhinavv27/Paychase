import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Brain,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/approvals', label: 'Approvals', icon: CheckCircle },
  { href: '/insights', label: 'Insights', icon: Brain },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

async function getUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

async function getDraftCount() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('reminders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('approval_status', 'draft')

  if (error) return 0
  return count || 0
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  const draftCount = await getDraftCount()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <label
          htmlFor="sidebar-toggle"
          className="p-2 rounded-lg bg-white shadow-md cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </label>
        <input type="checkbox" id="sidebar-toggle" className="hidden peer" />
      </div>

      {/* Sidebar overlay for mobile */}
      <label
        htmlFor="sidebar-toggle"
        className="lg:hidden fixed inset-0 bg-black/50 z-30 hidden peer-checked:block"
      />

      {/* Sidebar */}
      <aside className="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col -translate-x-full lg:translate-x-0 peer-checked:translate-x-0 transition-transform duration-200 ease-in-out">
        {/* Logo/Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">PayChase AI</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <item.icon className="w-5 h-5 text-gray-500" />
              {item.label}
              {item.href === '/approvals' && draftCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                  {draftCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="px-3">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.email}
            </p>
          </div>
          <form action="/api/auth/sign-out" method="post">
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 lg:ml-0">{children}</div>
      </main>
    </div>
  )
}
