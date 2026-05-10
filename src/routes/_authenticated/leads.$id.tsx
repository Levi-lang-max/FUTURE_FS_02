import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { STATUSES, type LeadStatus } from "@/lib/lead-schemas";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/leads/$id")({
  component: LeadDetail,
});

type Lead = Tables<"leads">;
type Note = Tables<"lead_notes">;

function LeadDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    void load();
  }, [id]);

  async function load() {
    setLoading(true);
    const [{ data: l }, { data: n }] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id).maybeSingle(),
      supabase.from("lead_notes").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    ]);
    setLead(l);
    setNotes(n ?? []);
    setLoading(false);
  }

  async function save() {
    if (!lead) return;
    setSaving(true);
    const { error } = await supabase
      .from("leads")
      .update({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        message: lead.message,
        status: lead.status,
      })
      .eq("id", lead.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead updated");
  }

  async function addNote() {
    if (!newNote.trim() || !lead) return;
    const { error } = await supabase.from("lead_notes").insert({
      lead_id: lead.id,
      body: newNote.trim(),
      author_id: user?.id ?? null,
    });
    if (error) { toast.error(error.message); return; }
    setNewNote("");
    void load();
  }

  async function deleteNote(noteId: string) {
    const { error } = await supabase.from("lead_notes").delete().eq("id", noteId);
    if (error) { toast.error(error.message); return; }
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  async function deleteLead() {
    if (!lead) return;
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead deleted");
    navigate({ to: "/dashboard" });
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!lead) return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-foreground">Lead not found.</p>
      <Link to="/dashboard"><Button variant="outline" className="mt-4">Back to dashboard</Button></Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          <p className="text-sm text-muted-foreground">
            Submitted {format(new Date(lead.created_at), "PPp")} · source: {lead.source}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the lead and all notes. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void deleteLead()}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Lead details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Name">
              <Input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={lead.phone ?? ""} onChange={(e) => setLead({ ...lead, phone: e.target.value || null })} />
            </Field>
            <Field label="Company">
              <Input value={lead.company ?? ""} onChange={(e) => setLead({ ...lead, company: e.target.value || null })} />
            </Field>
            <Field label="Status">
              <Select value={lead.status} onValueChange={(v) => setLead({ ...lead, status: v as LeadStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Original message">
              <Textarea
                rows={4}
                value={lead.message ?? ""}
                onChange={(e) => setLead({ ...lead, message: e.target.value || null })}
              />
            </Field>
            <Button onClick={() => void save()} disabled={saving} className="w-full">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes & follow-ups</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                rows={3}
                placeholder="Add a follow-up note…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button onClick={() => void addNote()} disabled={!newNote.trim()} className="w-full">
                Add note
              </Button>
            </div>
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : notes.map((n) => (
                <div key={n.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm whitespace-pre-wrap text-foreground">{n.body}</p>
                    <button
                      onClick={() => void deleteNote(n.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(n.created_at), "PPp")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
