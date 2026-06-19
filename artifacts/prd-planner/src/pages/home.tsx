import { useState } from "react";
import { useLocation } from "wouter";
import { useCreatePrd, getListPrdsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { Spinner } from "@/components/ui/spinner";
import { PrdInputUrgency, PrdInputComplexity } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPrd = useCreatePrd();

  const [featureIdea, setFeatureIdea] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [businessGoal, setBusinessGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [urgency, setUrgency] = useState<PrdInputUrgency>("medium" as PrdInputUrgency);
  const [complexity, setComplexity] = useState<PrdInputComplexity>("medium" as PrdInputComplexity);
  const [additionalConstraints, setAdditionalConstraints] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureIdea) {
      toast({ title: "Error", description: "Feature title is required.", variant: "destructive" });
      return;
    }

    createPrd.mutate(
      {
        data: {
          featureIdea,
          targetUser,
          businessGoal,
          deadline,
          urgency,
          complexity,
          additionalConstraints
        }
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListPrdsQueryKey() });
          setLocation(`/prd/${data.id}`);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to generate plan.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Initiate Plan</h1>
          <p className="text-muted-foreground text-sm font-medium">Convert feature specs into structured execution maps.</p>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="featureIdea" className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Feature Title</Label>
                <Input
                  id="featureIdea"
                  placeholder="e.g. Real-time Collaboration Cursor"
                  value={featureIdea}
                  onChange={e => setFeatureIdea(e.target.value)}
                  disabled={createPrd.isPending}
                  className="bg-input border-border focus-visible:ring-primary h-12"
                  data-testid="feature-title-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="targetUser" className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Target User</Label>
                  <Input
                    id="targetUser"
                    placeholder="e.g. Enterprise Admins"
                    value={targetUser}
                    onChange={e => setTargetUser(e.target.value)}
                    disabled={createPrd.isPending}
                    className="bg-input border-border h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessGoal" className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Business Goal</Label>
                  <Input
                    id="businessGoal"
                    placeholder="e.g. Increase Retention"
                    value={businessGoal}
                    onChange={e => setBusinessGoal(e.target.value)}
                    disabled={createPrd.isPending}
                    className="bg-input border-border h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed feature description..."
                  value={featureIdea}
                  onChange={e => setFeatureIdea(e.target.value)}
                  disabled={createPrd.isPending}
                  className="min-h-[120px] bg-input border-border resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Deadline / Sprint Expectation</Label>
                  <Input
                    id="deadline"
                    placeholder="e.g. End of Q3"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    disabled={createPrd.isPending}
                    className="bg-input border-border h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency" className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Urgency</Label>
                  <Select value={urgency} onValueChange={(val: any) => setUrgency(val)} disabled={createPrd.isPending}>
                    <SelectTrigger className="bg-input border-border h-10">
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complexity" className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Complexity</Label>
                <Select value={complexity} onValueChange={(val: any) => setComplexity(val)} disabled={createPrd.isPending}>
                  <SelectTrigger className="bg-input border-border h-10">
                    <SelectValue placeholder="Select complexity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalConstraints" className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Additional Constraints</Label>
                <Textarea
                  id="additionalConstraints"
                  placeholder="Any tech debt or legacy constraints?"
                  value={additionalConstraints}
                  onChange={e => setAdditionalConstraints(e.target.value)}
                  disabled={createPrd.isPending}
                  className="min-h-[80px] bg-input border-border resize-none"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6 text-sm tracking-wide mt-4"
                disabled={createPrd.isPending}
                data-testid="execute-btn"
              >
                {createPrd.isPending ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    <span>GENERATING PLAN...</span>
                  </div>
                ) : (
                  "EXECUTE PLAN GENERATION →"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}