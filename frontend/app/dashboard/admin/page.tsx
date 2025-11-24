"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface AccessCode {
  _id: string;
  code: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  usedBy?: string;
  usedAt?: number;
}

export default function AdminPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchCodes();
  }, [user, router]);

  const fetchCodes = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/admin/codes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data);
      }
    } catch (error) {
      console.error("Failed to fetch codes", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await fetch("http://localhost:8080/api/admin/codes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        await fetchCodes();
      }
    } catch (error) {
      console.error("Failed to generate code", error);
    } finally {
      setGenerating(false);
    }
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <Button onClick={generateCode} disabled={generating}>
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Generate Access Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Access Codes
            <Button variant="ghost" size="sm" onClick={fetchCodes}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => {
                  const isExpired = Date.now() > code.expiresAt;
                  const isUsed = !!code.usedBy;
                  
                  return (
                    <TableRow key={code._id}>
                      <TableCell className="font-mono font-medium">
                        {code.code}
                      </TableCell>
                      <TableCell>
                        {new Date(code.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(code.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {isUsed ? (
                          <Badge variant="secondary">Used</Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {code.usedBy || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {codes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No access codes generated yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
