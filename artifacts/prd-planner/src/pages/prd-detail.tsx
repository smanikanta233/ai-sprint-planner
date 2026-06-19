import { useState } from "react";
import { Link, useParams } from "wouter";
import { useGetPrd } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Loader2, FileText, ListTodo, KanbanSquare, CheckCircle2, AlertTriangle, AlertCircle, AlertOctagon } from "lucide-react";
import { format } from "date-fns";
import type { Task, UserStory } from "@workspace/api-client-react";

const getRiskColor = (risk: string) => {
  switch (risk.toLowerCase()) {
    case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'low': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getRiskIcon = (risk: string) => {
  switch (risk.toLowerCase()) {
    case 'high': return <AlertOctagon className="w-3 h-3 mr-1" />;
    case 'medium': return <AlertTriangle className="w-3 h-3 mr-1" />;
    case 'low': return <AlertCircle className="w-3 h-3 mr-1" />;
    default: return null;
  }
};

export default function PrdDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: prd, isLoading, error } = useGetPrd(id, {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading PRD details...</p>
      </div>
    );
  }

  if (error || !prd) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Failed to load PRD</h2>
          <p className="text-muted-foreground">The PRD you're looking for might not exist or there was an error loading it.</p>
          <Link href="/">
            <Button className="mt-4" data-testid="button-back-home">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Sort tasks by priority score descending
  const sortedTasks = [...(prd.tasks || [])].sort((a, b) => b.priorityScore - a.priorityScore);

  // Group tasks by sprint
  const sprints = sortedTasks.reduce((acc, task) => {
    const sprintNum = task.sprintNumber || 0;
    if (!acc[sprintNum]) acc[sprintNum] = [];
    acc[sprintNum].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  const sprintKeys = Object.keys(sprints).map(Number).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" data-testid="button-back">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="h-4 w-px bg-border hidden md:block"></div>
          <div className="flex items-center gap-3 overflow-hidden">
            <h1 className="font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-md">{prd.title}</h1>
            <Badge variant="secondary" className="capitalize hidden sm:inline-flex">{prd.status}</Badge>
          </div>
        </div>
        <div className="text-xs text-muted-foreground hidden md:block">
          Created {format(new Date(prd.createdAt), "MMM d, yyyy")}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 md:px-8 max-w-7xl mx-auto w-full">
        <Tabs defaultValue="prd" className="w-full h-full flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="prd" className="data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-prd">
                <FileText className="w-4 h-4 mr-2" />
                PRD
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-tasks">
                <ListTodo className="w-4 h-4 mr-2" />
                Tasks
                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary hover:bg-primary/20">{prd.tasks?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="sprints" className="data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-sprints">
                <KanbanSquare className="w-4 h-4 mr-2" />
                Sprint Plan
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 relative">
            <TabsContent value="prd" className="m-0 space-y-6 h-full outline-none pb-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Problem Statement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">{prd.problemStatement}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Goals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">{prd.goals}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-6">
                  <Card className="border-border/50 shadow-sm bg-muted/30">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Original Idea</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 py-1">"{prd.featureIdea}"</p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">User Stories</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {prd.userStories?.map((story, i) => (
                        <div key={i} className="text-sm bg-background border rounded-md p-3 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40"></div>
                          <div className="space-y-1 pl-1">
                            <div><span className="font-medium">As a</span> <span className="text-muted-foreground">{story.role}</span></div>
                            <div><span className="font-medium">I want to</span> <span className="text-muted-foreground">{story.action}</span></div>
                            <div><span className="font-medium">So that</span> <span className="text-muted-foreground">{story.benefit}</span></div>
                          </div>
                        </div>
                      ))}
                      {(!prd.userStories || prd.userStories.length === 0) && (
                        <p className="text-sm text-muted-foreground">No user stories defined.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="m-0 h-full outline-none">
              <Card className="border-border/50 shadow-sm flex flex-col h-full max-h-[calc(100vh-12rem)]">
                <div className="overflow-auto rounded-md">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-[300px]">Task</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right">Priority</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>Sprint</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTasks.map((task) => (
                        <TableRow key={task.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="line-clamp-1">{task.taskName}</span>
                              <span className="text-xs text-muted-foreground font-normal line-clamp-1 mt-0.5" title={task.description}>
                                {task.description}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal text-xs">{task.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                              {task.effortPoints}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {task.priorityScore.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getRiskColor(task.riskLevel)}`}>
                              {getRiskIcon(task.riskLevel)}
                              <span className="capitalize">{task.riskLevel}</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            {task.sprintNumber > 0 ? (
                              <Badge variant="secondary" className="bg-primary/5 text-primary-foreground/70 font-normal">Sprint {task.sprintNumber}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground border-dashed font-normal">Backlog</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {sortedTasks.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No tasks generated for this PRD.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="sprints" className="m-0 h-full outline-none">
              <ScrollArea className="h-[calc(100vh-12rem)] w-full pb-4">
                <div className="flex gap-6 pb-4 w-max min-w-full">
                  {sprintKeys.length === 0 ? (
                    <div className="w-full h-40 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                      No sprint plan available.
                    </div>
                  ) : (
                    sprintKeys.map(sprintNum => (
                      <div key={sprintNum} className="w-[320px] flex-shrink-0 flex flex-col bg-muted/20 rounded-xl border shadow-sm">
                        <div className="p-3 border-b bg-muted/40 rounded-t-xl flex items-center justify-between sticky top-0 backdrop-blur z-10">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {sprintNum === 0 ? (
                              <>Backlog</>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                Sprint {sprintNum}
                              </>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs font-normal">
                            {sprints[sprintNum].reduce((sum, t) => sum + t.effortPoints, 0)} pts
                          </Badge>
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto space-y-3">
                          {sprints[sprintNum].map(task => (
                            <Card key={task.id} className="border shadow-sm hover:border-primary/40 transition-colors bg-card relative overflow-hidden group">
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                task.riskLevel === 'high' ? 'bg-destructive' : 
                                task.riskLevel === 'medium' ? 'bg-amber-500' : 
                                'bg-transparent'
                              }`}></div>
                              <CardContent className="p-3 space-y-3 pl-4">
                                <p className="text-sm font-medium leading-tight">{task.taskName}</p>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 bg-background font-normal">
                                    {task.category}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    {task.riskLevel !== 'low' && (
                                      <span title={`${task.riskLevel} risk`} className="text-muted-foreground">
                                        {getRiskIcon(task.riskLevel)}
                                      </span>
                                    )}
                                    <div className="text-[10px] font-mono font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground flex items-center justify-center min-w-[20px]">
                                      {task.effortPoints}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
