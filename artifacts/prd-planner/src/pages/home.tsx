import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListPrds, useCreatePrd, getListPrdsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Sparkles, Settings, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const [featureIdea, setFeatureIdea] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: prds, isLoading: isLoadingPrds } = useListPrds();
  const createPrd = useCreatePrd({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListPrdsQueryKey() });
        setLocation(`/prd/${data.id}`);
      }
    }
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureIdea.trim()) return;
    createPrd.mutate({ data: { featureIdea } });
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-sidebar/30 flex flex-col hidden md:flex">
        <div className="p-4 border-b bg-sidebar/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-md">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-semibold text-foreground tracking-tight">PRD Planner</h1>
          </div>
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" data-testid="link-admin">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recent PRDs</h2>
          <ScrollArea className="flex-1 -mx-4 px-4">
            <div className="space-y-2">
              {isLoadingPrds ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : prds?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center p-4">No PRDs generated yet.</p>
              ) : (
                prds?.map((prd) => (
                  <Link href={`/prd/${prd.id}`} key={prd.id}>
                    <div
                      className="group p-3 rounded-lg border border-transparent hover:border-border hover:bg-card transition-colors cursor-pointer"
                      data-testid={`link-prd-${prd.id}`}
                    >
                      <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {prd.title || "Untitled PRD"}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(prd.createdAt), "MMM d, yyyy")}
                        </span>
                        <div className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize">
                          {prd.status}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto">
        <div className="md:hidden p-4 border-b flex justify-between items-center bg-background/95 backdrop-blur z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-semibold">PRD Planner</h1>
          </div>
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="link-admin-mobile">Admin</Button>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-2xl mx-auto space-y-8">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">What are we building?</h2>
              <p className="text-muted-foreground text-lg">Describe your feature idea. We'll structure it into a PRD, break it down into tasks, and plan your sprints.</p>
            </div>

            <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
              <form onSubmit={handleGenerate} className="flex flex-col">
                <Textarea
                  placeholder="e.g., We need a way for users to bulk export their analytics data as CSV or PDF so they can use it in external reporting tools..."
                  className="min-h-[200px] border-0 focus-visible:ring-0 resize-none p-6 text-base shadow-none bg-transparent"
                  value={featureIdea}
                  onChange={(e) => setFeatureIdea(e.target.value)}
                  disabled={createPrd.isPending}
                  data-testid="input-feature-idea"
                  autoFocus
                />
                <div className="p-4 bg-muted/30 border-t flex justify-between items-center">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Powered by GPT-4
                  </div>
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={!featureIdea.trim() || createPrd.isPending}
                    data-testid="button-generate"
                    className="gap-2"
                  >
                    {createPrd.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating PRD...
                      </>
                    ) : (
                      <>
                        Generate Plan
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Quick links for mobile */}
            <div className="md:hidden mt-12 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground px-1">Recent</h3>
              {isLoadingPrds ? (
                <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
              ) : prds?.slice(0, 3).map((prd) => (
                <Link href={`/prd/${prd.id}`} key={prd.id}>
                  <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="font-medium text-sm mb-1">{prd.title || "Untitled PRD"}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(prd.createdAt), "MMM d, yyyy")}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
