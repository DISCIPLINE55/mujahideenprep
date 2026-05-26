import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  Sparkles, Printer, Download, Image as ImageIcon, Paintbrush, 
  Bold, Italic, Underline, Trash2, FileText, Loader2, Eraser, 
  Square, Circle, Minus, Upload 
} from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { KEYS, CLASS_LIST, defaultSubjects, type Subject } from "@/lib/storage";
import { streamSchoolAI } from "@/lib/ai";
import { getAuthSync } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/exam-creator")({
  head: () => ({
    meta: [
      { title: "AI Exam Creator — MPSMS" },
      { name: "description", content: "Create professional examinations using AI" },
    ],
  }),
  component: ExamCreatorPage,
});

// Helper to sanitize markdown from AI output
function cleanExamText(text: string): string {
  return text
    .replace(/\*\*/g, "") // remove bold markers
    .replace(/##+/g, "")  // remove headers
    .replace(/#/g, "")    // remove headers
    .replace(/`/g, "");   // remove code backticks
}

function ExamCreatorPage() {
  const auth = getAuthSync();
  const isAdmin = auth?.role === "admin";
  const isTeacher = auth?.role === "teacher";

  // Access check
  if (!isAdmin && !isTeacher) {
    return (
      <>
        <TopBar title="Exam Creator" />
        <div className="p-6">
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="py-6 text-center text-destructive font-bold">
              Access Denied: Only Admins and Teachers can generate exams.
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Load active subjects
  const subjectStore = useStore<Subject>(KEYS.SUBJECTS, defaultSubjects);
  const activeSubjects = subjectStore.items.filter(s => s.status === "Active");

  // Form states
  const [selectedClass, setSelectedClass] = useState(CLASS_LIST[0]);
  const [subject, setSubject] = useState(activeSubjects[0]?.name || "General Science");
  const [examType, setExamType] = useState("End of Term Examination");
  const [questionType, setQuestionType] = useState("Mixed (Objectives & Theory)");
  const [topics, setTopics] = useState("");
  const [numQuestions, setNumQuestions] = useState("10");
  const [timeAllowed, setTimeAllowed] = useState("1 Hour 30 Minutes");
  const [instructions, setInstructions] = useState("Answer all questions in Section A and three in Section B.");
  const [academicTerm, setAcademicTerm] = useState("Third Term");
  const [academicYear, setAcademicYear] = useState("2025/2026");

  const [sourceType, setSourceType] = useState<"topics" | "questions">("topics");
  const [draftQuestions, setDraftQuestions] = useState("");

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [examContent, setExamContent] = useState("");

  // Editor Ref
  const editorRef = useRef<HTMLDivElement>(null);

  // Dialog States
  const [canvasOpen, setCanvasOpen] = useState(false);

  // Canvas drawing states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [penColor, setPenColor] = useState("#000000");
  const [penWidth, setPenWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<"draw" | "text">("draw");
  const [attachQuestion, setAttachQuestion] = useState("none");

  // Sync state content to editor during AI streaming
  useEffect(() => {
    if (editorRef.current && isGenerating) {
      editorRef.current.innerHTML = examContent;
    }
  }, [examContent, isGenerating]);

  // Document Editor Formatting helpers
  const applyFormat = (command: string, value: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

  // Safe insertion helper at cursor selection
  const insertHTMLAtCursor = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Ensure cursor is inside the editor
      if (editor.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const div = document.createElement("div");
        div.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node;
        let lastNode = null;
        while ((node = div.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        return;
      }
    }
    
    // Fallback if cursor not selected or not in editor
    editor.innerHTML += html;
  };

  // Generate Document Heading
  const getHeaderTemplate = () => {
    const dateStr = new Date().toLocaleDateString(undefined, { dateStyle: 'medium' });
    return `<div style="text-align: center; font-family: 'Courier New', Courier, monospace; margin-bottom: 20px;">
  <div style="font-size: 20px; font-weight: bold; text-transform: uppercase;">MUJAHIDEEN PREPARATORY SCHOOL</div>
  <div style="font-size: 13px; font-weight: bold; text-transform: uppercase;">P.O. BOX 24, MANKESSIM, CENTRAL REGION</div>
  <div style="font-size: 14px; font-weight: bold; margin-top: 5px; text-transform: uppercase;">${examType} - ${academicTerm.toUpperCase()} - ${academicYear}</div>
  <hr style="border: none; border-top: 3px double #000; margin: 15px 0;" />
  <table style="width: 100%; text-align: left; font-size: 12px; font-weight: bold; border-collapse: collapse; margin-bottom: 10px;">
    <tr>
      <td style="width: 50%; padding: 4px 0;">CLASS: ${selectedClass.toUpperCase()}</td>
      <td style="width: 50%; padding: 4px 0; text-align: right;">TIME ALLOWED: ${timeAllowed.toUpperCase()}</td>
    </tr>
    <tr>
      <td style="width: 50%; padding: 4px 0;">SUBJECT: ${subject.toUpperCase()}</td>
      <td style="width: 50%; padding: 4px 0; text-align: right;">DATE: ${dateStr}</td>
    </tr>
  </table>
  <table style="width: 100%; text-align: left; font-size: 12px; font-weight: bold; margin-bottom: 15px;">
    <tr>
      <td style="width: 65%;">STUDENT NAME: ____________________________</td>
      <td style="width: 35%; text-align: right;">INDEX NO: ______________</td>
    </tr>
  </table>
  <div style="text-align: left; font-size: 12px; font-style: italic; border: 1px solid #000; padding: 8px; margin-bottom: 20px;">
    INSTRUCTIONS: ${instructions}
  </div>
</div>
`;
  };

  // Call AI Exam Generator
  const handleGenerateExam = async () => {
    if (sourceType === "topics" && !topics.trim()) {
      toast.error("Please enter topics to cover in the exam.");
      return;
    }
    if (sourceType === "questions" && !draftQuestions.trim()) {
      toast.error("Please paste or type the draft questions to enhance.");
      return;
    }

    setIsGenerating(true);
    const headerHtml = getHeaderTemplate();
    setExamContent(headerHtml);

    let userPrompt = "";
    if (sourceType === "topics") {
      userPrompt = `
Generate a professional terminal examination paper.
CLASS LEVEL: ${selectedClass}
SUBJECT: ${subject}
EXAM TYPE: ${examType}
QUESTION FORMATS REQUESTED: ${questionType}
NUMBER OF QUESTIONS: ${numQuestions}
TOPICS TO SOURCE FROM: ${topics}
INSTRUCTIONS TO RENDER: ${instructions}

Format the output text as a neat, numbered academic test:
- Start directly with SECTION A (if Objectives/MCQs are requested) and/or SECTION B (if Theory/Essay is requested).
- If Objectives/MCQs are generated, list standard A, B, C, D choices clearly aligned vertically or on single lines.
- Do NOT output any markdown tags (no **, no ##, no #). Format using capitals and line breaks only.
- Include a dotted line at the end, followed by a hidden or separate ANSWER MARKING SCHEME/KEY (e.g. ANSWER KEY: 1. A, 2. C...) for the teacher's reference.
`;
    } else {
      userPrompt = `
You are a highly professional examination enhancement assistant. Take the draft questions provided below and enhance, rephrase, and structure them into a high-standard school exam.
CLASS LEVEL: ${selectedClass}
SUBJECT: ${subject}
EXAM TYPE: ${examType}
QUESTION FORMATS REQUESTED: ${questionType}
TIME ALLOWED: ${timeAllowed}
INSTRUCTIONS TO RENDER: ${instructions}

DRAFT QUESTIONS TO ENHANCE:
${draftQuestions}

Please perform these enhancements:
1. Rephrase each question to sound clear, unambiguous, and grammatically impeccable matching the appropriate academic grade: ${selectedClass}.
2. Ensure proper vertical alignment and letter choices (A, B, C, D) if Multiple Choice format is requested.
3. Organize the exam into clean sections (e.g. SECTION A, SECTION B) matching the requested question format: ${questionType}.
4. Conform exactly to West African / GES standards of school examinations.
5. Do NOT output any markdown tags (no **, no ##, no #). Format using capitals and line breaks only.
6. Include a dotted line at the end, followed by a separate ANSWER KEY/MARKING SCHEME for the teacher.
`;
    }

    let accumulatedText = "";

    await streamSchoolAI({
      type: "exam_creator",
      messages: [
        { role: "user", content: userPrompt }
      ],
      onDelta: (chunk) => {
        accumulatedText += chunk;
        const cleanedText = cleanExamText(accumulatedText);
        // Convert double-newlines in plain text to html line breaks for preview
        const htmlBody = cleanedText.replace(/\n/g, "<br/>");
        setExamContent(headerHtml + `<div style="font-family: 'Courier New', Courier, monospace; font-size: 13px; line-height: 1.6; text-align: left;">` + htmlBody + `</div>`);
      },
      onDone: () => {
        setIsGenerating(false);
        toast.success("Exam paper generated successfully!");
      },
      onError: (err) => {
        setIsGenerating(false);
        toast.error(`Failed to generate exam: ${err}`);
      }
    });
  };

  // Clear Editor
  const handleClearEditor = () => {
    if (confirm("Are you sure you want to clear the editor? Any unsaved edits will be lost.")) {
      setExamContent("");
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }
  };

  // Print Exam Paper
  const handlePrintExam = () => {
    window.print();
  };

  // Download Plain Text
  const handleDownloadTxt = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const textContent = editor.innerText;
    
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Exam_Paper_${selectedClass.replace(/\s+/g, "_")}_${subject.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exam downloaded as Text file");
  };

  // Download editable Word DOC file
  const handleDownloadDoc = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const innerHtml = editor.innerHTML;

    const documentHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <title>Exam Paper</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Courier New', Courier, monospace; font-size: 11pt; line-height: 1.5; padding: 20px; }
  </style>
</head>
<body>
  ${innerHtml}
</body>
</html>`;

    const blob = new Blob(["\ufeff" + documentHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Exam_Paper_${selectedClass.replace(/\s+/g, "_")}_${subject.replace(/\s+/g, "_")}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exam downloaded as Word Document");
  };

  // Upload Local Diagram File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const qNo = prompt("Attach this diagram to a specific question number? (Enter number, e.g. 5, or leave blank to insert at current cursor):");
      
      let imgTag = "";
      if (!qNo || qNo.trim() === "") {
        imgTag = `<br/><img src="${base64Url}" style="max-width: 100%; height: auto; max-height: 240px; display: block; border: 1px solid #ccc; margin: 12px 0;" alt="diagram" /><br/>`;
      } else {
        imgTag = `<br/><div style="text-align: center; margin: 15px 0; display: inline-block; max-width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 8px; background: white; font-family: 'Courier New', Courier, monospace;">
          <img src="${base64Url}" style="max-width: 100%; height: auto; max-height: 240px; display: block; border: none;" alt="diagram-q${qNo}" />
          <div style="font-size: 11px; font-weight: bold; margin-top: 6px; text-transform: uppercase;">
            Figure for Question ${qNo}
          </div>
        </div><br/>`;
      }
      insertHTMLAtCursor(imgTag);
      toast.success("Diagram image inserted!");
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset file picker
  };

  // Upload Local Document File containing questions
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (file.name.endsWith(".txt")) {
        setDraftQuestions(text);
        setSourceType("questions");
        toast.success("Document text imported successfully!");
      } else {
        // Basic plain text extraction for other files
        const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, "").trim();
        setDraftQuestions(cleanText.slice(0, 8000));
        setSourceType("questions");
        toast.success("Text extracted from document!");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset file picker
  };

  // Canvas Sketching Operations
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initial strokes configuration
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  useEffect(() => {
    if (canvasOpen) {
      setTimeout(initCanvas, 50); // Small timeout to ensure element rendered
    }
  }, [canvasOpen]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      // Touch Event
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      // Mouse Event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    if (drawMode === "text") {
      const labelText = prompt("Enter label / text text:");
      if (labelText) {
        ctx.font = "bold 13px 'Courier New', Courier, monospace";
        ctx.fillStyle = penColor;
        ctx.fillText(labelText, x, y);
      }
      return;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      ctx?.closePath();
      setIsDrawing(false);
    }
  };

  const handleInsertCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    let imgHtml = "";
    if (attachQuestion === "none") {
      imgHtml = `<br/><img src="${dataUrl}" style="max-width: 100%; height: auto; max-height: 240px; display: block; border: 1px dashed #000; padding: 4px; margin: 12px 0; background: white;" alt="canvas-diagram" /><br/>`;
    } else {
      imgHtml = `<br/><div style="text-align: center; margin: 15px 0; display: inline-block; max-width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 8px; background: white; font-family: 'Courier New', Courier, monospace;">
        <img src="${dataUrl}" style="max-width: 100%; height: auto; max-height: 240px; display: block; border: none;" alt="diagram-q${attachQuestion}" />
        <div style="font-size: 11px; font-weight: bold; margin-top: 6px; text-transform: uppercase;">
          Figure for Question ${attachQuestion}
        </div>
      </div><br/>`;
    }
    
    insertHTMLAtCursor(imgHtml);
    setCanvasOpen(false);
    setAttachQuestion("none"); // Reset state
    toast.success("Sketch inserted successfully!");
  };

  const clearCanvas = () => {
    initCanvas();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: portrait;
            margin: 1.5cm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-hide {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
          }
          .exam-paper-print {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
          }
        }
        #exam-editor-content img {
          max-width: 100% !important;
          height: auto !important;
          max-height: 240px !important;
          object-fit: contain !important;
          display: block;
          margin: 12px auto !important;
        }
        #exam-editor-content div {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
      `}} />
      <TopBar title="Exam Creator" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between print-hide">
          <div>
            <h2 className="text-xl font-bold text-foreground">AI Exam Creator</h2>
            <p className="text-sm text-muted-foreground">Generate, draw, and print standard examinations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Options Panel (Left) */}
          <div className="lg:col-span-4 space-y-4 print-hide">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-sm text-primary uppercase tracking-wider mb-2">Exam Parameters</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="class-select" className="text-xs">Class Level</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger id="class-select" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CLASS_LIST.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="subject-select" className="text-xs">Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger id="subject-select" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {activeSubjects.length > 0 ? (
                          activeSubjects.map((s) => <SelectItem key={s.id} value={s.name} className="text-xs">{s.name}</SelectItem>)
                        ) : (
                          <SelectItem value="General Science" className="text-xs">General Science</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="academic-term" className="text-xs">Academic Term</Label>
                    <Select value={academicTerm} onValueChange={setAcademicTerm}>
                      <SelectTrigger id="academic-term" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Term" className="text-xs">First Term</SelectItem>
                        <SelectItem value="Second Term" className="text-xs">Second Term</SelectItem>
                        <SelectItem value="Third Term" className="text-xs">Third Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="academic-year" className="text-xs">Academic Year</Label>
                    <Input 
                      id="academic-year" 
                      value={academicYear} 
                      onChange={(e) => setAcademicYear(e.target.value)} 
                      className="h-9 text-xs" 
                      placeholder="e.g. 2025/2026"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="exam-type" className="text-xs">Examination Type</Label>
                  <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger id="exam-type" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Class Test" className="text-xs">Class Test</SelectItem>
                      <SelectItem value="Mid-Term Examination" className="text-xs">Mid-Term Examination</SelectItem>
                      <SelectItem value="End of Term Examination" className="text-xs">End of Term Examination</SelectItem>
                      <SelectItem value="Mock Examination" className="text-xs">Mock Examination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="q-type" className="text-xs">Question Format</Label>
                    <Select value={questionType} onValueChange={setQuestionType}>
                      <SelectTrigger id="q-type" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Multiple Choice (Objectives)" className="text-xs">Objectives Only</SelectItem>
                        <SelectItem value="Theory / Essay" className="text-xs">Theory Only</SelectItem>
                        <SelectItem value="Mixed (Objectives & Theory)" className="text-xs">Mixed (A & B)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="q-count" className="text-xs">Questions Count</Label>
                    <Select value={numQuestions} onValueChange={setNumQuestions}>
                      <SelectTrigger id="q-count" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["5", "10", "15", "20", "30", "40"].map((n) => <SelectItem key={n} value={n} className="text-xs">{n} Questions</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="time-allowed" className="text-xs">Time Allowed</Label>
                    <Input 
                      id="time-allowed" 
                      value={timeAllowed} 
                      onChange={(e) => setTimeAllowed(e.target.value)} 
                      className="h-9 text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="instructions" className="text-xs">Instructions</Label>
                    <Input 
                      id="instructions" 
                      value={instructions} 
                      onChange={(e) => setInstructions(e.target.value)} 
                      className="h-9 text-xs" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold">Questions Source</Label>
                  <div className="flex border rounded-md overflow-hidden bg-background">
                    <button 
                      type="button"
                      className={`text-[11px] font-medium h-7 flex-1 transition-colors cursor-pointer ${sourceType === "topics" ? "bg-secondary text-secondary-foreground font-semibold" : "hover:bg-muted text-muted-foreground"}`}
                      onClick={() => setSourceType("topics")}
                    >
                      Syllabus Topics
                    </button>
                    <button 
                      type="button"
                      className={`text-[11px] font-medium h-7 flex-1 transition-colors cursor-pointer ${sourceType === "questions" ? "bg-secondary text-secondary-foreground font-semibold" : "hover:bg-muted text-muted-foreground"}`}
                      onClick={() => setSourceType("questions")}
                    >
                      Enhance Drafts
                    </button>
                  </div>
                </div>

                {sourceType === "topics" ? (
                  <div className="space-y-1 pt-1">
                    <Label htmlFor="topics-textarea" className="text-xs">Enter Syllabus Topics (separated by commas)</Label>
                    <Textarea
                      id="topics-textarea"
                      placeholder="e.g. Photosynthesis, Plant structure, Living and Non-living things"
                      value={topics}
                      onChange={(e) => setTopics(e.target.value)}
                      className="min-h-[85px] text-xs leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="drafts-textarea" className="text-xs">Paste Your Draft Questions (one per line)</Label>
                      <button 
                        type="button" 
                        className="text-[10px] text-primary font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                        onClick={() => document.getElementById("doc-upload-helper")?.click()}
                      >
                        <Upload className="h-2.5 w-2.5" /> Upload file
                      </button>
                    </div>
                    <Textarea
                      id="drafts-textarea"
                      placeholder="e.g. 1. What is gravity?&#10;2. Draft: who invented the telephone? (A) Bell (B) Edison"
                      value={draftQuestions}
                      onChange={(e) => setDraftQuestions(e.target.value)}
                      className="min-h-[85px] text-xs leading-relaxed"
                    />
                    <p className="text-[9px] text-muted-foreground leading-none mt-0.5">Supported format: .txt (Raw text) or copy-paste directly.</p>
                  </div>
                )}

                <Button 
                  onClick={handleGenerateExam} 
                  className="w-full text-xs font-semibold h-10 mt-2 cursor-pointer" 
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                      {sourceType === "questions" ? "Enhancing Drafts..." : "Generating Questions..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-2 text-lemon" />
                      {sourceType === "questions" ? "Enhance Draft Questions" : "Generate Exam Paper"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Exam Editor Sheet (Right) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Rich formatting toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 border bg-card rounded-lg print-hide shadow-sm">
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => applyFormat("bold")} 
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => applyFormat("italic")} 
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => applyFormat("underline")} 
                  title="Underline"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <div className="w-[1px] h-6 bg-border mx-1" />
                
                {/* Insert sketch diagram */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs gap-1.5" 
                  onClick={() => setCanvasOpen(true)}
                  title="Draw a diagram on canvas"
                >
                  <Paintbrush className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sketch Diagram</span>
                </Button>

                {/* Upload diagram */}
                <div className="relative">
                  <input 
                    type="file" 
                    id="image-upload-helper" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs gap-1.5" 
                    onClick={() => document.getElementById("image-upload-helper")?.click()}
                    title="Upload diagram image file"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Upload Image</span>
                  </Button>
                </div>

                {/* Upload document */}
                <div className="relative">
                  <input 
                    type="file" 
                    id="doc-upload-helper" 
                    accept=".txt,.doc,.docx,.pdf" 
                    onChange={handleDocUpload} 
                    className="hidden" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs gap-1.5" 
                    onClick={() => document.getElementById("doc-upload-helper")?.click()}
                    title="Upload document containing questions"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Upload Doc</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleClearEditor} title="Clear Paper">
                  <Trash2 className="h-4 w-4" />
                </Button>

                <div className="w-[1px] h-6 bg-border mx-0.5" />

                <Select onValueChange={(val) => {
                  if (val === "txt") handleDownloadTxt();
                  else if (val === "doc") handleDownloadDoc();
                }}>
                  <SelectTrigger className="h-8 text-xs gap-1.5 w-10 sm:w-28"><Download className="h-3.5 w-3.5" /><span className="hidden sm:inline"><SelectValue placeholder="Export" /></span></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="txt" className="text-xs">Plain Text (.txt)</SelectItem>
                    <SelectItem value="doc" className="text-xs">Word Doc (.doc)</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlePrintExam} title="Print Exam Paper">
                  <Printer className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Print Paper</span>
                </Button>
              </div>
            </div>

            {/* Editable A4 Sheet */}
            <div 
              className="w-full bg-card border rounded-lg shadow-md overflow-x-auto p-1 sm:p-2 print:border-none print:shadow-none print:p-0"
            >
              <div 
                id="exam-editor-content"
                ref={editorRef}
                contentEditable={true}
                suppressContentEditableWarning={true}
                className="min-h-[750px] w-full max-w-[800px] mx-auto bg-white text-black p-4 sm:p-8 md:p-12 border shadow-sm rounded-md font-mono whitespace-pre-wrap break-words leading-relaxed outline-none focus:ring-1 focus:ring-primary/20 relative exam-paper-print"
                {...{ placeholder: "Click here to type or use the controls on the left to generate exam paper questions..." }}
                style={{ fontFamily: "'Courier New', Courier, monospace" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Sketchpad Drawing Dialog */}
      <Dialog open={canvasOpen} onOpenChange={setCanvasOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xl sm:w-full mx-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Paintbrush className="h-5 w-5 text-primary" /> Diagram Sketchpad</DialogTitle>
            <DialogDescription className="text-xs">Draw geometric shapes, arrows, or labels using your cursor/touch screen, then insert them directly into the exam document.</DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-2">
            {/* Sketch Controls */}
            <div className="flex flex-wrap gap-3 items-center justify-between w-full p-2 border rounded-lg bg-muted/30 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Color:</span>
                <div className="flex gap-1.5">
                  {["#000000", "#002699", "#cc0000", "#008000"].map((c) => (
                    <button 
                      key={c} 
                      className={`h-5 w-5 rounded-full border transition-all ${penColor === c ? "ring-2 ring-primary ring-offset-1 scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setPenColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Mode:</span>
                <div className="flex border rounded-md overflow-hidden bg-background">
                  <Button 
                    variant={drawMode === "draw" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-7 text-xs px-2.5 rounded-none cursor-pointer"
                    onClick={() => setDrawMode("draw")}
                  >
                    Brush
                  </Button>
                  <Button 
                    variant={drawMode === "text" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-7 text-xs px-2.5 rounded-none cursor-pointer"
                    onClick={() => setDrawMode("text")}
                  >
                    Text Label
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Stroke:</span>
                <Select value={penWidth.toString()} onValueChange={(val) => setPenWidth(parseInt(val))}>
                  <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" className="text-xs">1px (Fine)</SelectItem>
                    <SelectItem value="3" className="text-xs">3px (Medium)</SelectItem>
                    <SelectItem value="5" className="text-xs">5px (Thick)</SelectItem>
                    <SelectItem value="8" className="text-xs">8px (Bold)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 cursor-pointer" onClick={clearCanvas}>
                  <Eraser className="h-3 w-3" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Drawing Canvas */}
            <div className="border border-border rounded-lg overflow-hidden bg-white shadow-inner w-full max-w-[500px]">
              <canvas
                ref={canvasRef}
                width={500}
                height={350}
                className="cursor-crosshair bg-white w-full h-auto max-w-full aspect-[500/350]"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>

          <DialogFooter className="w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 border-t pt-3">
              <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                <span className="font-semibold text-muted-foreground whitespace-nowrap">Attach to Question:</span>
                <Select value={attachQuestion} onValueChange={setAttachQuestion}>
                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">None (Cursor)</SelectItem>
                    {Array.from({ length: 20 }, (_, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()} className="text-xs">Question {idx + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" className="text-xs h-8 cursor-pointer" onClick={() => setCanvasOpen(false)}>Cancel</Button>
                <Button className="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" onClick={handleInsertCanvasImage}>Insert to Exam</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
