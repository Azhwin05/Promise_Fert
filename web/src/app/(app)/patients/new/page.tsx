"use client";
import { useRouter } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { PatientForm } from "@/components/patient-form";

export default function NewPatient() {
  const router = useRouter();
  return (
    <>
      <PageHeader title="Register Patient Visit" subtitle="Register a new patient, then open their EMR to record the visit" />
      <Card><PatientForm onSaved={(p) => router.push(`/patients/${p.id}`)} onCancel={() => router.back()} /></Card>
    </>
  );
}
