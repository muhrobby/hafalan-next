"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface BulkUploadSantriDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedRow {
  nama_santri: string;
  tgl_lahir?: string;
  tempat_lahir?: string;
  gender: string;
  alamat?: string;
  telp_santri?: string;
  nama_wali: string;
  telp_wali?: string;
  pekerjaan_wali?: string;
  alamat_wali?: string;
  email_wali?: string;
}

interface ImportResult {
  success: boolean;
  row: number;
  santriName: string;
  waliName: string;
  error?: string;
}

export default function BulkUploadSantriDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkUploadSantriDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [stats, setStats] = useState({ success: 0, fail: 0 });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        toast({
          title: "Error",
          description: "File tidak memiliki data yang valid",
          variant: "destructive",
        });
        return;
      }

      setParsedData(rows);
      setStep("preview");
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membaca file CSV",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const data: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || "";
      });

      // Map to expected format
      data.push({
        nama_santri: row.nama_santri || row.nama || "",
        tgl_lahir: row.tgl_lahir || row.tanggal_lahir || "",
        tempat_lahir: row.tempat_lahir || "",
        gender: (row.gender || "").toUpperCase(),
        alamat: row.alamat || "",
        telp_santri: row.telp_santri || row.telepon_santri || "",
        nama_wali: row.nama_wali || "",
        telp_wali: row.telp_wali || row.telepon_wali || "",
        pekerjaan_wali: row.pekerjaan_wali || "",
        alamat_wali: row.alamat_wali || "",
        email_wali: row.email_wali || "",
      });
    }

    return data;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);

    return result.map((v) => v.replace(/^"|"$/g, "").trim());
  };

  const handleUpload = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/santri/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsedData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengupload data");
      }

      setResults(result.results);
      setStats({
        success: result.successCount,
        fail: result.failCount,
      });
      setStep("result");

      if (result.successCount > 0) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengupload data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "nama_santri",
      "tgl_lahir",
      "tempat_lahir",
      "gender",
      "alamat",
      "telp_santri",
      "nama_wali",
      "telp_wali",
      "pekerjaan_wali",
      "alamat_wali",
      "email_wali",
    ];

    const sampleData = [
      [
        "Ahmad Fauzi",
        "2010-05-15",
        "Surabaya",
        "MALE",
        "Jl. Raya 123",
        "08123456789",
        "Budi Santoso",
        "08198765432",
        "Pedagang",
        "Jl. Raya 123",
        "budi@email.com",
      ],
      [
        "Fatimah Zahra",
        "2011-03-20",
        "Jakarta",
        "FEMALE",
        "Jl. Merdeka 45",
        "",
        "Siti Aminah",
        "08287654321",
        "Guru",
        "Jl. Merdeka 45",
        "",
      ],
    ];

    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template_santri_wali.csv";
    link.click();
  };

  const resetDialog = () => {
    setStep("upload");
    setParsedData([]);
    setResults([]);
    setStats({ success: 0, fail: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Upload Santri + Wali
          </DialogTitle>
          <DialogDescription>
            Upload data santri beserta wali sekaligus menggunakan file CSV
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Format CSV</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="text-sm mb-2">Kolom yang diperlukan:</p>
                <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                  nama_santri, tgl_lahir, tempat_lahir, gender, alamat,
                  telp_santri, nama_wali, telp_wali, pekerjaan_wali, alamat_wali,
                  email_wali
                </code>
                <p className="text-xs mt-2 text-gray-600">
                  * NIS akan digenerate otomatis oleh sistem
                  <br />
                  * Gender: MALE atau FEMALE
                  <br />
                  * Format tanggal: YYYY-MM-DD (contoh: 2010-05-15)
                  <br />* telp_santri bersifat opsional
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template CSV
              </Button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                Drag & drop file CSV atau klik untuk memilih
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Pilih File
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Preview Data</h3>
                <p className="text-sm text-gray-500">
                  {parsedData.length} data akan diimport
                </p>
              </div>
              <Badge variant="outline">{parsedData.length} baris</Badge>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Santri</TableHead>
                    <TableHead>TTL</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Wali</TableHead>
                    <TableHead>Telp Wali</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.nama_santri}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.tempat_lahir}
                        {row.tgl_lahir && `, ${row.tgl_lahir}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.gender === "MALE" ? "default" : "secondary"
                          }
                        >
                          {row.gender === "MALE" ? "L" : "P"}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.nama_wali}</TableCell>
                      <TableCell className="text-sm">
                        {row.telp_wali || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={resetDialog}>
                Kembali
              </Button>
              <Button
                onClick={handleUpload}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {parsedData.length} Data
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-700">
                  {stats.success}
                </p>
                <p className="text-sm text-green-600">Berhasil</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                <p className="text-2xl font-bold text-red-700">{stats.fail}</p>
                <p className="text-sm text-red-600">Gagal</p>
              </div>
            </div>

            {stats.fail > 0 && (
              <ScrollArea className="h-[200px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Baris</TableHead>
                      <TableHead>Santri</TableHead>
                      <TableHead>Wali</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results
                      .filter((r) => !r.success)
                      .map((result, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">
                            {result.row}
                          </TableCell>
                          <TableCell>{result.santriName}</TableCell>
                          <TableCell>{result.waliName}</TableCell>
                          <TableCell className="text-red-600 text-sm">
                            {result.error}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={handleClose}>Selesai</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
