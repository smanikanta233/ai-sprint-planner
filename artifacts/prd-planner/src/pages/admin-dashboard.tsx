import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats, fetchAdminPrds, fetchAdminLogs, setAdminToken } from "@/lib/admin-api";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

const getUrgencyColor = (u: string) => {
  if (u === 'critical') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (u === 'high') return 'bg-primary/10 text-primary border-primary/20';
  if (u === 'medium') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
};

const getComplexityColor = (c: string) => {
  if (c === 'high') return 'bg-primary/10 text-primary border-primary/20';
  if (c === 'medium') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
};

const getPriorityColor = (p: string) => {
  if (p === 'critical') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (p === 'high') return 'bg-primary/10 text-primary border-primary/20';
  if (p === 'medium') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [complexityFilter, setComplexityFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: stats, isError: isStatsError } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    retry: false
  });

  const { data: prds } = useQuery({
    queryKey: ["admin-prds", urgencyFilter, complexityFilter, priorityFilter],
    queryFn: () => fetchAdminPrds({
      urgency: urgencyFilter !== "all" ? urgencyFilter : undefined,
      complexity: complexityFilter !== "all" ? complexityFilter : undefined,
      priorityLabel: priorityFilter !== "all" ? priorityFilter : undefined
    }),
    retry: false
  });

  const { data: logs } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: fetchAdminLogs,
    retry: false
  });

  if (isStatsError) {
    setAdminToken(null);
    setLocation("/admin/login");
    return null;
  }

  const handleSignOut = () => {
    setAdminToken(null);
    setLocation("/admin/login");
  };

  return (
    <Layout>
      <div className="p-8 max-w-[1400px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm font-medium">System-wide execution metrics and access logs.</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="text-xs uppercase tracking-widest font-bold">
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-2">TOTAL WORKFLOWS GENERATED</p>
              <p className="text-4xl font-bold text-foreground">{stats?.totalPrds || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-2">HIGH PRIORITY WORKFLOWS</p>
              <p className="text-4xl font-bold text-foreground">{stats?.highPriorityCount || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-2">AVERAGE PRIORITY SCORE</p>
              <p className="text-4xl font-bold text-foreground">{(stats?.avgPriorityScore || 0).toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-2">AVERAGE EFFORT SCORE</p>
              <p className="text-4xl font-bold text-foreground">{Math.round(stats?.avgEffortScore || 0)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-2">AVERAGE SPRINT COUNT</p>
              <p className="text-4xl font-bold text-foreground">{(stats?.avgSprintCount || 0).toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-2">MOST RECENT WORKFLOW</p>
              <p className="text-xl font-bold text-foreground mt-2">
                {stats?.mostRecentDate ? format(new Date(stats.mostRecentDate), "MMM dd, yyyy") : "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap items-center gap-6">
            <div className="text-[10px] uppercase tracking-[0.1em] font-bold text-muted-foreground mr-2">FILTER BY:</div>
            
            <div className="flex items-center gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-input border-border">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-input border-border">
                  <SelectValue placeholder="All Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Select value={complexityFilter} onValueChange={setComplexityFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-input border-border">
                  <SelectValue placeholder="All Complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Complexity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 whitespace-nowrap">FEATURE TITLE</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 whitespace-nowrap">TARGET USER</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 whitespace-nowrap">URGENCY</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 whitespace-nowrap">COMPLEXITY</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 whitespace-nowrap">PRIORITY LABEL</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 text-right whitespace-nowrap">PRIORITY SCORE</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 text-right whitespace-nowrap">EFFORT SCORE</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 text-right whitespace-nowrap">SPRINTS</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 text-right whitespace-nowrap">CREATED AT</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 text-right w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prds?.map(prd => (
                  <TableRow key={prd.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-medium text-xs max-w-[200px] truncate" title={prd.title}>
                      {prd.title}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {prd.targetUser || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] uppercase tracking-wider py-0 px-1.5 rounded-sm border ${getUrgencyColor(prd.urgency)}`}>
                        {prd.urgency || "none"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] uppercase tracking-wider py-0 px-1.5 rounded-sm border ${getComplexityColor(prd.complexity)}`}>
                        {prd.complexity || "none"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] uppercase tracking-wider py-0 px-1.5 rounded-sm border ${getPriorityColor(prd.priorityLabel)}`}>
                        {prd.priorityLabel || "none"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-muted-foreground">
                      {prd.avgPriorityScore?.toFixed(1) || "-"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-muted-foreground">
                      {Math.round(prd.avgEffortScore || 0)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {prd.sprintCount || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(prd.createdAt), "MM/dd/yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/prd/${prd.id}`} className="text-muted-foreground hover:text-primary transition-colors inline-block p-1">
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div>
          <h2 className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-4">ACCESS LOG</h2>
          <Card className="bg-card border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[400px]">
              <Table>
                <TableHeader className="bg-muted/10 sticky top-0">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 w-[150px]">EVENT</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 w-[150px]">IP ADDRESS</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3">USER AGENT</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] font-bold py-3 text-right w-[180px]">TIMESTAMP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map(log => (
                    <TableRow key={log.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <Badge variant="secondary" className="text-[9px] bg-secondary text-secondary-foreground py-0 uppercase tracking-widest rounded-sm">
                          {log.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.ipAddress || "Unknown"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[300px]" title={log.userAgent || ""}>
                        {log.userAgent || "Unknown"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {format(new Date(log.timestamp), "MM/dd/yy HH:mm:ss")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs">No logs found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}