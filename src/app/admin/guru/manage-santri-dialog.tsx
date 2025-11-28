"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  UserPlus,
  UserMinus,
  Loader2,
  GraduationCap,
  AlertCircle,
} from "lucide-react";

interface SantriBinaan {
  assignmentId: string;
  santriProfileId: string;
  santriUserId: string;
  name: string;
  email: string;
  nis: string;
  gender: string;
  waliName: string | null;
  isActive: boolean;
}

interface AvailableSantri {
  id: string;
  name: string;
  email: string;
  santriProfile: {
    id: string;
    nis: string;
    gender: string;
  };
}

interface ManageSantriDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guru: {
    id: string;
    name: string;
    nip: string;
    teacherProfileId: string;
  } | null;
  onSuccess: () => void;
}

export default function ManageSantriDialog({
  open,
  onOpenChange,
  guru,
  onSuccess,
}: ManageSantriDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [searchTerm, setSearchTerm] = useState("");

  const [santriBindaan, setSantriBindaan] = useState<SantriBinaan[]>([]);
  const [availableSantri, setAvailableSantri] = useState<AvailableSantri[]>([]);
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);

  const fetchSantriBindaan = useCallback(async () => {
    if (!guru?.teacherProfileId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/guru/${guru.teacherProfileId}/santri`
      );
      if (response.ok) {
        const data = await response.json();
        setSantriBindaan(data.santriList || []);
      }
    } catch (error) {
      console.error("Error fetching santri binaan:", error);
    } finally {
      setLoading(false);
    }
  }, [guru?.teacherProfileId]);

  const fetchAvailableSantri = useCallback(async () => {
    try {
      const response = await fetch("/api/users?role=SANTRI&limit=500");
      if (response.ok) {
        const data = await response.json();
        setAvailableSantri(
          data.data?.filter((s: any) => s.santriProfile) || []
        );
      }
    } catch (error) {
      console.error("Error fetching available santri:", error);
    }
  }, []);

  useEffect(() => {
    if (open && guru) {
      fetchSantriBindaan();
      fetchAvailableSantri();
      setSelectedSantriIds([]);
      setSearchTerm("");
    }
  }, [open, guru, fetchSantriBindaan, fetchAvailableSantri]);

  const handleAssignSantri = async () => {
    if (!guru?.teacherProfileId || selectedSantriIds.length === 0) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/guru/${guru.teacherProfileId}/santri`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ santriIds: selectedSantriIds }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menambahkan santri");
      }

      toast({
        title: "Berhasil",
        description: `${selectedSantriIds.length} santri berhasil ditambahkan`,
      });

      setSelectedSantriIds([]);
      await fetchSantriBindaan();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignSantri = async (santriProfileId: string, santriName: string) => {
    if (!guru?.teacherProfileId) return;

    if (!confirm(`Hapus ${santriName} dari binaan ${guru.name}?`)) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/guru/${guru.teacherProfileId}/santri?santriId=${santriProfileId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus santri");
      }

      toast({
        title: "Berhasil",
        description: `${santriName} berhasil dihapus dari binaan`,
      });

      await fetchSantriBindaan();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSantriToggle = (santriProfileId: string) => {
    setSelectedSantriIds((prev) =>
      prev.includes(santriProfileId)
        ? prev.filter((id) => id !== santriProfileId)
        : [...prev, santriProfileId]
    );
  };

  // Filter available santri yang belum di-assign ke guru ini
  const assignedIds = new Set(santriBindaan.map((s) => s.santriProfileId));
  const filteredAvailableSantri = availableSantri.filter((s) => {
    const notAssigned = !assignedIds.has(s.santriProfile.id);
    const matchesSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.santriProfile.nis.toLowerCase().includes(searchTerm.toLowerCase());
    return notAssigned && matchesSearch;
  });

  if (!guru) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Kelola Santri Binaan
          </DialogTitle>
          <DialogDescription>
            Guru: <strong>{guru.name}</strong> (NIP: {guru.nip})
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="current">
              Santri Saat Ini ({santriBindaan.length})
            </TabsTrigger>
            <TabsTrigger value="add">Tambah Santri</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="flex-1 overflow-y-auto space-y-4 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : santriBindaan.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Belum ada santri yang dibina oleh guru ini.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-[300px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIS</TableHead>
                      <TableHead>Nama Santri</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Wali</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {santriBindaan.map((santri) => (
                      <TableRow key={santri.assignmentId}>
                        <TableCell className="font-mono text-sm">
                          {santri.nis}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{santri.name}</p>
                            <p className="text-xs text-gray-500">
                              {santri.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              santri.gender === "MALE" ? "default" : "secondary"
                            }
                          >
                            {santri.gender === "MALE" ? "L" : "P"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {santri.waliName || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() =>
                              handleUnassignSantri(
                                santri.santriProfileId,
                                santri.name
                              )
                            }
                            disabled={loading}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="add" className="flex-1 overflow-y-auto space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama atau NIS santri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedSantriIds.length > 0 && (
              <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg">
                <span className="text-sm text-emerald-800">
                  {selectedSantriIds.length} santri dipilih
                </span>
                <Button
                  size="sm"
                  onClick={handleAssignSantri}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Tambahkan
                    </>
                  )}
                </Button>
              </div>
            )}

            <ScrollArea className="h-[250px] border rounded-lg">
              {filteredAvailableSantri.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mb-2" />
                  <p className="text-sm">Tidak ada santri yang tersedia</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredAvailableSantri.map((santri) => (
                    <div
                      key={santri.santriProfile.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer ${
                        selectedSantriIds.includes(santri.santriProfile.id)
                          ? "bg-emerald-50"
                          : ""
                      }`}
                      onClick={() =>
                        handleSantriToggle(santri.santriProfile.id)
                      }
                    >
                      <Checkbox
                        checked={selectedSantriIds.includes(
                          santri.santriProfile.id
                        )}
                        onCheckedChange={() =>
                          handleSantriToggle(santri.santriProfile.id)
                        }
                      />
                      <div className="flex-1">
                        <p className="font-medium">{santri.name}</p>
                        <p className="text-xs text-gray-500">
                          NIS: {santri.santriProfile.nis}
                        </p>
                      </div>
                      <Badge
                        variant={
                          santri.santriProfile.gender === "MALE"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {santri.santriProfile.gender === "MALE" ? "L" : "P"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
