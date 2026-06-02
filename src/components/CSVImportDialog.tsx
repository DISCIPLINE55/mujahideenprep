import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { CLASS_LIST, generateId, type Student } from "@/lib/storage";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (students: Omit<Student, "id">[]) => Promise<void> | void;
}

const REQUIRED = ["name", "class"];
const TEMPLATE_HEADERS = ["name","class","gender","guardian","phone","dob","address","region","status","fees"];

export function CSVImportDialog({ open, onOpenChange, onImport }: Props) {
  const [rows, setRows] = useState<Omit<Student, "id">[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setRows([]); setErrors([]); setFileName("");
  }

  function downloadTemplate() {
    const sample = [
      TEMPLATE_HEADERS.join(","),
      "Kwame Mensah,KG 1,Male,Akua Mensah,0241234567,2019-05-12,Mankessim,Central,Active,Unpaid",
      "Ama Boateng,Primary 1,Female,Yaw Boateng,0207654321,2018-08-30,Cape Coast,Central,Active,Unpaid",
    ].join("\n");
    const blob = new Blob([sample], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "students_import_template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (res) => {
        const errs: string[] = [];
        const validRows: Omit<Student, "id">[] = [];
        const headers = res.meta.fields || [];
        const missing = REQUIRED.filter((r) => !headers.includes(r));
        if (missing.length) {
          setErrors([`Missing required columns: ${missing.join(", ")}`]);
          setRows([]);
          return;
        }
        (res.data as Record<string, string>[]).forEach((r, i) => {
          const lineNo = i + 2;
          const name = (r.name || "").trim();
          const cls = (r.class || "").trim();
          let gender = (r.gender || "").trim();
          let guardian = (r.guardian || "").trim();
          let phone = (r.phone || "").trim();

          if (!name) { errs.push(`Row ${lineNo}: missing name`); return; }
          if (!CLASS_LIST.includes(cls)) { errs.push(`Row ${lineNo}: invalid class "${cls}"`); return; }

          if (!gender) {
            gender = "Male";
          } else if (!["Male", "Female"].includes(gender)) {
            errs.push(`Row ${lineNo}: gender must be Male or Female`);
            return;
          }

          if (!guardian) {
            guardian = "Unassigned";
          }

          if (!phone) {
            phone = "Unassigned";
          }

          validRows.push({
            name, class: cls, gender, guardian, phone,
            dob: (r.dob || "").trim() || null,
            address: (r.address || "").trim(),
            region: (r.region || "").trim(),
            status: (r.status || "Active").trim() || "Active",
            fees: (r.fees || "Unpaid").trim() || "Unpaid",
            photo: "",
          });
        });
        setErrors(errs);
        setRows(validRows);
      },
      error: (err) => setErrors([`Parse error: ${err.message}`]),
    });
  }

  async function handleImport() {
    if (rows.length === 0) { toast.error("Nothing to import"); return; }
    setBusy(true);
    try {
      await onImport(rows);
      toast.success(`Imported ${rows.length} students`);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Import failed: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="w-[95%] sm:w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Students from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple students at once. Required columns: name, class. Other fields (gender, guardian, phone, dob, address, region, status, fees) are optional and default to sensible values if omitted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" /> Download Template
          </Button>

          <div className="space-y-2">
            <Label>CSV File</Label>
            <Input type="file" accept=".csv,text/csv" onChange={handleFile} />
            {fileName && <p className="text-xs text-muted-foreground">Selected: {fileName}</p>}
          </div>

          {errors.length > 0 && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                <AlertCircle className="h-4 w-4" /> {errors.length} issue(s)
              </div>
              <ul className="text-xs text-destructive space-y-1">
                {errors.slice(0, 20).map((e, i) => <li key={i}>• {e}</li>)}
                {errors.length > 20 && <li>…and {errors.length - 20} more</li>}
              </ul>
            </div>
          )}

          {rows.length > 0 && (
            <div className="rounded-lg border bg-success/5 border-success/30 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-success mb-2">
                <CheckCircle2 className="h-4 w-4" /> {rows.length} valid student(s) ready to import
              </div>
              <div className="max-h-48 overflow-y-auto overflow-x-auto text-xs">
                <table className="w-full">
                  <thead className="text-muted-foreground">
                    <tr><th className="text-left py-1">Name</th><th className="text-left">Class</th><th className="text-left">Guardian</th></tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-t"><td className="py-1">{r.name}</td><td>{r.class}</td><td>{r.guardian}</td></tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && <p className="text-muted-foreground mt-2">…{rows.length - 10} more</p>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={busy || rows.length === 0}>
            <Upload className="h-4 w-4 mr-1" /> {busy ? "Importing…" : `Import ${rows.length} students`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// keep generateId reachable for callers that rely on it via this module
export { generateId };