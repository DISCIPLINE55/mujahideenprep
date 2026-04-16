import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, BookOpen } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { generateId, KEYS, getItems, defaultStudents, type Student } from "@/lib/storage";
import { useDebounce } from "@/lib/debounce";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/library")({
  head: () => ({
    meta: [
      { title: "Library — MPSMS" },
      { name: "description", content: "Library book management for Mujahideen Preparatory School" },
    ],
  }),
  component: LibraryPage,
});

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  quantity: number;
  available: number;
}

interface BookIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  returnDate: string;
  returned: boolean;
}

const CATEGORIES = ["Textbook", "Fiction", "Non-Fiction", "Reference", "Religious", "Science", "History", "Other"];

const defaultBooks: LibraryBook[] = [
  { id: "b1", title: "Mathematics for JHS", author: "K. Asante", isbn: "978-0001", category: "Textbook", quantity: 30, available: 25 },
  { id: "b2", title: "English Grammar Essentials", author: "A. Darko", isbn: "978-0002", category: "Textbook", quantity: 25, available: 20 },
  { id: "b3", title: "The Holy Quran (Translation)", author: "Various", isbn: "978-0003", category: "Religious", quantity: 50, available: 45 },
  { id: "b4", title: "Junior Science Experiments", author: "E. Kumah", isbn: "978-0004", category: "Science", quantity: 15, available: 12 },
  { id: "b5", title: "History of Ghana", author: "Y. Boakye", isbn: "978-0005", category: "History", quantity: 20, available: 18 },
];

function LibraryPage() {
  const bookStore = useStore<LibraryBook>("mpsms_library_books", defaultBooks);
  const issueStore = useStore<BookIssue>("mpsms_library_issues", []);
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [bookOpen, setBookOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryBook | null>(null);
  const [bookForm, setBookForm] = useState({ title: "", author: "", isbn: "", category: "Textbook", quantity: 1, available: 1 });
  const [issueForm, setIssueForm] = useState({ bookId: "", studentId: "", issueDate: new Date().toISOString().split("T")[0], returnDate: "" });

  const filtered = useMemo(() =>
    bookStore.items.filter((b) =>
      b.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      b.category.toLowerCase().includes(debouncedSearch.toLowerCase())
    ), [bookStore.items, debouncedSearch]);

  function handleSaveBook() {
    if (!bookForm.title.trim()) return;
    if (editing) {
      bookStore.update({ ...editing, ...bookForm });
      toast.success("Book updated");
    } else {
      bookStore.add(bookForm as Omit<LibraryBook, "id">);
      toast.success("Book added");
    }
    setBookOpen(false);
    setEditing(null);
    setBookForm({ title: "", author: "", isbn: "", category: "Textbook", quantity: 1, available: 1 });
  }

  function handleIssueBook() {
    if (!issueForm.bookId || !issueForm.studentId) return;
    const book = bookStore.items.find((b) => b.id === issueForm.bookId);
    const student = students.find((s) => s.id === issueForm.studentId);
    if (!book || !student) return;
    if (book.available <= 0) { toast.error("No copies available"); return; }

    issueStore.add({
      bookId: book.id,
      bookTitle: book.title,
      studentId: student.id,
      studentName: student.name,
      issueDate: issueForm.issueDate,
      returnDate: issueForm.returnDate,
      returned: false,
    } as Omit<BookIssue, "id">);
    bookStore.update({ ...book, available: book.available - 1 });
    toast.success(`"${book.title}" issued to ${student.name}`);
    setIssueOpen(false);
    setIssueForm({ bookId: "", studentId: "", issueDate: new Date().toISOString().split("T")[0], returnDate: "" });
  }

  function handleReturnBook(issue: BookIssue) {
    issueStore.update({ ...issue, returned: true });
    const book = bookStore.items.find((b) => b.id === issue.bookId);
    if (book) bookStore.update({ ...book, available: book.available + 1 });
    toast.success("Book returned");
  }

  const columns = [
    { key: "title", header: "Title" },
    { key: "author", header: "Author" },
    { key: "category", header: "Category" },
    { key: "quantity", header: "Total", render: (row: LibraryBook) => String(row.quantity) },
    { key: "available", header: "Available", render: (row: LibraryBook) => <Badge variant={row.available > 0 ? "default" : "destructive"}>{row.available}</Badge> },
    { key: "actions", header: "Actions", render: (row: LibraryBook) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(row); setBookForm({ title: row.title, author: row.author, isbn: row.isbn, category: row.category, quantity: row.quantity, available: row.available }); setBookOpen(true); }}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { bookStore.remove(row.id); toast.success("Book removed"); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    )},
  ];

  return (
    <>
      <TopBar title="Library Management" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIssueOpen(true)}><BookOpen className="h-4 w-4 mr-1" /> Issue Book</Button>
            <Button size="sm" onClick={() => { setEditing(null); setBookForm({ title: "", author: "", isbn: "", category: "Textbook", quantity: 1, available: 1 }); setBookOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Book</Button>
          </div>
        </div>

        <DataTable
          data={filtered}
          columns={columns}
        />

        {/* Recent issues */}
        {issueStore.items.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">Recent Book Issues</h3>
            <div className="space-y-2">
              {[...issueStore.items].reverse().slice(0, 10).map((issue) => (
                <div key={issue.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{issue.bookTitle}</p>
                    <p className="text-xs text-muted-foreground">{issue.studentName} • Issued: {issue.issueDate}</p>
                  </div>
                  {issue.returned ? (
                    <Badge variant="default">Returned</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleReturnBook(issue)}>Return</Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Book" : "Add Book"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Author</Label><Input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>ISBN</Label><Input value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={bookForm.category} onValueChange={(v) => setBookForm({ ...bookForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Total Copies</Label><Input type="number" min={0} value={bookForm.quantity} onChange={(e) => setBookForm({ ...bookForm, quantity: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Available</Label><Input type="number" min={0} value={bookForm.available} onChange={(e) => setBookForm({ ...bookForm, available: parseInt(e.target.value) || 0 })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBook} disabled={!bookForm.title.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Book</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Book *</Label>
              <Select value={issueForm.bookId} onValueChange={(v) => setIssueForm({ ...issueForm, bookId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a book" /></SelectTrigger>
                <SelectContent>{bookStore.items.filter((b) => b.available > 0).map((b) => <SelectItem key={b.id} value={b.id}>{b.title} ({b.available} avail.)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={issueForm.studentId} onValueChange={(v) => setIssueForm({ ...issueForm, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.class}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Issue Date</Label><Input type="date" value={issueForm.issueDate} onChange={(e) => setIssueForm({ ...issueForm, issueDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Return Date</Label><Input type="date" value={issueForm.returnDate} onChange={(e) => setIssueForm({ ...issueForm, returnDate: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueOpen(false)}>Cancel</Button>
            <Button onClick={handleIssueBook} disabled={!issueForm.bookId || !issueForm.studentId}>Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
