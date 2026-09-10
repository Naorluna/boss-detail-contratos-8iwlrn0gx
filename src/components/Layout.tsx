import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'NL'
  }

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      active: location.pathname === '/' && !location.search.includes('view=contratos'),
    },
    {
      label: 'Franqueados',
      path: '/franqueados',
      icon: Users,
      active: location.pathname.startsWith('/franqueados'),
    },
    {
      label: 'Contratos',
      path: '/?view=contratos',
      icon: FileText,
      active:
        location.search.includes('view=contratos') || location.pathname.startsWith('/contratos'),
    },
  ]

  const getPageTitle = () => {
    if (location.pathname === '/') {
      return location.search.includes('view=contratos') ? 'Contratos' : 'Painel de Controle'
    }
    if (location.pathname === '/franqueados') return 'Unidades Franqueadas'
    if (location.pathname === '/franqueados/novo') return 'Nova Franquia'
    if (location.pathname.includes('/editar')) return 'Editar Franquia'
    if (location.pathname.startsWith('/franqueados/')) return 'Detalhes do Franqueado'
    if (location.pathname.startsWith('/contratos/novo')) return 'Novo Contrato'
    if (location.pathname.startsWith('/documento/')) return 'Documento Assinado'
    return 'Boss Detail'
  }

  const showNovoFranqueadoBtn = location.pathname === '/' || location.pathname === '/franqueados'

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 font-sans text-slate-900">
      {/* DESKTOP / TABLET SIDEBAR */}
      <aside className="hidden md:flex md:w-64 flex-col justify-between bg-[#0f172a] text-slate-300 shrink-0 border-r border-slate-800 z-20">
        <div>
          {/* Brand Logo Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-bold">
              <div className="relative">
                <Shield className="w-6 h-6 stroke-[2.2] text-slate-950" />
                <Sparkles className="w-3 h-3 absolute top-0.5 right-0.5 text-white" />
              </div>
            </div>
            <div>
              <div className="text-white font-bold tracking-tight text-lg leading-tight flex items-center gap-1.5">
                Boss Detail
              </div>
              <p className="text-[11px] font-medium text-amber-400/90 tracking-wide uppercase">
                Gestão de Contratos
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group',
                    item.active
                      ? 'bg-slate-800/90 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40',
                  )}
                >
                  {item.active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-amber-400" />
                  )}
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-150 group-hover:scale-110',
                      item.active ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200',
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-9 w-9 border border-amber-400/30 bg-slate-800 text-amber-400 font-bold shrink-0">
                <AvatarFallback className="bg-slate-800 text-amber-400 text-xs font-semibold">
                  {getInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate leading-tight">
                  {user?.name || 'Naor Luna'}
                </p>
                <p className="text-xs text-slate-400 truncate leading-tight">
                  {user?.email || 'naorluna@icloud.com'}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 hover:bg-slate-800 shrink-0"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR (<=640px) */}
      <header className="md:hidden flex items-center justify-between bg-[#0f172a] text-white px-4 py-3 border-b border-slate-800 z-30 sticky top-0 shadow">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-sm">
            <Shield className="w-4 h-4 stroke-[2.2] text-slate-950" />
          </div>
          <div>
            <span className="font-bold text-white text-base leading-tight block">Boss Detail</span>
            <span className="text-[10px] text-amber-400 uppercase tracking-wide">Contratos</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showNovoFranqueadoBtn && (
            <Button
              size="sm"
              onClick={() => navigate('/franqueados/novo')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs h-8 px-2.5"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              Novo
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 w-9"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-[#0f172a] text-white flex flex-col justify-between h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250">
            <div>
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
                    <Shield className="w-5 h-5 text-slate-950" />
                  </div>
                  <span className="font-bold text-white text-base">Boss Detail</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="p-3 space-y-1 mt-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.label}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        item.active
                          ? 'bg-slate-800 text-amber-400 font-semibold border-l-4 border-amber-400 pl-2'
                          : 'text-slate-300 hover:bg-slate-800/60',
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-9 w-9 bg-slate-800 text-amber-400 border border-amber-400/40">
                  <AvatarFallback className="text-xs font-bold">
                    {getInitials(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || 'Naor Luna'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.email || 'naorluna@icloud.com'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full border-slate-700 bg-slate-900/80 text-red-400 hover:bg-red-950/40 hover:text-red-300 justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair do sistema
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP BAR (Desktop/Tablet) */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistema Integrado de Controle de Franquias & Contratos
            </p>
          </div>

          <div className="flex items-center gap-3">
            {showNovoFranqueadoBtn && (
              <Button
                onClick={() => navigate('/franqueados/novo')}
                className="bg-[#0f172a] hover:bg-slate-800 text-white font-medium text-sm shadow-sm gap-2 transition-transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                Novo Franqueado
              </Button>
            )}
          </div>
        </header>

        {/* DYNAMIC CONTENT VIEW */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          <Outlet />
        </main>

        {/* LIGHTWEIGHT FOOTER */}
        <footer className="py-3 px-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white/70">
          © Boss Detail — Gestão de Contratos de Franquias
        </footer>
      </div>
    </div>
  )
}
