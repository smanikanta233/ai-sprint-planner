import { Link, useParams } from "wouter";
import { useGetPrd } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function PrdDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: prd, isLoading } = useGetPrd(id, {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!prd) {
    return (
      <Layout>
        <div className="p-8">
          <p className="text-muted-foreground">PRD not found.</p>
        </div>
      </Layout>
    );
  }

  const sortedTasks = [...(prd.tasks || [])].sort((a, b) => b.priorityScore - a.priorityScore);
  const sprints = sortedTasks.reduce((acc, task) => {
    const sprintNum = task.sprintNumber || 0;
    if (!acc[sprintNum]) acc[sprintNum] = [];
    acc[sprintNum].push(task);
    return acc;
  }, {} as Record<number, typeof sortedTasks>);

  const sprintKeys = Object.keys(sprints).map(Number).sort((a, b) => a - b);

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <Link href="/history" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground tracking-widest uppercase mb-6 transition-colors">
            <ArrowLeft className="w-3 h-3 mr-2" />
            Back to History
          </Link>
          
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">{prd.title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {prd.targetUser && (
              <Badge variant="outline" className="border-border bg-card text-xs font-normal py-1 px-3">
                <span className="text-muted-foreground mr-2 font-semibold">USER:</span>
                {prd.targetUser}
              </Badge>
            )}
            {prd.businessGoal && (
              <Badge variant="outline" className="border-border bg-card text-xs font-normal py-1 px-3">
                <span className="text-muted-foreground mr-2 font-semibold">GOAL:</span>
                {prd.businessGoal}
              </Badge>
            )}
            {prd.urgency && (
              <Badge variant="outline" className="border-border bg-card text-xs font-normal py-1 px-3">
                <span className="text-muted-foreground mr-2 font-semibold uppercase">Urgency:</span>
                <span className="uppercase">{prd.urgency}</span>
              </Badge>
            )}
            {prd.complexity && (
              <Badge variant="outline" className="border-border bg-card text-xs font-normal py-1 px-3">
                <span className="text-muted-foreground mr-2 font-semibold uppercase">Complexity:</span>
                <span className="uppercase">{prd.complexity}</span>
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="prd" className="w-full">
          <TabsList className="bg-transparent border-b border-border w-full justify-start h-auto p-0 space-x-8 rounded-none mb-8">
            <TabsTrigger 
              value="prd" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-semibold tracking-wider uppercase text-muted-foreground data-[state=active]:text-foreground"
            >
              PRD Document
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-semibold tracking-wider uppercase text-muted-foreground data-[state=active]:text-foreground"
            >
              Task List ({sortedTasks.length})
            </TabsTrigger>
            <TabsTrigger 
              value="sprints" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-semibold tracking-wider uppercase text-muted-foreground data-[state=active]:text-foreground"
            >
              Sprint Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prd" className="space-y-6">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">PROBLEM STATEMENT</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{prd.problemStatement}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">GOALS</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{prd.goals}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">USER STORIES</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prd.userStories?.map((story, i) => (
                    <div key={i} className="text-sm bg-muted/20 border border-border rounded-md p-4 space-y-1">
                      <div><span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider w-16 inline-block">AS A</span> <span>{story.role}</span></div>
                      <div><span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider w-16 inline-block">I WANT TO</span> <span>{story.action}</span></div>
                      <div><span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider w-16 inline-block">SO THAT</span> <span>{story.benefit}</span></div>
                    </div>
                  ))}
                  {(!prd.userStories || prd.userStories.length === 0) && (
                    <p className="text-sm text-muted-foreground">No user stories.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {prd.additionalConstraints && (
               <Card className="bg-card border-border shadow-sm">
                 <CardHeader>
                   <CardTitle className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">ADDITIONAL CONSTRAINTS</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{prd.additionalConstraints}</p>
                 </CardContent>
               </Card>
            )}
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="bg-card border-border shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-4">TASK</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-4">CATEGORY</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-4 text-right">POINTS</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-4 text-right">PRIORITY</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-4">RISK</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-4 text-right">SPRINT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTasks.map((task) => (
                    <TableRow key={task.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <p className="font-medium text-sm text-foreground">{task.taskName}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[9px] uppercase tracking-wider py-0 px-2 rounded-sm bg-secondary text-secondary-foreground">
                          {task.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {task.effortPoints}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {task.priorityScore.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${
                          task.riskLevel === 'high' ? 'text-destructive' :
                          task.riskLevel === 'medium' ? 'text-amber-500' :
                          'text-emerald-500'
                        }`}>
                          {task.riskLevel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-medium">
                        {task.sprintNumber > 0 ? `Sprint ${task.sprintNumber}` : 'Backlog'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                        No tasks available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="sprints">
            <div className="flex gap-6 overflow-x-auto pb-4 items-start">
              {sprintKeys.map(sprintNum => {
                const tasks = sprints[sprintNum];
                const totalPoints = tasks.reduce((sum, t) => sum + Number(t.effortPoints), 0);
                return (
                  <div key={sprintNum} className="w-[320px] flex-shrink-0 flex flex-col bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                      <h3 className="font-bold text-sm tracking-wide text-foreground">
                        {sprintNum === 0 ? "BACKLOG" : `SPRINT ${sprintNum}`}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] font-mono bg-background border border-border">
                        {totalPoints} PTS
                      </Badge>
                    </div>
                    <div className="p-3 space-y-3 bg-background/50 h-full min-h-[200px]">
                      {tasks.map(task => (
                        <div key={task.id} className="bg-card border border-border p-3 rounded shadow-sm hover:border-primary/50 transition-colors">
                          <p className="text-xs font-medium leading-snug mb-2">{task.taskName}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className={`text-[9px] uppercase tracking-wider font-bold ${
                                task.riskLevel === 'high' ? 'text-destructive' :
                                task.riskLevel === 'medium' ? 'text-amber-500' :
                                'text-emerald-500'
                              }`}>
                              {task.riskLevel}
                            </span>
                            <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                              {task.effortPoints}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {sprintKeys.length === 0 && (
                <div className="w-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                  No sprint plans available.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}