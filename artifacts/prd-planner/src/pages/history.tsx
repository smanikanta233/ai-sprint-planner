import { useListPrds } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

function getPriorityLabel(score: number) {
  if (score >= 18) return { label: 'CRITICAL', color: 'bg-destructive/10 text-destructive border-destructive/20' };
  if (score >= 12) return { label: 'HIGH', color: 'bg-primary/10 text-primary border-primary/20' };
  if (score >= 6) return { label: 'MEDIUM', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
  return { label: 'LOW', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
}

export default function History() {
  const { data: prds, isLoading } = useListPrds();

  const totalPlans = prds?.length || 0;
  const avgPriority = Math.round(
    prds?.reduce((acc, p) => acc + (p.avgPriorityScore || 0), 0)! / (totalPlans || 1)
  );
  const avgEffort = Math.round(
    prds?.reduce((acc, p) => acc + (p.avgEffortPoints || 0), 0)! / (totalPlans || 1)
  );

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Execution History</h1>
          <p className="text-muted-foreground text-sm font-medium">Past sprint plans and statistics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-2">TOTAL PLANS</p>
              <p className="text-4xl font-bold text-foreground">{totalPlans}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-2">AVG PRIORITY</p>
              <p className="text-4xl font-bold text-foreground">{isNaN(avgPriority) ? 0 : avgPriority}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-2">AVG EFFORT</p>
              <p className="text-4xl font-bold text-foreground">{isNaN(avgEffort) ? 0 : avgEffort}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-4">FEATURE</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-4">PRIORITY</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-4 text-right">EFFORT</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-4 text-right">SPRINTS</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-4 text-right">DATE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    Loading history...
                  </TableCell>
                </TableRow>
              ) : prds?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <p className="text-muted-foreground text-sm mb-4">No execution plans generated yet.</p>
                    <Link href="/" className="text-primary hover:underline text-sm font-medium">Initiate your first plan →</Link>
                  </TableCell>
                </TableRow>
              ) : (
                prds?.map(prd => {
                  const priority = getPriorityLabel(prd.avgPriorityScore || 0);
                  return (
                    <TableRow key={prd.id} className="border-border hover:bg-muted/30 transition-colors group">
                      <TableCell className="font-medium">
                        <Link href={`/prd/${prd.id}`} className="block text-foreground group-hover:text-primary transition-colors">
                          {prd.title || prd.featureIdea || "Untitled Feature"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] tracking-wider py-0 px-2 rounded-sm border ${priority.color}`}>
                          {priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {Math.round(prd.avgEffortPoints || 0)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {prd.sprintCount || 0}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {format(new Date(prd.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </Layout>
  );
}