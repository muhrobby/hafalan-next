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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar as CalendarIcon,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

interface CreateUserWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateUserWizard({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [walis, setWalis] = useState<Wali[]>([]);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: "",
    email: "",
    password: "",
    role: "",
    requiresEmail: true,

    // Step 2: Profile Info (conditional based on role)
    phone: "",
    address: "",
    occupation: "", // for WALI
    nip: "", // for TEACHER
    nis: "", // for SANTRI
    birthDate: undefined as Date | undefined,
    birthPlace: "",
    gender: "",

    // Step 3: Relationships (for SANTRI only)
    waliId: "",
    teacherIds: [] as string[],
  });

  // Fetch teachers and walis when dialog opens
  useEffect(() => {
    if (open) {
      fetchReferenceData();
      // Reset form
      setStep(1);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        requiresEmail: true,
        phone: "",
        address: "",
        occupation: "",
        nip: "",
        nis: "",
        birthDate: undefined,
        birthPlace: "",
        gender: "",
        waliId: "",
        teacherIds: [],
      });
    }
  }, [open]);

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

  const getTotalSteps = () => {
    if (!formData.role) return 3;
    if (formData.role === "SANTRI") return 3;
    if (formData.role === "TEACHER" || formData.role === "WALI") return 2;
    return 1; // ADMIN
  };

  const canProceedStep1 = () => {
    if (!formData.name || !formData.password || !formData.role) return false;
    if (formData.role !== "SANTRI" && !formData.email) return false;
    if (formData.role === "SANTRI" && formData.requiresEmail && !formData.email)
      return false;
    return true;
  };

  const canProceedStep2 = () => {
    if (formData.role === "SANTRI") {
      return formData.birthPlace && formData.gender;
    }
    if (formData.role === "WALI") {
      return formData.occupation;
    }
    return true; // TEACHER doesn't have required fields in step 2
  };

  const handleNext = () => {
    if (step === getTotalSteps()) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email || undefined,
        password: formData.password,
        role: formData.role,
        requiresEmail: formData.requiresEmail,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };

      if (formData.role === "TEACHER") {
        payload.nip = formData.nip || undefined;
      }

      if (formData.role === "WALI") {
        payload.occupation = formData.occupation || undefined;
      }

      if (formData.role === "SANTRI") {
        payload.nis = formData.nis || undefined;
        payload.birthDate = formData.birthDate?.toISOString() || undefined;
        payload.birthPlace = formData.birthPlace || undefined;
        payload.gender = formData.gender || undefined;
        // Only send waliId if it's a valid ID (not empty or __NONE__)
        payload.waliId =
          formData.waliId && formData.waliId !== "__NONE__"
            ? formData.waliId
            : undefined;
        payload.teacherIds =
          formData.teacherIds.length > 0 ? formData.teacherIds : undefined;
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal membuat pengguna");
      }

      toast({
        title: "Berhasil!",
        description: `${formData.name} berhasil ditambahkan sebagai ${formData.role}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat pengguna",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherToggle = (teacherId: string) => {
    setFormData((prev) => ({
      ...prev,
      teacherIds: prev.teacherIds.includes(teacherId)
        ? prev.teacherIds.filter((id) => id !== teacherId)
        : [...prev.teacherIds, teacherId],
    }));
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="role">Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, role: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih role..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="TEACHER">Guru</SelectItem>
            <SelectItem value="WALI">Wali Santri</SelectItem>
            <SelectItem value="SANTRI">Santri</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      {formData.role === "SANTRI" && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
          <Switch
            checked={formData.requiresEmail}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({
                ...prev,
                requiresEmail: checked,
                email: checked ? prev.email : "",
              }))
            }
          />
          <Label className="cursor-pointer">Santri memiliki email</Label>
        </div>
      )}

      {(formData.role !== "SANTRI" || formData.requiresEmail) && (
        <div>
          <Label htmlFor="email">
            Email {formData.role !== "SANTRI" && "*"}
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="email@example.com"
          />
          {formData.role === "SANTRI" && !formData.requiresEmail && (
            <p className="text-xs text-gray-500 mt-1">
              Email akan digenerate otomatis jika tidak diisi
            </p>
          )}
        </div>
      )}

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
        />
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (formData.role === "ADMIN") return null;

    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Informasi profil untuk {formData.role}
          </AlertDescription>
        </Alert>

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

        {formData.role === "WALI" && (
          <div>
            <Label htmlFor="occupation">Pekerjaan *</Label>
            <Input
              id="occupation"
              value={formData.occupation}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, occupation: e.target.value }))
              }
              placeholder="Pekerjaan"
            />
          </div>
        )}

        {formData.role === "SANTRI" && (
          <>
            <div>
              <Label htmlFor="birthPlace">Tempat Lahir *</Label>
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
              <Label>Tanggal Lahir</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.birthDate ? (
                      format(formData.birthDate, "PPP", { locale: localeId })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    fromYear={1990}
                    toYear={new Date().getFullYear()}
                    selected={formData.birthDate}
                    onSelect={(date) =>
                      setFormData((prev) => ({ ...prev, birthDate: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Jenis Kelamin *</Label>
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
          </>
        )}
      </div>
    );
  };

  const renderStep3 = () => {
    if (formData.role !== "SANTRI") return null;

    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pilih wali dan guru pembimbing (optional)
          </AlertDescription>
        </Alert>

        <div>
          <Label htmlFor="waliId">Wali Santri (Optional)</Label>
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
              <SelectItem value="__NONE__">⏭️ Tambah Nanti</SelectItem>
              {walis.length > 0 ? (
                walis.map((wali) => (
                  <SelectItem key={wali.id} value={wali.id}>
                    {wali.user.name}
                    {wali.phone && ` - ${wali.phone}`}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1 text-sm text-gray-500">
                  Belum ada wali tersedia
                </div>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-blue-600 mt-1">
            💡 Wali santri bisa ditambahkan nanti melalui halaman edit santri
          </p>
        </div>

        <div>
          <Label>Guru Pembimbing (Optional)</Label>
          <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
            {teachers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">
                  Belum ada guru tersedia
                </p>
                <p className="text-xs text-blue-600">
                  💡 Anda bisa menambahkan guru nanti melalui halaman detail
                  santri
                </p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 p-2 rounded mb-2">
                  <p className="text-xs text-blue-700">
                    💡 Tip: Tidak wajib pilih guru sekarang. Anda bisa
                    menambahkan nanti.
                  </p>
                </div>
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                  >
                    <Checkbox
                      checked={formData.teacherIds.includes(teacher.id)}
                      onCheckedChange={() => handleTeacherToggle(teacher.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{teacher.user.name}</p>
                      <p className="text-xs text-gray-500">
                        NIP: {teacher.nip}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formData.teacherIds.length > 0
              ? `${formData.teacherIds.length} guru dipilih`
              : "Belum ada guru dipilih (bisa ditambahkan nanti)"}
          </p>
        </div>
      </div>
    );
  };

  const currentStep = step;
  const totalSteps = getTotalSteps();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          <DialogDescription>
            Step {currentStep} dari {totalSteps}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Form Content */}
        <div className="py-4">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() =>
              step === 1 ? onOpenChange(false) : setStep(step - 1)
            }
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step === 1 ? "Batal" : "Kembali"}
          </Button>

          <Button
            onClick={handleNext}
            disabled={
              loading ||
              (step === 1 && !canProceedStep1()) ||
              (step === 2 && !canProceedStep2())
            }
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              "Loading..."
            ) : step === totalSteps ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Simpan
              </>
            ) : (
              <>
                Lanjut
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
