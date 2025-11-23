"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Save, Palette, Store } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

export default function SettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [brand, setBrand] = useState({
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    fontFamily: "Inter",
    tone: "Professional"
  });
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    email: ""
  });
  const [shopify, setShopify] = useState({
    shopifyStoreUrl: "",
    shopifyAccessToken: ""
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch settings
        const settings = await api.getSettings();
        if (settings.brandGuidelines) {
          setBrand(settings.brandGuidelines);
        }

        // Fetch user profile
        const userProfile = await api.request<any>('/api/auth/me');

        setProfile({
          firstName: userProfile.firstName || "",
          lastName: userProfile.lastName || "",
          bio: userProfile.bio || "",
          email: userProfile.email || ""
        });

        setShopify({
          shopifyStoreUrl: userProfile.shopifyStoreUrl || "",
          shopifyAccessToken: userProfile.shopifyAccessToken || ""
        });

      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };
    fetchSettings();
  }, []);

  const saveBrand = async () => {
    setIsLoading(true);
    try {
      await api.updateBrand(brand);
      // Optional: Show success toast
    } catch (error) {
      console.error("Failed to save brand settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    setIsLoading(true);
    try {
      await api.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        shopifyStoreUrl: shopify.shopifyStoreUrl,
        shopifyAccessToken: shopify.shopifyAccessToken
      });
      // Optional: Show success toast
    } catch (error) {
      console.error("Failed to save profile settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and brand preferences.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Account Section */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" value={profile.email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us a little about yourself..."
                className="min-h-[100px] resize-none"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </div>
          </div>
          <div className="p-6 border-t bg-muted/20 flex justify-end">
            <Button className="gap-2" onClick={saveProfile} disabled={isLoading}>
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Shopify Integration Section */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Store className="h-5 w-5" />
              Shopify Integration
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your Shopify store to enable AI customer insights and review analytics.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="shopifyStoreUrl">Shopify Store URL</Label>
              <Input
                id="shopifyStoreUrl"
                placeholder="mystore.myshopify.com"
                value={shopify.shopifyStoreUrl}
                onChange={(e) => setShopify({ ...shopify, shopifyStoreUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your Shopify store domain (e.g., mystore.myshopify.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopifyAccessToken">Shopify Access Token</Label>
              <Input
                id="shopifyAccessToken"
                type="password"
                placeholder="shpat_••••••••••••••••"
                value={shopify.shopifyAccessToken}
                onChange={(e) => setShopify({ ...shopify, shopifyAccessToken: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your Shopify Admin API access token with read permissions for products and metafields
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> AI Customer Insights will only work after you've configured your Shopify credentials.
                Without these credentials, you'll see mock review data.
              </p>
            </div>
          </div>
          <div className="p-6 border-t bg-muted/20 flex justify-end">
            <Button className="gap-2" onClick={saveProfile} disabled={isLoading}>
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Brand Guidelines Section */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Guidelines
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Define your brand's visual identity and tone.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    className="w-12 p-1 h-10"
                    value={brand.primaryColor}
                    onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
                  />
                  <Input
                    value={brand.primaryColor}
                    onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    className="w-12 p-1 h-10"
                    value={brand.secondaryColor}
                    onChange={(e) => setBrand({ ...brand, secondaryColor: e.target.value })}
                  />
                  <Input
                    value={brand.secondaryColor}
                    onChange={(e) => setBrand({ ...brand, secondaryColor: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Input
                id="fontFamily"
                placeholder="e.g. Inter, Roboto"
                value={brand.fontFamily}
                onChange={(e) => setBrand({ ...brand, fontFamily: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Brand Tone</Label>
              <Textarea
                id="tone"
                placeholder="e.g. Professional, Friendly, Witty"
                className="min-h-[100px] resize-none"
                value={brand.tone}
                onChange={(e) => setBrand({ ...brand, tone: e.target.value })}
              />
            </div>
          </div>

          <div className="p-6 border-t bg-muted/20 flex justify-end">
            <Button className="gap-2" onClick={saveBrand} disabled={isLoading}>
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
