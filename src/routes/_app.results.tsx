import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Upload, Download } from "lucide-react";

export const Route = createFileRoute("/_app/results")({
  head: () => ({
    meta: [
      { title: "Results — MPSMS" },
      { name: "description", content: "Exam results and report cards" },
    ],
  }),
  component: ResultsPage,
});

const results = [
  { id: "1", student: "Amina Ibrahim", class: "JHS 3", math: 85, english: 78, science: 92, total: 255, average: 85, position: "1st" },
  { id: "2", student: "Kwame Mensah", class: "Primary 6", math: 72, english: 88, science: 65, total: 225, average: 75, position: "3rd" },
  { id: "3", student: "Fatima Agyei", class: "KG 2", math: 90, english: 85, science: 88, total: 263, average: 88, position: "1st" },
  { id: "4", student: "Yusuf Osei", class: "JHS 1", math: 60, english: 70, science: 55, total: 185, average: 62, position: "8th" },
  { id: "5", student: "Zainab Boateng", class: "Nursery 2", math: 95, english: 92, science: 90, total: 277, average: 92, position: "1st" },
];

function gradeColor(avg: number) {
  if (avg >= 80) return "default";
  if (avg >= 60) return "secondary";
  return "destructive";
}

const columns = [
  {
    key: "student",
    header: "Student",
    render: (row: typeof results[0]) => <span className="font-medium text-foreground">{row.student}</span>,
  },
  { key: "class", header: "Class" },
  { key: "math", header: "Math" },
  { key: "english", header: "English" },
  { key: "science", header: "Science" },
  { key: "total", header: "Total" },
  {
    key: "average",
    header: "Average",
    render: (row: typeof results[0]) => (
      <Badge variant={gradeColor(row.average) as "default" | "secondary" | "destructive"}>
        {row.average}%
      </Badge>
    ),
  },
  { key: "position", header: "Position" },
];

function ResultsPage() {
  return (
    <>
      <TopBar title="Results" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Exam Results</h2>
            <p className="text-sm text-muted-foreground">Term 2, 2025/2026 Academic Year</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" /> Report Cards
            </Button>
            <Button size="sm">
              <Upload className="mr-1 h-4 w-4" /> Upload Scores
            </Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search results..." className="pl-9" />
        </div>

        <DataTable columns={columns} data={results} />
      </div>
    </>
  );
}
