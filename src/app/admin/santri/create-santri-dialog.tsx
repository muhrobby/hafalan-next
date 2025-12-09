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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { showAlert } from "@/lib/alert";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar as CalendarIcon,
  AlertCircle,
  User,
  Home,
  ChevronsUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  INDONESIA_PROVINCES,
  OCCUPATIONS,
  DEFAULT_PASSWORDS,
} from "@/lib/constants";

interface Wali {
  id: string;
  user: { name: string };
  phone?: string;
  occupation?: string;
}

interface CreateSantriDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateSantriDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSantriDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingWalis, setExistingWalis] = useState<Wali[]>([]);
  const [birthPlaceOpen, setBirthPlaceOpen] = useState(false);
  const [occupationOpen, setOccupationOpen] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Data Santri
    name: "",
    birthDate: undefined as Date | undefined,
    birthPlace: "",
    gender: "",
    address: "",
    phone: "",

    // Step 2: Data Wali - wajib pilih existing atau buat baru
    waliOption: "new" as "existing" | "new" | "none", // Default buat wali baru
    waliId: "",
    waliName: "",
    waliPhone: "",
    waliOccupation: "",
    waliAddress: "",
    waliEmail: "",
  });

  useEffect(() => {
    if (open) {
      fetchExistingWalis();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setStep(1);
    setBirthPlaceOpen(false);
    setOccupationOpen(false);
    setFormData({
      name: "",
      birthDate: undefined,
      birthPlace: "",
      gender: "",
      address: "",
      phone: "",
      waliOption: "new", // Default buat wali baru
      waliId: "",
      waliName: "",
      waliPhone: "",
      waliOccupation: "",
      waliAddress: "",
      waliEmail: "",
    });
  };

  const fetchExistingWalis = async () => {
    try {
      const response = await fetch("/api/users?role=WALI&limit=200");
      if (response.ok) {
        const data = await response.json();
        setExistingWalis(
          data.data
            ?.filter((u: any) => u.waliProfile)
            .map((u: any) => ({
              id: u.waliProfile.id,
              user: { name: u.name },
              phone: u.waliProfile.phone,
              occupation: u.waliProfile.occupation,
            })) || []
        );
      }
    } catch (error) {
      console.error("Error fetching walis:", error);
    }
  };

  const canProceedStep1 = () => {
    // Semua field santri wajib kecuali phone (telp_santri)
    return (
      formData.name.trim() &&
      formData.birthDate &&
      formData.birthPlace.trim() &&
      formData.gender &&
      formData.address.trim()
    );
  };

  const canProceedStep2 = () => {
    // Wali opsional - bisa tanpa wali untuk yatim piatu
    if (formData.waliOption === "none") {
      return true; // Tanpa wali diperbolehkan
    }
    if (formData.waliOption === "existing") {
      return !!formData.waliId;
    }
    if (formData.waliOption === "new") {
      // Semua field wali wajib diisi jika buat baru
      return (
        formData.waliName.trim() &&
        formData.waliPhone.trim() &&
        formData.waliOccupation.trim() &&
        formData.waliAddress.trim() &&
        formData.waliEmail.trim()
      );
    }
    return false;
  };

  const handleNext = () => {
    if (step === 2) {
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
        birthDate: formData.birthDate?.toISOString(),
        birthPlace: formData.birthPlace,
        gender: formData.gender,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
      };

      if (formData.waliOption === "existing" && formData.waliId) {
        payload.waliId = formData.waliId;
      } else if (formData.waliOption === "new" && formData.waliName) {
        payload.createNewWali = true;
        payload.waliData = {
          name: formData.waliName,
          phone: formData.waliPhone || undefined,
          occupation: formData.waliOccupation || undefined,
          address: formData.waliAddress || undefined,
          email: formData.waliEmail || undefined,
        };
      }
      // Jika waliOption === "none", tidak kirim wali data apapun

      const response = await fetch("/api/admin/santri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal membuat santri");
      }

      showAlert.success(
        "Berhasil!",
        `${formData.name} berhasil ditambahkan sebagai santri`
      );

      // Reset form and close dialog
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      showAlert.error("Error", error.message || "Gagal membuat santri");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      <Alert className="bg-blue-50 border-blue-200">
        <User className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Data Santri - NIS akan digenerate otomatis
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nama Lengkap *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Masukkan nama lengkap santri"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Tempat Lahir *</Label>
          <Popover open={birthPlaceOpen} onOpenChange={setBirthPlaceOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={birthPlaceOpen}
                className={cn(
                  "w-full justify-between mt-1.5",
                  !formData.birthPlace && "text-muted-foreground"
                )}
              >
                {formData.birthPlace || "Pilih provinsi..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Cari provinsi..." />
                <CommandList>
                  <CommandEmpty>Provinsi tidak ditemukan.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-y-auto">
                    {INDONESIA_PROVINCES.map((province) => (
                      <CommandItem
                        key={province}
                        value={province}
                        onSelect={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            birthPlace: value,
                          }));
                          setBirthPlaceOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.birthPlace === province
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {province}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Tanggal Lahir</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1.5",
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
            <PopoverContent className="w-auto p-0" align="start">
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
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Laki-laki</SelectItem>
              <SelectItem value="FEMALE">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>No. Telepon (Opsional)</Label>
          <Input
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="08xxxxxxxxxx"
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Alamat *</Label>
          <Input
            value={formData.address}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, address: e.target.value }))
            }
            placeholder="Alamat lengkap"
            className="mt-1.5"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <Alert className="bg-purple-50 border-purple-200">
        <Home className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          Data Wali Santri - <strong>Opsional</strong> untuk yatim piatu.
          Password default wali: <strong>{DEFAULT_PASSWORDS.WALI}</strong>
        </AlertDescription>
      </Alert>

      {/* Option Buttons - 3 options: Existing, New, or None */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button
          type="button"
          variant={formData.waliOption === "existing" ? "default" : "outline"}
          className="h-auto py-3"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              waliOption: "existing",
            }))
          }
        >
          <div className="text-center">
            <p className="font-medium">Pilih Existing</p>
            <p className="text-xs opacity-80">Wali sudah ada</p>
          </div>
        </Button>

        <Button
          type="button"
          variant={formData.waliOption === "new" ? "default" : "outline"}
          className="h-auto py-3"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              waliOption: "new",
              waliId: "",
            }))
          }
        >
          <div className="text-center">
            <p className="font-medium">Buat Baru</p>
            <p className="text-xs opacity-80">Wali baru</p>
          </div>
        </Button>

        <Button
          type="button"
          variant={formData.waliOption === "none" ? "default" : "outline"}
          className="h-auto py-3"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              waliOption: "none",
              waliId: "",
              waliName: "",
              waliPhone: "",
              waliOccupation: "",
              waliAddress: "",
              waliEmail: "",
            }))
          }
        >
          <div className="text-center">
            <p className="font-medium">Tanpa Wali</p>
            <p className="text-xs opacity-80">Yatim piatu</p>
          </div>
        </Button>
      </div>

      {/* Existing Wali Selection */}
      {formData.waliOption === "existing" && (
        <div className="space-y-3">
          <Label>Pilih Wali *</Label>
          <Select
            value={formData.waliId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, waliId: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih wali yang sudah ada" />
            </SelectTrigger>
            <SelectContent>
              {existingWalis.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-gray-500">
                  Belum ada wali tersedia. Silakan buat wali baru.
                </div>
              ) : (
                existingWalis.map((wali) => (
                  <SelectItem key={wali.id} value={wali.id}>
                    <div>
                      <span className="font-medium">{wali.user.name}</span>
                      {wali.phone && (
                        <span className="text-gray-500 ml-2">
                          • {wali.phone}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* New Wali Form */}
      {formData.waliOption === "new" && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium text-sm text-gray-700">Data Wali Baru</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nama Wali *</Label>
              <Input
                value={formData.waliName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, waliName: e.target.value }))
                }
                placeholder="Nama lengkap wali"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>No. Telepon *</Label>
              <Input
                value={formData.waliPhone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    waliPhone: e.target.value,
                  }))
                }
                placeholder="08xxxxxxxxxx"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.waliEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    waliEmail: e.target.value,
                  }))
                }
                placeholder="email@example.com"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Pekerjaan *</Label>
              <Popover open={occupationOpen} onOpenChange={setOccupationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={occupationOpen}
                    className={cn(
                      "w-full justify-between mt-1.5",
                      !formData.waliOccupation && "text-muted-foreground"
                    )}
                  >
                    {formData.waliOccupation || "Pilih pekerjaan..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari pekerjaan..." />
                    <CommandList>
                      <CommandEmpty>Pekerjaan tidak ditemukan.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {OCCUPATIONS.map((occupation) => (
                          <CommandItem
                            key={occupation}
                            value={occupation}
                            onSelect={(value) => {
                              setFormData((prev) => ({
                                ...prev,
                                waliOccupation: occupation, // Use original case
                              }));
                              setOccupationOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.waliOccupation === occupation
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {occupation}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Alamat *</Label>
              <Input
                value={formData.waliAddress}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    waliAddress: e.target.value,
                  }))
                }
                placeholder="Alamat wali"
                className="mt-1.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* No Wali Option */}
      {formData.waliOption === "none" && (
        <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-amber-800">Santri Tanpa Wali</h4>
              <p className="text-sm text-amber-700">
                Santri ini akan dibuat tanpa data wali. Pilihan ini cocok untuk
                santri yatim piatu atau yang tidak memiliki wali. Wali dapat
                ditambahkan kemudian melalui menu edit.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Tambah Santri Baru</DialogTitle>
          <DialogDescription>
            Step {step} dari 2 - {step === 1 ? "Data Santri" : "Data Wali"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        {/* Form Content */}
        <div className="py-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep(1))}
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
            ) : step === 2 ? (
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
