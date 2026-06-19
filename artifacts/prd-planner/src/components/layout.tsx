import { Link, useLocation } from "wouter";
import { Plus, History, Shield, Square } from "lucide-react";
import { useListPrds } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: prds } = useListPrds();

  const recentPrds = prds?.slice(0, 6) || [];

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground dark">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-[160px] bg-sidebar border-r border-sidebar-border flex flex-col z-20">
        <div className="p-4 flex items-center gap-2">
          <div className="bg-primary p-1 rounded-sm flex items-center justify-center">
            <Square className="w-4 h-4 text-primary-foreground fill-current" />
          </div>
          <span className="font-bold text-sm tracking-tight">PRD Sprint Planner</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
          <div className="px-2 space-y-1">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${location === "/" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              <Plus className="w-4 h-4" />
              New Plan
            </Link>
            <Link
              href="/history"
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${location.startsWith("/history") ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              <History className="w-4 h-4" />
              History
            </Link>
            <Link
              href="/admin"
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${location.startsWith("/admin") && location !== "/admin/login" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          </div>

          <div className="mt-8 px-4">
            <h3 className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-2">RECENT PLANS</h3>
            <div className="space-y-1.5">
              {recentPrds.map((prd) => (
                <Link key={prd.id} href={`/prd/${prd.id}`} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors flex-shrink-0" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground truncate transition-colors">
                      {prd.title || prd.featureIdea || "Untitled Plan"}
                    </span>
                  </div>
                  <span className="text-[10px] bg-secondary text-muted-foreground px-1 rounded flex-shrink-0">
                    {Math.round(prd.avgEffortPoints || 0)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground font-medium tracking-widest text-center">
            AI SPRINT PLANNING
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[160px] bg-[#151421] min-h-screen">
        {children}
      </main>
    </div>
  );
}
