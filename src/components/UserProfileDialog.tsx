import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuthSync, setAuth, type AuthState } from "@/lib/auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function UserProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const auth = getAuthSync();
  const { t } = useTranslation();
  const [name, setName] = useState(auth?.name || "");
  const [email, setEmail] = useState(auth?.email || "");
  const [avatar, setAvatarUrl] = useState(() => localStorage.getItem(`avatar_${auth?.email}`) || "");

  function handleSave() {
    if (!auth) return;
    const updated: AuthState = { ...auth, name, email };
    setAuth(updated);
    localStorage.setItem(`avatar_${email}`, avatar);
    toast.success("Profile updated");
    onOpenChange(false);
    window.dispatchEvent(new Event("storage")); // trigger TopBar refresh
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{t("Profile")}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="relative">
              <Button variant="outline" size="sm" className="relative z-10 overflow-hidden">
                Upload Image
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
