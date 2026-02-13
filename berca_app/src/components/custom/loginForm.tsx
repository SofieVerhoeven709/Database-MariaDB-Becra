'use client'

import {useActionState, useState} from 'react'
import {Eye, EyeOff, Lock, User} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {signInAction} from '@/serverFunctions/employees'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password_hash, setPassword] = useState('')

  const [loginState, loginFormAction] = useActionState(signInAction, {success: false})

  return (
    <form action={loginFormAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="pl-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            required
            autoComplete="username"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            name="password_hash"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password_hash}
            onChange={e => setPassword(e.target.value)}
            className="pl-10 pr-10 bg-secondary border-border placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {loginState.errors?.errors?.[0] && <p className="text-sm text-destructive">{loginState.errors.errors[0]}</p>}

      <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/80 font-medium">
        Sign in
      </Button>
    </form>
  )
}
