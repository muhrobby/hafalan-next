"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Users,
  GraduationCap,
  Home,
  Edit,
  Save,
  X,
} from "lucide-react";

interface Teacher {
  id: string;
  nip: string;
  user: {
    name: string;
    email: string | null;
  };
}

interface Wali {
  id: string;
  occupation?: string;
  user: {
    name: string;
  };
}

interface SantriProfile {
  id: string;
  nis: string;
  phone: string;
  birthDate: string | null;
  birthPlace: string | null;
  gender: string;
  address: string | null;
  isActive: boolean;
  teacher?: {
    id: string;
    user: { name: string };
  };
  wali?: {
    id: string;
    user: { name: string };
  };
  teacherAssignments?: Array<{
    id: string;
    teacherId: string;
    teacher: Teacher;
  }>;
}

interface Santri {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  santriProfile: SantriProfile;
}

interface SantriDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  santri: Santri | null;
  onUpdate?: () => void;
}

export function SantriDetailModal({
  open,
  onOpenChange,
  santri,
  onUpdate,
}: SantriDetailModalProps) {
  const { toast } = useToast();
  const [isEditingWali, setIsEditingWali] = useState(false);
  const [isEditingTeachers, setIsEditingTeachers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableWalis, setAvailableWalis] = useState<Wali[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [selectedWaliId, setSelectedWaliId] = useState<string>("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [currentSantri, setCurrentSantri] = useState<Santri | null>(santri);

  // Refetch santri data from API
  const refetchSantri = async () => {
    if (!santri) return;
    try {
      console.log("=== REFETCHING SANTRI ===");
      console.log("Looking for santri ID:", santri.id);

      const response = await fetch(`/api/users?role=SANTRI&limit=500`);
      if (!response.ok) throw new Error("Failed to refetch santri");
      const data = await response.json();

      console.log("Total santri fetched:", data.data.length);

      const updatedSantri = data.data.find((s: Santri) => s.id === santri.id);

      console.log("Updated santri found:", !!updatedSantri);
      if (updatedSantri) {
        console.log(
          "Teacher assignments:",
          updatedSantri.santriProfile.teacherAssignments
        );
        console.log(
          "Teacher assignments count:",
          updatedSantri.santriProfile.teacherAssignments?.length
        );

        setCurrentSantri(updatedSantri);
        setSelectedWaliId(updatedSantri.santriProfile.wali?.id || "__NONE__");
        setSelectedTeacherIds(
          updatedSantri.santriProfile.teacherAssignments?.map(
            (ta: any) => ta.teacherId
          ) || []
        );
      } else {
        console.log("WARNING: Santri not found in refetch!");
      }
    } catch (error) {
      console.error("Error refetching santri:", error);
    }
  };

  useEffect(() => {
    if (open && santri) {
      // Set initial values
      setCurrentSantri(santri);
      setSelectedWaliId(santri.santriProfile.wali?.id || "__NONE__");
      setSelectedTeacherIds(
        santri.santriProfile.teacherAssignments?.map((ta) => ta.teacherId) || []
      );

      // Fetch available walis and teachers
      fetchAvailableWalis();
      fetchAvailableTeachers();
    }
  }, [open, santri]);

  const fetchAvailableWalis = async () => {
    try {
      const response = await fetch("/api/users?role=WALI");
      if (!response.ok) throw new Error("Failed to fetch walis");
      const data = await response.json();
      setAvailableWalis(
        data.data.map((u: any) => ({
          id: u.waliProfile.id,
          occupation: u.waliProfile.occupation,
          user: { name: u.name },
        }))
      );
    } catch (error) {
      console.error("Error fetching walis:", error);
    }
  };

  const fetchAvailableTeachers = async () => {
    try {
      const response = await fetch("/api/users?role=TEACHER");
      if (!response.ok) throw new Error("Failed to fetch teachers");
      const data = await response.json();
      setAvailableTeachers(
        data.data.map((u: any) => ({
          id: u.teacherProfile.id,
          nip: u.teacherProfile.nip,
          user: { name: u.name, email: u.email },
        }))
      );
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleSaveWali = async () => {
    if (!santri) return;

    try {
      setLoading(true);
      const waliId = selectedWaliId === "__NONE__" ? null : selectedWaliId;

      const response = await fetch(
        `/api/admin/santri/${santri.santriProfile.id}/assign-wali`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waliId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update wali");
      }

      toast({
        title: "Berhasil",
        description: waliId
          ? "Wali santri berhasil diubah"
          : "Wali santri berhasil dihapus",
      });

      setIsEditingWali(false);
      // Refetch santri data to show updated info in modal
      await refetchSantri();
      // Also call parent's onUpdate to refresh the list
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah wali santri",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeachers = async () => {
    if (!santri) return;

    try {
      setLoading(true);

      console.log("=== FRONTEND: Saving Teachers ===");
      console.log("selectedTeacherIds:", selectedTeacherIds);
      console.log("selectedTeacherIds count:", selectedTeacherIds.length);
      console.log(
        "availableTeachers:",
        availableTeachers.map((t) => ({ id: t.id, name: t.user.name }))
      );

      const response = await fetch(
        `/api/admin/santri/${santri.santriProfile.id}/assign-teacher`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherIds: selectedTeacherIds }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.log("=== ERROR Response ===", error);
        throw new Error(error.error || "Failed to update teachers");
      }

      toast({
        title: "Berhasil",
        description: "Guru pembimbing berhasil diperbarui",
      });

      setIsEditingTeachers(false);
      // Refetch santri data to show updated info in modal
      await refetchSantri();
      // Also call parent's onUpdate to refresh the list
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah guru pembimbing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherToggle = (teacherId: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  if (!currentSantri) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6" />
            Detail Santri
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap santri dan pengelolaan wali & guru pembimbing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Dasar
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <Label className="text-xs text-gray-500">Nama Lengkap</Label>
                <p className="font-medium">{currentSantri.name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">NIS</Label>
                <p className="font-medium">{currentSantri.santriProfile.nis}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Label>
                <p className="font-medium text-sm">{currentSantri.email}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Telepon
                </Label>
                <p className="font-medium">
                  {currentSantri.santriProfile.phone || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Tempat Lahir
                </Label>
                <p className="font-medium">
                  {currentSantri.santriProfile.birthPlace || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Tanggal Lahir
                </Label>
                <p className="font-medium">
                  {formatDate(currentSantri.santriProfile.birthDate)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Jenis Kelamin</Label>
                <Badge variant="outline">
                  {currentSantri.santriProfile.gender === "MALE"
                    ? "Laki-laki"
                    : "Perempuan"}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Status</Label>
                <Badge
                  variant={currentSantri.isActive ? "default" : "secondary"}
                >
                  {currentSantri.isActive ? "Aktif" : "Non-Aktif"}
                </Badge>
              </div>
            </div>
            {currentSantri.santriProfile.address && (
              <div className="mt-3 bg-gray-50 p-3 rounded">
                <Label className="text-xs text-gray-500">Alamat</Label>
                <p className="text-sm">{currentSantri.santriProfile.address}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Wali Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home className="h-5 w-5" />
                Wali Santri
              </h3>
              {!isEditingWali && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingWali(true)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  {currentSantri.santriProfile.wali ? "Ubah" : "Tambah"} Wali
                </Button>
              )}
            </div>

            {isEditingWali ? (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <Label>Pilih Wali Santri</Label>
                <Select
                  value={selectedWaliId}
                  onValueChange={setSelectedWaliId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih wali" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">🚫 Tidak Ada Wali</SelectItem>
                    {availableWalis.map((wali) => (
                      <SelectItem key={wali.id} value={wali.id}>
                        {wali.user.name}
                        {wali.occupation && ` - ${wali.occupation}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveWali} disabled={loading}>
                    <Save className="h-3 w-3 mr-1" />
                    Simpan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingWali(false);
                      setSelectedWaliId(
                        currentSantri.santriProfile.wali?.id || "__NONE__"
                      );
                    }}
                    disabled={loading}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Batal
                  </Button>
                </div>
              </div>
            ) : currentSantri.santriProfile.wali ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-lg">
                      {currentSantri.santriProfile.wali.user.name}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      Wali Santri
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Belum ada wali yang ditugaskan untuk santri ini.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Teachers Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Guru Pembimbing
              </h3>
              {!isEditingTeachers && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingTeachers(true)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  {currentSantri?.santriProfile?.teacherAssignments?.length
                    ? "Ubah"
                    : "Tambah"}{" "}
                  Guru
                </Button>
              )}
            </div>

            {isEditingTeachers ? (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <Label>Pilih Guru Pembimbing</Label>
                <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2 bg-white">
                  {availableTeachers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Belum ada guru tersedia
                    </p>
                  ) : (
                    availableTeachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <Checkbox
                          checked={selectedTeacherIds.includes(teacher.id)}
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
                <p className="text-xs text-gray-600">
                  {selectedTeacherIds.length} guru dipilih
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveTeachers}
                    disabled={loading}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Simpan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingTeachers(false);
                      setSelectedTeacherIds(
                        currentSantri?.santriProfile?.teacherAssignments?.map(
                          (ta) => ta.teacherId
                        ) || []
                      );
                    }}
                    disabled={loading}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Batal
                  </Button>
                </div>
              </div>
            ) : currentSantri?.santriProfile?.teacherAssignments &&
              currentSantri.santriProfile.teacherAssignments.length > 0 ? (
              <div className="space-y-2">
                {currentSantri.santriProfile.teacherAssignments.map(
                  (assignment) => (
                    <div
                      key={assignment.id}
                      className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {assignment.teacher.user.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          NIP: {assignment.teacher.nip}
                        </p>
                      </div>
                      <Badge variant="secondary">Guru Pembimbing</Badge>
                    </div>
                  )
                )}
              </div>
            ) : (
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Belum ada guru pembimbing yang ditugaskan untuk santri ini.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
