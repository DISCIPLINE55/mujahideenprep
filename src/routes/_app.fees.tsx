import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable } from "@/components/DataTable";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Wallet, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/_app/fees")({
  head: () => ({
    meta: [
      { title: "Fees — MPSMS" },
      { name: "description", content: "Fee management and payments" },
    ],
  }),
  component: FeesPage,
});

const payments = [
  { id: "1", student: "Amina Ibrahim", class: "JHS 3", amount: "₵ 850", paid: "₵ 850", balance: "₵ 0", status: "Paid", date: "2026-01-15" },
  { id: "2", student: "Kwame Mensah", class: "Primary 6", amount: "₵ 650", paid: "₵ 400", balance: "₵ 250", status: "Partial", date: "2026-02-10" },
  { id: "3", student: "Fatima Agyei", class: "KG 2", amount: "₵ 500", paid: "₵ 500", balance: "₵ 0", status: "Paid", date: "2026-01-20" },
  { id: "4", student: "Yusuf Osei", class: "JHS 1", amount: "₵ 800", paid: "₵ 0", balance: "₵ 800", status: "Unpaid", date: "—" },
  { id: "5", student: "Zainab Boateng", class: "Nursery 2", amount: "₵ 450", paid: "₵ 450", balance: "₵ 0", status: "Paid", date: "2026-01-18" },
  { id: "6", student: "Abdul-Rahman Tetteh", class: "Primary 3", amount: "₵ 600", paid: "₵ 300", balance: "₵ 300", status: "Partial", date: "2026-03-01" },
];

const columns = [
  {
    key: "student",
    header: "Student",
    render: (row: typeof payments[0]) => <span className="font-medium text-foreground">{row.student}</span>,
  },
  { key: "class", header: "Class" },
  { key: "amount", header: "Total Fee" },
  { key: "paid", header: "Paid" },
  { key: "balance", header: "Balance" },
  {
    key: "status",
    header: "Status",
    render: (row: typeof payments[0]) => (
      <Badge variant={row.status === "Paid" ? "default" : row.status === "Partial" ? "secondary" : "destructive"}>
        {row.status}
      </Badge>
    ),
  },
  { key: "date", header: "Last Payment" },
];

function FeesPage() {
  return (
    <>
      <TopBar title="Fees & Finance" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Fee Management</h2>
            <p className="text-sm text-muted-foreground">Term 2, 2025/2026 Academic Year</p>
          </div>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> Record Payment
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Expected" value="₵ 58,000" icon={Wallet} />
          <StatsCard title="Total Collected" value="₵ 45,200" icon={TrendingUp} trend={{ value: "78%", positive: true }} />
          <StatsCard title="Outstanding" value="₵ 12,800" icon={AlertCircle} />
          <StatsCard title="Fully Paid" value="342" icon={CheckCircle} trend={{ value: "65% of students", positive: true }} />
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search payments..." className="pl-9" />
        </div>

        <DataTable columns={columns} data={payments} />
      </div>
    </>
  );
}
