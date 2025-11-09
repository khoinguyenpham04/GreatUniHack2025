"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Phone, Mail, User, AlertCircle } from "lucide-react";

export default function ContactsPage() {
  const emergencyContact = {
    name: "Sarah Thompson",
    relationship: "Daughter",
    phone: "+1 (555) 123-4567",
    email: "sarah.thompson@email.com",
  };

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <SidebarProvider
      defaultOpen={false}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 overflow-y-auto bg-linear-to-br from-slate-50 to-slate-100">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800">
                Emergency Contacts
              </h1>
              <p className="text-slate-500 mt-2">
                Quick access to important phone numbers
              </p>
            </div>

            {/* Emergency 911 Card */}
            <div className="bg-white rounded-lg shadow-sm border border-red-100 overflow-hidden">
              <div className="bg-red-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-red-800">
                      Emergency Services
                    </h2>
                    <p className="text-red-700 text-sm">
                      Call for immediate medical emergency
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <button
                  onClick={() => handleCall("911")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-md transition-colors flex items-center justify-center gap-3 text-lg shadow-sm hover:shadow-md"
                >
                  <Phone className="w-5 h-5" />
                  Call 911
                </button>
              </div>
            </div>

            {/* Primary Emergency Contact Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-semibold text-slate-800">
                    Primary Emergency Contact
                  </h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-full">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Name</p>
                      <p className="text-lg font-medium text-slate-800">
                        {emergencyContact.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {emergencyContact.relationship}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-full">
                      <Phone className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Phone Number</p>
                      <p className="text-lg font-medium text-slate-800">
                        {emergencyContact.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-full">
                      <Mail className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Email Address</p>
                      <p className="text-lg font-medium text-slate-800">
                        {emergencyContact.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <button
                    onClick={() => handleCall(emergencyContact.phone)}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <Phone className="w-4 h-4" />
                    Call {emergencyContact.name.split(" ")[0]}
                  </button>
                  <button
                    onClick={() => handleEmail(emergencyContact.email)}
                    className="bg-slate-500 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </button>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-slate-800 mb-2">When to Call</h3>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>
                      • <strong>911:</strong> Life-threatening emergencies, severe
                      injuries, or immediate danger
                    </li>
                    <li>
                      • <strong>{emergencyContact.name.split(" ")[0]}:</strong>{" "}
                      Non-emergency support, questions, or assistance
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
