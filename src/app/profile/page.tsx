"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { getProfile, updateProfile } from "@/services/profileService";
import { getSales } from "@/services/salesService";
import { getCustomers } from "@/services/customerService";
import { getProducts } from "@/services/productService";
import {
  Building2,
  CalendarDays,
  Check,
  Edit3,
  History,
  Mail,
  Phone,
  Save,
  ShieldAlert,
  User,
  X,
} from "lucide-react";

const activitySeed = [
  { text: "Added a new sale", timestamp: "Today, 9:10 AM" },
  { text: "Updated stock for Coca-Cola 50cl", timestamp: "Yesterday, 4:22 PM" },
  { text: "Added new customer", timestamp: "2 days ago" },
  { text: "Reviewed inventory totals", timestamp: "3 days ago" },
  { text: "Updated business details", timestamp: "Last week" },
];

function getInitials(fullName: string) {
  return (
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GE"
  );
}

function formatDate(value: string | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    id: string;
    fullName: string;
    role: string;
    businessName: string;
    phone: string;
    email: string;
    dateJoined: string;
  } | null>(null);
  const [draft, setDraft] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const [profileData, salesData, customerData, productData] =
          await Promise.all([
            getProfile(),
            getSales(),
            getCustomers(),
            getProducts(),
          ]);

        if (!isMounted) return;

        setProfile(profileData);
        setDraft(profileData);
        setSales(salesData);
        setCustomers(customerData);
        setProducts(productData);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Total Sales Recorded",
        value: sales.length,
        helper: "Across all logged sales",
      },
      {
        label: "Customers Managed",
        value: customers.length,
        helper: "Active customer list",
      },
      {
        label: "Products Listed",
        value: products.length,
        helper: "Current stock items",
      },
      {
        label: "Member Since",
        value: formatDate(profile?.dateJoined),
        helper: "Joined on this date",
      },
    ],
    [customers.length, products.length, profile?.dateJoined, sales.length],
  );

  const initials = getInitials(profile?.fullName ?? "Grace Eze");

  function handleChange(field: string, value: string) {
    setDraft((current) => ({
      ...(current ?? profile ?? {}),
      [field]: value,
    }));
  }

  async function handleSave() {
    if (!draft) return;

    const updated = await updateProfile(draft);
    setProfile(updated);
    setDraft(updated);
    setIsEditing(false);
  }

  function handleCancel() {
    setDraft(profile);
    setIsEditing(false);
  }

  return (
    <OnboardingGuard>
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <PageHeader
          title="Profile"
          description="Your personal details and a quick snapshot of your activity."
        />

        {loading ? (
          <div className="space-y-6">
            <Card className="border-2 border-green-100">
              <CardContent className="p-6">
                <LoadingSkeleton lines={5} />
              </CardContent>
            </Card>
            <Card className="border-2 border-green-100">
              <CardContent className="p-6">
                <LoadingSkeleton lines={6} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <Card className="mb-6 border-2 border-green-100 bg-gradient-to-r from-green-50 via-white to-white">
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-extrabold text-primary-foreground shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-gray-900">
                        {profile?.fullName}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="default">{profile?.role}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {profile?.fullName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (isEditing) {
                        handleSave();
                        return;
                      }

                      setIsEditing(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    {isEditing ? (
                      <Save className="h-4 w-4" />
                    ) : (
                      <Edit3 className="h-4 w-4" />
                    )}
                    {isEditing ? "Save Profile" : "Edit Profile"}
                  </Button>
                </div>

                {isEditing && (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">
                        Full Name
                      </label>
                      <Input
                        value={draft?.fullName ?? ""}
                        onChange={(event) =>
                          handleChange("fullName", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">
                        Role/Title
                      </label>
                      <Input
                        value={draft?.role ?? ""}
                        onChange={(event) =>
                          handleChange("role", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">
                        Phone Number
                      </label>
                      <Input
                        value={draft?.phone ?? ""}
                        onChange={(event) =>
                          handleChange("phone", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">
                        Email Address
                      </label>
                      <Input
                        value={draft?.email ?? ""}
                        onChange={(event) =>
                          handleChange("email", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-muted-foreground">
                        Date Joined
                      </label>
                      <Input
                        value={formatDate(profile?.dateJoined)}
                        readOnly
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mb-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <Card className="border-2 border-green-100 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <CardTitle>Personal Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoRow
                      icon={<User className="h-4 w-4 text-primary" />}
                      label="Full Name"
                      value={profile?.fullName}
                    />
                    <InfoRow
                      icon={<Building2 className="h-4 w-4 text-primary" />}
                      label="Role/Title"
                      value={profile?.role}
                    />
                    <InfoRow
                      icon={<Phone className="h-4 w-4 text-primary" />}
                      label="Phone Number"
                      value={profile?.phone}
                    />
                    <InfoRow
                      icon={<Mail className="h-4 w-4 text-primary" />}
                      label="Email Address"
                      value={profile?.email}
                    />
                    <InfoRow
                      icon={<CalendarDays className="h-4 w-4 text-primary" />}
                      label="Date Joined"
                      value={formatDate(profile?.dateJoined)}
                      className="md:col-span-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-100 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <CardTitle>Recent Activity</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {activitySeed.map((item) => (
                    <div
                      key={item.text}
                      className="flex gap-3 rounded-xl border border-green-100 bg-green-50/40 p-3"
                    >
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.text}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6 border-2 border-green-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <CardTitle>Business Snapshot</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 pt-0">
                {stats.map((stat) => (
                  <StatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    helper={stat.helper}
                  />
                ))}
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200 bg-red-50/20 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  <CardTitle className="text-red-700">Danger Zone</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    Deactivate Account
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This action is reserved for future account management flows.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  onClick={() => setConfirmOpen(true)}
                >
                  Deactivate Account
                </Button>
              </CardContent>
            </Card>

            <Modal
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Deactivate Account"
              description="This is a placeholder for a future destructive action and does not remove anything yet."
            >
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Coming soon — this action is intentionally disabled for now.
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={() => setConfirmOpen(false)}>Close</Button>
              </div>
            </Modal>
          </>
        )}
      </div>
    </OnboardingGuard>
  );
}

function InfoRow({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-base font-semibold text-gray-900">
        {value ?? "—"}
      </p>
    </div>
  );
}
