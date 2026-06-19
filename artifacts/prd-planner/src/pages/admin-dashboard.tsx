import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, getAuthToken, clearAuthToken } from "@/lib/admin-auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { 
  ChevronLeft, 
  LogOut, 
  FileText, 
  CheckSquare, 
  Settings, 
  Activity, 
  Save, 
  Loader2,
  TerminalSquare
} from "lucide-react";
import { format } from "date-fns";

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border shadow-lg rounded-lg p-3 text-sm">
        <p className="font-medium mb-1 text-foreground">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-muted-foreground" style={{ color: p.color }}>
            {p.name}: <span className="font-semibold text-foreground">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for sprint config form
  const [sprintLength, setSprintLength] = useState("");
  const [velocityPoints, setVelocityPoints] = useState("");

  // Check auth on mount
  useEffect(() => {
    if (!getAuthToken()) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    clearAuthToken();
    setLocation("/");
  };

  // Data fetching using custom wrapped API calls
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => adminApi.getAdminStats()
  });

  const { data: sprintConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["sprintConfig"],
    queryFn: () => adminApi.getSprintConfig()
  });

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["adminLogs"],
    queryFn: () => adminApi.getAdminLogs()
  });

  // Init form when config loads
  useEffect(() => {
    if (sprintConfig) {
      setSprintLength(sprintConfig.sprintLengthDays.toString());
      setVelocityPoints(sprintConfig.velocityPoints.toString());
    }
  }, [sprintConfig]);

  const updateConfigMutation = useMutation({
    mutationFn: (data: { sprintLengthDays?: number, velocityPoints?: number }) => 
      adminApi.updateSprintConfig(data),
    onSuccess: (data) => {
      queryClient.setQueryData(["sprintConfig"], data);
      toast({
        title: "Settings saved",
        description: "Sprint configuration updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sprint configuration.",
        variant: "destructive",
      });
    }
  });

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const length = parseInt(sprintLength, 10);
    const velocity = parseInt(velocityPoints, 10);
    
    if (isNaN(length) || isNaN(velocity) || length < 1 || velocity < 1) {
      toast({
        title: "Invalid input",
        description: "Values must be numbers greater than 0.",
        variant: "destructive",
      });
      return;
    }

    updateConfigMutation.mutate({
      sprintLengthDays: length,
      velocityPoints: velocity
    });
  };

  // Prepare chart data
  const sprintChartData = stats?.tasksBySprint.map(s => ({
    name: s.sprintNumber === 0 ? "Backlog" : `Sprint ${s.sprintNumber}`,
    tasks: s.taskCount
  })) || [];

  const COLORS = {
    high: "hsl(var(--destructive))",
    medium: "#f59e0b", // amber-500
    low: "#10b981",    // emerald-500
  };

  const riskChartData = stats?.tasksByRisk.map(r => ({
    name: r.riskLevel.charAt(0).toUpperCase() + r.riskLevel.slice(1),
    value: r.count,
    color: COLORS[r.riskLevel.toLowerCase() as keyof typeof COLORS] || "hsl(var(--muted))"
  })) || [];

  if (isLoadingStats || isLoadingConfig) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/50 px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="h-4 w-px bg-border"></div>
          <h1 className="font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Admin Dashboard
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground gap-2">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </header>

      <div className="flex-1 p-4 md:p-6 md:px-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total PRDs</p>
              <h3 className="text-3xl font-bold tracking-tight">{stats?.totalPrds || 0}</h3>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
                <CheckSquare className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Tasks</p>
              <h3 className="text-3xl font-bold tracking-tight">{stats?.totalTasks || 0}</h3>
            </CardContent>
          </Card>
          <Card className="shadow-sm md:col-span-2 lg:col-span-2 p-6 flex flex-col justify-center">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Current Configuration</p>
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    <span className="text-2xl font-bold">{sprintConfig?.sprintLengthDays || 0}</span>
                    <span className="text-xs text-muted-foreground ml-1">Days/Sprint</span>
                  </div>
                  <div className="w-px h-8 bg-border"></div>
                  <div>
                    <span className="text-2xl font-bold">{sprintConfig?.velocityPoints || 0}</span>
                    <span className="text-xs text-muted-foreground ml-1">Pts/Sprint</span>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tasks per Sprint Chart */}
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Tasks by Sprint</CardTitle>
                </CardHeader>
                <CardContent className="pl-0 h-[300px]">
                  {sprintChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sprintChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} dy={10} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} dx={-10} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                        <Bar dataKey="tasks" name="Tasks" radius={[4, 4, 0, 0]}>
                          {sprintChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === "Backlog" ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-t border-dashed">
                      No sprint data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risk Distribution Chart */}
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] pb-4">
                  {riskChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie
                          data={riskChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        >
                          {riskChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36} 
                          iconType="circle"
                          formatter={(value, entry: any) => <span className="text-sm font-medium text-foreground ml-1">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-t border-dashed">
                      No risk data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="max-w-xl shadow-sm border-border/50">
              <CardHeader>
                <CardTitle>Sprint Configuration</CardTitle>
                <CardDescription>
                  Adjust the parameters used by the AI to plan sprints and allocate tasks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveConfig} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sprintLength">Sprint Length (Days)</Label>
                      <Input 
                        id="sprintLength" 
                        type="number" 
                        min="1"
                        value={sprintLength}
                        onChange={(e) => setSprintLength(e.target.value)}
                        className="max-w-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">Standard duration of a sprint cycle.</p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="velocity">Team Velocity (Points/Sprint)</Label>
                      <Input 
                        id="velocity" 
                        type="number" 
                        min="1"
                        value={velocityPoints}
                        onChange={(e) => setVelocityPoints(e.target.value)}
                        className="max-w-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">Maximum effort points a team can complete in a single sprint.</p>
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={updateConfigMutation.isPending} className="gap-2">
                    {updateConfigMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Configuration
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>Recent activity and events.</CardDescription>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <TerminalSquare className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead className="w-[150px]">Event</TableHead>
                        <TableHead className="w-[100px]">PRD ID</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingLogs ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : logs && logs.length > 0 ? (
                        logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider bg-background">
                                {log.eventType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.prdId ? `#${log.prdId}` : "-"}
                            </TableCell>
                            <TableCell className="text-sm max-w-md truncate" title={log.details}>
                              {log.details}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No logs found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
