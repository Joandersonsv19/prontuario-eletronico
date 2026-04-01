import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Heart,
  LogOut,
  Menu,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/supervisao", label: "Supervisão Acadêmica", icon: GraduationCap },
];

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function AppLayout({ children, breadcrumbs }: AppLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: () => toast.error("Erro ao sair"),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Prontuário Eletrônico</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Sistema de registro clínico para atenção básica em saúde
          </p>
          <Button asChild className="w-full" size="lg">
            <a href={getLoginUrl()}>Entrar com Manus</a>
          </Button>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight text-sidebar-foreground">Prontuário</p>
            <p className="text-xs text-sidebar-foreground/60 leading-tight">Atenção Básica</p>
          </div>
          <button
            className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "Usuário"}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email ?? ""}</p>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center gap-3 px-4 bg-card sticky top-0 z-20">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-sm min-w-0">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                  {crumb.href ? (
                    <Link href={crumb.href}>
                      <a className="text-muted-foreground hover:text-foreground truncate">{crumb.label}</a>
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium truncate">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
