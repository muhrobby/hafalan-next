"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Key, Loader2, Check, AlertCircle } from "lucide-react";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string; email: string } | null;
  onSuccess: () => void;
}

export default function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ResetPasswordDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Password tidak cocok",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal reset password");
      }

      toast({
        title: "Berhasil!",
        description: `Password ${user.name} berhasil direset`,
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Reset password untuk: <strong>{user.name}</strong>
            <br />
            <span className="text-xs">{user.email}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              User akan diminta login ulang dengan password baru
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Password Baru *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
