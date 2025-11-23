"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Stepper } from "@/components/onboarding/stepper";
import { UploadZone } from "@/components/onboarding/upload-zone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Sparkles, Image as ImageIcon, FileText, X } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";

const steps = [
  { id: "upload", title: "Upload Header Image" },
  { id: "details", title: "Product Details" },
  { id: "review", title: "Review" },
];

function OnboardingContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'uploading' | 'creating' | 'success'>('idle');
  // New state for inline validation errors
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      // Mock fetching data based on slug
      const name = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      setProductName(name);
      setProductDescription("A sleek, modern minimalist chair designed for comfort and style. Features premium leather upholstery and a solid oak frame. Perfect for contemporary living spaces and offices.");
      // In a real app, we would also fetch existing images here
    }
  }, [slug]);

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      files.forEach(file => {
        const url = URL.createObjectURL(file);
        URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  const handleNext = () => {
    // Validation before advancing steps
    if (currentStep === 0 && files.length === 0) {
      setFormError('Please upload at least one header image before proceeding.');
      return;
    }
    if (currentStep === 1 && productName.trim() === '') {
      setFormError('Product name is required.');
      return;
    }
    if (currentStep === 1 && productDescription.trim() === '') {
      setFormError('Product description is required.');
      return;
    }
    setFormError(null);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setFormError(null);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPdfFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removePdf = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateProduct = async () => {
    setIsSubmitting(true);
    setSubmissionStatus('uploading');
    try {
      const imageUrls: string[] = [];

      // Upload files one by one
      for (const file of files) {
        try {
          const uploadRes = await api.uploadFile(file);
          if (uploadRes.url) {
            imageUrls.push(uploadRes.url);
          }
        } catch (e) {
          console.error("Failed to upload file", file.name, e);
        }
      }

      // Upload PDF files
      const pdfUrls: string[] = [];
      for (const file of pdfFiles) {
        try {
          const uploadRes = await api.uploadFile(file);
          if (uploadRes.url) {
            pdfUrls.push(uploadRes.url);
          }
        } catch (e) {
          console.error("Failed to upload PDF", file.name, e);
        }
      }

      // Fallback if no images uploaded (or failed)
      if (imageUrls.length === 0) {
        imageUrls.push("https://placehold.co/600x400?text=No+Image+Uploaded");
      }

      setSubmissionStatus('creating');
      const response = await api.createProduct({
        name: productName,
        description: productDescription,
        images: imageUrls,
        pdfGuides: pdfUrls // Include PDF guides
      });

      setSubmissionStatus('success');
      
      // Short delay to show success state before redirecting
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error("Failed to create product", error);
      setSubmissionStatus('idle');
      setFormError("Failed to create product. Please try again.");
    } finally {
      if (submissionStatus !== 'success') {
         setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Exit
          </Link>
          <div className="w-full max-w-sm">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      <main className="container mx-auto max-w-5xl px-4 pt-28 pb-12">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column: Form */}
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {currentStep === 0 && "Let's start with some photos"}
                {currentStep === 1 && "Tell us about your product"}
                {currentStep === 2 && "Ready to generate?"}
              </h1>
              <p className="text-muted-foreground">
                {currentStep === 0 && "Upload a high-quality header image for your product. You can add more gallery images later."}
                {currentStep === 1 && "Provide details to help our AI understand your product context."}
                {currentStep === 2 && "Review your information before we start the magic."}
              </p>
              {formError && (
                <p className="mt-2 text-sm text-destructive font-medium">{formError}</p>
              )}
            </div>

            <div className="min-h-[400px]">
              {currentStep === 0 && (
                <UploadZone onFilesSelected={setFiles} />
              )}

              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Minimalist Leather Chair"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the materials, style, and key features..."
                      className="min-h-[150px] resize-none text-base"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Product Guides (PDF)</Label>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <Input
                          id="pdf-upload"
                          type="file"
                          accept=".pdf"
                          multiple
                          onChange={handlePdfUpload}
                          className="hidden"
                        />
                      </div>
                      {/* Recommendation note */}
                      <p className="text-xs text-muted-foreground">PDF guide is optional but recommended – it helps the AI produce richer marketing copy.</p>
                      <Label
                        htmlFor="pdf-upload"
                        className="flex items-center justify-center w-full h-32 px-4 transition bg-transparent border-2 border-dashed rounded-xl border-muted-foreground/25 hover:bg-muted/50 hover:border-primary/50 cursor-pointer"
                      >
                        <div className="flex flex-col items-center space-y-2 text-center">
                          <div className="p-3 rounded-full bg-primary/5 text-primary">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              Click to upload PDF guides
                            </p>
                            <p className="text-xs text-muted-foreground">
                              or drag and drop files here
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    {pdfFiles.length > 0 && (
                      <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                        {pdfFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 transition-all border rounded-lg bg-card hover:shadow-sm group">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="flex items-center justify-center shrink-0 w-10 h-10 rounded-lg bg-red-500/10 text-red-500">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removePdf(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="rounded-lg border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      {files.length > 0 ? (
                        <div className="h-20 w-20 rounded-md bg-muted overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={URL.createObjectURL(files[0])} alt="Preview" className="object-cover h-full w-full" />
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{productName || "Untitled Product"}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{productDescription || "No description provided"}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t flex gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">{files.length}</span> Images
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{pdfFiles.length}</span> PDF Guides
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Standard</span> Quality
                      </div>
                    </div>

                    {pdfFiles.length > 0 && (
                      <div className="pt-4 border-t space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Attached Guides</h4>
                        <div className="grid gap-2">
                          {pdfFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-red-500" />
                              <span>{file.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {formError && <p className="mt-2 text-sm text-destructive">{formError}</p>}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-8 border-t">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button
                  size="lg"
                  className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                  onClick={handleCreateProduct}
                  disabled={isSubmitting || productName.trim() === '' || productDescription.trim() === '' || files.length === 0}
                >
                  <Sparkles className="h-4 w-4" />
                  {isSubmitting ? (
                    submissionStatus === 'uploading' ? "Uploading Assets..." : 
                    submissionStatus === 'creating' ? "Sending Request..." : 
                    submissionStatus === 'success' ? "Request Received!" : "Processing..."
                  ) : "Generate Assets"}
                </Button>
              ) : (
                <Button onClick={handleNext} size="lg" className="gap-2">
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Right Column: Live Preview / Tips */}
          <div className="hidden lg:block relative">
            <div className="sticky top-32 space-y-6">
              <div className="rounded-2xl border bg-muted/30 p-8 backdrop-blur-sm">
                <h3 className="font-semibold mb-4">Preview</h3>
                <div className="aspect-3/4 rounded-xl bg-card shadow-sm border overflow-hidden relative group">
                  <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/60 z-10 flex flex-col justify-end p-6 text-white">
                    <h4 className="text-xl font-bold">{productName || "Product Name"}</h4>
                    <p className="text-sm opacity-80 line-clamp-2">{productDescription || "Product description will appear here..."}</p>
                  </div>
                  {files.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={URL.createObjectURL(files[0])}
                      alt="Preview"
                      className="object-cover h-full w-full transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground/50">
                      <ImageIcon className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  This is how your product might appear in the gallery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
