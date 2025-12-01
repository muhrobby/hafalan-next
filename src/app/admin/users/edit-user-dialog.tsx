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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { showAlert } from "@/lib/alert";
import { AlertCircle, Save } from "lucide-react";

interface Teacher {
  id: string;
  user: { name: string; email: string };
  nip: string;
}

interface Wali {
  id: string;
  user: { name: string };
  phone?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  teacherProfile?: {
    id: string;
    nip: string;
    phone?: string;
    address?: string;
  };
  waliProfile?: {
    id: string;
    phone?: string;
    address?: string;
    occupation?: string;
  };
  santriProfile?: {
    id: string;
    nis: string;
    phone?: string;
    address?: string;
    birthPlace?: string;
    birthDate?: string;
    gender?: string;
    teacherId?: string;
    waliId?: string;
    teacherAssignments?: Array<{
      id: string;
      teacherId: string;
    }>;
  };
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export default function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [walis, setWalis] = useState<Wali[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    occupation: "",
    nip: "",
    nis: "",
    birthPlace: "",
    birthDate: "",
    gender: "",
    waliId: "",
    teacherIds: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    if (open && user) {
      fetchReferenceData();
      setFormData({
        name: user.name,
        email: user.email,
        phone:
          user.teacherProfile?.phone ||
          user.waliProfile?.phone ||
          user.santriProfile?.phone ||
          "",
        address:
          user.teacherProfile?.address ||
          user.waliProfile?.address ||
          user.santriProfile?.address ||
          "",
        occupation: user.waliProfile?.occupation || "",
        nip: user.teacherProfile?.nip || "",
        nis: user.santriProfile?.nis || "",
        birthPlace: user.santriProfile?.birthPlace || "",
        birthDate: user.santriProfile?.birthDate || "",
        gender: user.santriProfile?.gender || "",
        waliId: user.santriProfile?.waliId || "",
        teacherIds:
          user.santriProfile?.teacherAssignments?.map((t) => t.teacherId) || [],
        isActive: user.isActive,
      });
    }
  }, [open, user]);

  const fetchReferenceData = async () => {
    try {
      const [teachersRes, walisRes] = await Promise.all([
        fetch("/api/users?role=TEACHER&limit=200"),
        fetch("/api/users?role=WALI&limit=200"),
      ]);

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(
          teachersData.data
            ?.filter((u: any) => u.teacherProfile)
            .map((u: any) => ({
              id: u.teacherProfile.id,
              user: { name: u.name, email: u.email },
              nip: u.teacherProfile.nip,
            })) || []
        );
      }

      if (walisRes.ok) {
        const walisData = await walisRes.json();
        setWalis(
          walisData.data
            ?.filter((u: any) => u.waliProfile)
            .map((u: any) => ({
              id: u.waliProfile.id,
              user: { name: u.name },
              phone: u.waliProfile.phone,
            })) || []
        );
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        isActive: formData.isActive,
      };

      if (user.role === "TEACHER") {
        payload.nip = formData.nip || undefined;
      }

      if (user.role === "WALI") {
        payload.occupation = formData.occupation || undefined;
      }

      if (user.role === "SANTRI") {
        payload.nis = formData.nis || undefined;
        payload.birthPlace = formData.birthPlace || undefined;
        payload.birthDate = formData.birthDate || undefined;
        payload.gender = formData.gender || undefined;
        payload.waliId =
          formData.waliId && formData.waliId !== "__NONE__"
            ? formData.waliId
            : undefined;
        payload.teacherIds =
          formData.teacherIds.length > 0 ? formData.teacherIds : undefined;
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengupdate pengguna");
      }

      showAlert.success("Berhasil!", `${formData.name} berhasil diupdate`);

      // Refresh data and close dialog
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      showAlert.error("Error", error.message || "Gagal mengupdate pengguna");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      occupation: "",
      nip: "",
      nis: "",
      birthPlace: "",
      birthDate: "",
      gender: "",
      waliId: "",
      teacherIds: [],
      isActive: true,
    });
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleTeacherToggle = (teacherId: string) => {
    setFormData((prev) => ({
      ...prev,
      teacherIds: prev.teacherIds.includes(teacherId)
        ? prev.teacherIds.filter((id) => id !== teacherId)
        : [...prev.teacherIds, teacherId],
    }));
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
          <DialogDescription>Edit informasi {user.role}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Role: <strong>{user.role}</strong> (tidak dapat diubah)
            </AlertDescription>
          </Alert>

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

          {user.role === "WALI" && (
            <div>
              <Label htmlFor="occupation">Pekerjaan</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    occupation: e.target.value,
                  }))
                }
                placeholder="Pekerjaan"
              />
            </div>
          )}

          {user.role === "SANTRI" && (
            <>
              <div>
                <Label htmlFor="birthPlace">Tempat Lahir</Label>
                <Input
                  id="birthPlace"
                  value={formData.birthPlace}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      birthPlace: e.target.value,
                    }))
                  }
                  placeholder="Kota kelahiran"
                />
              </div>

              <div>
                <Label>Jenis Kelamin</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Laki-laki</SelectItem>
                    <SelectItem value="FEMALE">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="waliId">Wali Santri</Label>
                <Select
                  value={formData.waliId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, waliId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih wali (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">Tidak ada</SelectItem>
                    {walis.map((wali) => (
                      <SelectItem key={wali.id} value={wali.id}>
                        {wali.user.name}
                        {wali.phone && ` - ${wali.phone}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Guru Pembimbing</Label>
                <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
                  {teachers.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Belum ada guru tersedia
                    </p>
                  ) : (
                    teachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <Checkbox
                          checked={formData.teacherIds.includes(teacher.id)}
                          onCheckedChange={() =>
                            handleTeacherToggle(teacher.id)
                          }
                        />
                        <div className="flex-1">
                          <p className="font-medium">{teacher.user.name}</p>
                          <p className="text-xs text-gray-500">
                            NIP: {teacher.nip}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.teacherIds.length} guru dipilih
                </p>
              </div>
            </>
          )}

          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
            <Label className="cursor-pointer">Akun Aktif</Label>
          </div>
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
            disabled={loading || !formData.name}
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
