import Link from 'next/link'
import {Lock, Eye} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {LoginForm} from '@/components/custom/loginForm'

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
            <Lock className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground text-center text-balance">Sign in to your account to continue</p>
        </div>
        <Card className="border-border/60 bg-card shadow-xl shadow-black/20">
          <CardHeader className="sr-only">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <LoginForm />
          </CardContent>
        </Card>
        <p className="mt-3 text-center text-xs text-muted-foreground/60">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  )
}
