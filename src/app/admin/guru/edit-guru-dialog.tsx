"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { showAlert } from "@/lib/alert";
import { AlertCircle, Save, GraduationCap } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  teacherProfile?: {
    id: string;
    nip: string;
    phone?: string;
    address?: string;
  } | null;
}

interface EditGuruDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher | null;
  onSuccess: () => void;
}

export default function EditGuruDialog({
  open,
  onOpenChange,
  teacher,
  onSuccess,
}: EditGuruDialogProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nip: "",
    phone: "",
    address: "",
    isActive: true,
  });

  useEffect(() => {
    if (open && teacher) {
      setFormData({
        name: teacher.name || "",
        email: teacher.email || "",
        nip: teacher.teacherProfile?.nip || "",
        phone: teacher.teacherProfile?.phone || "",
        address: teacher.teacherProfile?.address || "",
        isActive: teacher.isActive,
      });
    }
  }, [open, teacher]);

  const handleSubmit = async () => {
    if (!teacher) return;

    if (!formData.name.trim()) {
      showAlert.error("Error", "Nama tidak boleh kosong");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        nip: formData.nip.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        isActive: formData.isActive,
      };

      const response = await fetch(`/api/users/${teacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengupdate guru");
      }

      showAlert.success("Berhasil!", `Data ${formData.name} berhasil diupdate`);

      // Refresh data and close dialog
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      showAlert.error("Error", error.message || "Gagal mengupdate guru");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      nip: "",
      phone: "",
      address: "",
      isActive: true,
    });
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Edit Data Guru
          </DialogTitle>
          <DialogDescription>
            Perbarui informasi guru {teacher.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <Label htmlFor="nip">NIP</Label>
            <Input
              id="nip"
              value={formData.nip}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nip: e.target.value }))
              }
              placeholder="Nomor Induk Pegawai"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">No. Telepon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Alamat lengkap"
            />
          </div>

          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
            <Label className="cursor-pointer">
              {formData.isActive ? "Akun Aktif" : "Akun Non-Aktif"}
            </Label>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Untuk mengelola santri binaan guru ini, gunakan tombol "Kelola
              Santri" di halaman Data Guru.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              "Menyimpan..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
