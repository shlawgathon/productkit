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
import { useAuth } from "@/components/auth-provider";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

interface AccessCode {
  _id: string;
  code: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  usedBy?: string;
  usedAt?: number;
  userFullName?: string;
  userProfileImage?: string;
  userEmail?: string;
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
      const data = await api.getAccessCodes();
      setCodes(data);
    } catch (error) {
      console.error("Failed to fetch codes", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      await api.generateAccessCode();
      await fetchCodes();
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
                        {code.usedBy ? (
                          <div className="flex items-center gap-2">
                            {code.userProfileImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={code.userProfileImage}
                                className="w-8 h-8 rounded-full object-cover"
                                alt={code.userFullName || "User"}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                {(code.userFullName?.[0] || code.userEmail?.[0] || "?").toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {code.userFullName || "Unknown User"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {code.userEmail}
                              </span>
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
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
