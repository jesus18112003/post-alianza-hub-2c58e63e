import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Login() {
  const { session, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [realEmail, setRealEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(username, password, fullName, realEmail);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Cuenta creada exitosamente.');
      }
    } else {
      const { error } = await signIn(username, password);
      if (error) {
        toast.error('Usuario o contraseña incorrectos');
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <h1
            className="text-4xl tracking-tight text-accent"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            Post Alianza
          </h1>
          <p className="text-sm text-muted-foreground">
            Management Platform
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-lg shadow-black/20 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-card-foreground">
              {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isSignUp
                ? 'Ingresa tus datos para registrarte'
                : 'Ingresa tus credenciales para continuar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-muted-foreground text-sm">
                  Nombre completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Nancy Bustos"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-muted-foreground text-sm">
                Usuario
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="usuario123"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-sm">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="realEmail" className="text-muted-foreground text-sm">
                  Correo electrónico <span className="text-muted-foreground/50">(opcional, para recuperar contraseña)</span>
                </Label>
                <Input
                  id="realEmail"
                  type="email"
                  value={realEmail}
                  onChange={(e) => setRealEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {isSignUp ? 'Creando...' : 'Ingresando...'}
                </span>
              ) : (
                isSignUp ? 'Crear cuenta' : 'Ingresar'
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Post Alianza
        </p>
      </div>
    </div>
  );
}