"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Camera, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Profile Section */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update your photo and personal details.
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
              <div className="relative h-24 w-24 rounded-full bg-muted overflow-hidden border-2 border-muted">
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                {/* Placeholder Avatar */}
                <div className="h-full w-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                  JD
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Profile Photo</h3>
                <p className="text-sm text-muted-foreground">
                  Click to upload a new avatar. JPG, GIF or PNG.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" placeholder="John" defaultValue="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" placeholder="Doe" defaultValue="Doe" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" className="pl-9" placeholder="john@example.com" defaultValue="john.doe@example.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                placeholder="Tell us a little about yourself..." 
                className="min-h-[100px] resize-none"
                defaultValue="Product Designer & AI Enthusiast."
              />
            </div>
          </div>
          
          <div className="p-6 border-t bg-muted/20 flex justify-end">
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
