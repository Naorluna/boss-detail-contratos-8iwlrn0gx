import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  Shield,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Login() {
  const { isAuthenticated, login, signup, requestPasswordReset } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form states
  const [email, setEmail] = useState('naorluna@icloud.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [name, setName] = useState('')

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const validate = () => {
    const errors: { [key: string]: string } = {}
    if (!email.trim()) {
      errors.email = 'E-mail é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Insira um e-mail válido'
    }

    if (mode !== 'forgot') {
      if (!password) {
        errors.password = 'Senha é obrigatória'
      } else if (password.length < 8) {
        errors.password = 'A senha deve ter no mínimo 8 caracteres'
      }
    }

    if (mode === 'signup' && !name.trim()) {
      errors.name = 'Nome completo é obrigatório'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!validate()) return

    setLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/')
      } else if (mode === 'signup') {
        await signup(email, password, name)
        navigate('/')
      } else if (mode === 'forgot') {
        await requestPasswordReset(email)
        setSuccessMessage('Instruções para redefinição de senha foram enviadas para o seu e-mail.')
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      const data = err?.data?.data
      if (data) {
        const fieldErrs: { [key: string]: string } = {}
        Object.keys(data).forEach((key) => {
          fieldErrs[key] = data[key]?.message || 'Campo inválido'
        })
        setFieldErrors(fieldErrs)
      }

      if (err?.status === 400 || err?.status === 404) {
        if (mode === 'login') {
          setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais.')
        } else if (mode === 'signup') {
          setErrorMessage(err?.message || 'Falha ao criar conta. Verifique os dados inseridos.')
        } else {
          setErrorMessage('Não foi possível enviar a redefinição de senha.')
        }
      } else {
        setErrorMessage(err?.message || 'Ocorreu um erro no servidor. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#090d16] via-[#0f172a] to-[#1e293b] p-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <div className="relative">
              <Shield className="w-8 h-8 stroke-[2.2] text-slate-950" />
              <Sparkles className="w-4 h-4 absolute top-0 right-0 text-white animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Boss Detail</h1>
          <p className="text-xs text-amber-400 font-semibold tracking-wider uppercase">
            Gestão & Controle de Contratos
          </p>
        </div>

        {/* Card Form */}
        <Card className="border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl backdrop-blur-md rounded-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg text-white font-bold text-center">
              {mode === 'login' && 'Acessar o Painel'}
              {mode === 'signup' && 'Criar Nova Conta'}
              {mode === 'forgot' && 'Recuperar Senha'}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs text-center">
              {mode === 'login' && 'Entre com suas credenciais de administrador da franquia'}
              {mode === 'signup' && 'Preencha seus dados para criar seu acesso'}
              {mode === 'forgot' && 'Informe seu e-mail para receber o link de recuperação'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert
                variant="destructive"
                className="bg-red-950/70 border-red-800 text-red-200 text-xs py-2.5"
              >
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="bg-emerald-950/70 border-emerald-800 text-emerald-200 text-xs py-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">Nome Completo</Label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      type="text"
                      placeholder="Ex: Carlos Andrade"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 rounded-lg focus-visible:ring-amber-400"
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-[11px] text-red-400 font-medium">{fieldErrors.name}</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">E-mail</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="email"
                    placeholder="seu.email@bossdetail.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 rounded-lg focus-visible:ring-amber-400"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-400 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-300">Senha</Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot')
                          setErrorMessage(null)
                          setSuccessMessage(null)
                        }}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 rounded-lg focus-visible:ring-amber-400"
                    />
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-red-400 font-medium">{fieldErrors.password}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-lg transition-all shadow-md shadow-amber-500/20 active:scale-[0.98] mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'login' ? (
                  'Entrar'
                ) : mode === 'signup' ? (
                  'Criar Conta'
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="border-t border-slate-800 pt-3 pb-4 justify-center text-xs text-slate-400">
            {mode === 'login' && (
              <div className="text-center">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setErrorMessage(null)
                    setSuccessMessage(null)
                  }}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Criar conta
                </button>
              </div>
            )}

            {(mode === 'signup' || mode === 'forgot') && (
              <div className="text-center">
                Lembrou sua senha?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setErrorMessage(null)
                    setSuccessMessage(null)
                  }}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Voltar para o Login
                </button>
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Demo Credentials Helper Pill */}
        <div className="text-center bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Acesso Padrão Administrador:</p>
          <p className="mt-0.5">
            E-mail: <span className="text-amber-400 font-mono">naorluna@icloud.com</span> | Senha:{' '}
            <span className="text-amber-400 font-mono">Skip@Pass</span>
          </p>
        </div>
      </div>
    </div>
  )
}
