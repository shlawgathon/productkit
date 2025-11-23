"use client";

import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
  initialFiles?: File[];
}

export function UploadZone({ onFilesSelected, className, initialFiles = [] }: UploadZoneProps) {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles];
    setFiles(newFiles);
    onFilesSelected(newFiles);

    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  }, [files, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true
  });

  const removePreview = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    setFiles(newFiles);
    setPreviews(newPreviews);
    onFilesSelected(newFiles);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ease-in-out hover:bg-muted/50",
          isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/25",
          previews.length > 0 ? "min-h-[150px]" : "min-h-[300px]"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center p-6">
          <div className={cn(
            "mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted transition-transform duration-300",
            isDragActive && "scale-110 bg-primary/10"
          )}>
            <Upload className={cn(
              "h-8 w-8 text-muted-foreground transition-colors",
              isDragActive && "text-primary"
            )} />
          </div>
          <h3 className="text-lg font-semibold">
            {isDragActive ? "Drop file here" : "Upload Header Image"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Drag and drop your images here, or click to select files.
            Supports JPG, PNG, WEBP.
          </p>
        </div>
      </div>

      {/* Previews Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 animate-in fade-in slide-in-from-bottom-4">
          {previews.map((preview, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <button
                onClick={(e) => removePreview(index, e)}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div
            {...getRootProps()}
            className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:bg-muted/50 transition-colors"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs font-medium">Add More</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
