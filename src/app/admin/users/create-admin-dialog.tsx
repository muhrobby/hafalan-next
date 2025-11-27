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
import { Shield, Loader2, Check } from "lucide-react";

interface CreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateAdminDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAdminDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "ADMIN",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal membuat admin");
      }

      toast({
        title: "Berhasil!",
        description: `${formData.name} berhasil ditambahkan sebagai admin`,
      });

      onSuccess();
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tambah Admin Baru
          </DialogTitle>
          <DialogDescription>
            Admin memiliki akses penuh ke seluruh sistem
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <Alert className="bg-red-50 border-red-200">
            <Shield className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Perhatian: Admin dapat mengakses dan mengubah semua data
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Masukkan nama lengkap"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@example.com"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Minimal 6 karakter"
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
              disabled={
                loading ||
                !formData.name ||
                !formData.email ||
                !formData.password
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Tambah Admin
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
