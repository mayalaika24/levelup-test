"use client";

import { Building2, Landmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardPanelSkeleton } from "@/components/dashboard/loading-skeletons";
import { SchoolSettingsBasicTab } from "@/components/dashboard/school-settings-tabs/basic-tab";
import { SchoolSettingsContactSocialTab } from "@/components/dashboard/school-settings-tabs/contact-social-tab";
import {
  type BasicSchoolSettingsInput,
  type ContactAndSocialSchoolSettingsInput,
  type PersistedSchoolSettingsInput,
} from "@/lib/validations/school-settings";

type SettingsTab = "basic" | "contactSocial";

export function SchoolSettingsForm() {
  const t = useTranslations("SchoolSettings");
  const [activeTab, setActiveTab] = useState<SettingsTab>("basic");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSavingTab, setIsSavingTab] = useState<SettingsTab | null>(null);
  const [settingsData, setSettingsData] = useState<PersistedSchoolSettingsInput>({
    schoolNameAr: "",
    schoolNameEn: "",
    foundedYear: new Date().getFullYear(),
    currency: "USD",
    allowMultiCurrency: false,
    commercialRegisterNumber: "",
    showLogoInInvoices: false,
    timezone: "Asia/Riyadh",
    defaultSystemLanguage: "ar",
    notificationsEnabled: true,
    country: "",
    city: "",
    detailedAddress: "",
    primaryPhone: "",
    primaryEmail: "",
    website: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      x: "",
      linkedIn: "",
    },
    logoFileName: "",
    sealFileName: "",
  });

  const tabs: Array<{
    key: SettingsTab;
    label: string;
    icon: typeof Landmark;
  }> = [
    { key: "basic", label: t("basicInfo.title"), icon: Landmark },
    { key: "contactSocial", label: `${t("contactInfo.title")} - ${t("socialMedia.title")}`, icon: Building2 },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadSchoolSettings() {
      try {
        const response = await fetch("/api/school-settings", { method: "GET" });
        if (!response.ok) {
          throw new Error("Failed to load school settings.");
        }

        const data = (await response.json()) as PersistedSchoolSettingsInput;

        if (!isMounted) {
          return;
        }

        setSettingsData(data);
      } catch {
        if (isMounted) {
          toast.error(t("loadFailed"));
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    }

    void loadSchoolSettings();

    return () => {
      isMounted = false;
    };
  }, [t]);

  async function saveSection(
    section: SettingsTab,
    data: BasicSchoolSettingsInput | ContactAndSocialSchoolSettingsInput,
  ) {
    setIsSavingTab(section);
    try {
      const response = await fetch("/api/school-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save school settings.");
      }

      const updated = (await response.json()) as PersistedSchoolSettingsInput;
      setSettingsData(updated);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSavingTab(null);
    }
  }

  return (
    <div className="space-y-6">

      {isLoadingData ? (
        <DashboardPanelSkeleton />
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card/80 p-2">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "basic" ? (
            <SchoolSettingsBasicTab
              data={settingsData}
              isSaving={isSavingTab === "basic"}
              onSave={(data) => saveSection("basic", data)}
            />
          ) : null}

          {activeTab === "contactSocial" ? (
            <SchoolSettingsContactSocialTab
              data={settingsData}
              isSaving={isSavingTab === "contactSocial"}
              onSave={(data) => saveSection("contactSocial", data)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
