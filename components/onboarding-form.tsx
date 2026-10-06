"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ChevronDown, LoaderCircle, ShieldCheck } from "lucide-react";
import { companySizes, industries, localToday, onboardingSchema, packagesForService, services, type OnboardingData } from "@/lib/schema";
import { buildOnboardingPayload } from "@/lib/onboarding-payload";
import { submitOnboarding } from "@/lib/submit-onboarding";
import type { Confirmation } from "@/lib/types";
import { FormSection } from "./form-section";
import { FormField } from "./form-field";
import { SuccessState } from "./success-state";

export function OnboardingForm() {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [submitError, setSubmitError] = useState("");
  const submitting = useRef(false);
  const { register, handleSubmit, watch, resetField, formState: { errors, isSubmitting } } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema), mode: "onTouched", reValidateMode: "onChange",
    defaultValues: { companyName: "", companyWebsite: "", industry: "", companySize: "", firstName: "", lastName: "", email: "", phone: "", service: "", package: "", startDate: "", goals: "", notes: "" },
  });
  const goals = watch("goals");
  const notes = watch("notes");
  const service = watch("service");
  const availablePackages = packagesForService(service);
  const attributes = (name: keyof OnboardingData, hint?: boolean) => ({
    id: name, "aria-invalid": Boolean(errors[name]),
    "aria-describedby": [errors[name] ? `${name}-error` : "", hint ? `${name}-hint` : ""].filter(Boolean).join(" ") || undefined,
  });
  const textField = (name: keyof OnboardingData, label: string, placeholder: string, required = true, type = "text", autoComplete?: string) => <FormField name={name} label={label} required={required} error={errors[name]?.message}>
    <input {...register(name)} {...attributes(name)} type={type} placeholder={placeholder} aria-required={required} autoComplete={autoComplete} maxLength={name === "companyWebsite" ? 2048 : name === "email" ? 254 : name === "phone" ? 40 : name === "companyName" ? 120 : 80} />
  </FormField>;
  const selectField = (name: keyof OnboardingData, label: string, placeholder: string, options: readonly string[], required = true) => <FormField name={name} label={label} required={required} error={errors[name]?.message}>
    <div className="select-wrapper"><select {...register(name, name === "service" ? { onChange: () => resetField("package") } : {})} {...attributes(name)} aria-required={required}><option value="">{placeholder}</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div>
  </FormField>;
  async function onSubmit(data: OnboardingData) {
    if (submitting.current) return;
    submitting.current = true;
    setSubmitError("");
    try { const result = await submitOnboarding(buildOnboardingPayload(data)); setConfirmation({ ...result, data }); }
    catch { setSubmitError("We couldn’t complete your submission. Your details are still here. Please try again."); }
    finally { submitting.current = false; }
  }
  if (confirmation) return <SuccessState confirmation={confirmation} />;
  return <form id="onboarding" noValidate onSubmit={event => {
    if (submitting.current) { event.preventDefault(); return; }
    void handleSubmit(onSubmit)(event);
  }} aria-busy={isSubmitting}>
    <fieldset disabled={isSubmitting} className="form-fields">
      <legend className="sr-only">Client onboarding details</legend>
      <FormSection number="01" title="Company information" description="Tell us about the business we’ll be working with.">
        {textField("companyName", "Company name", "Acme Fitness", true, "text", "organization")}
        {textField("companyWebsite", "Company website", "https://acmefitness.com", true, "url", "url")}
        {selectField("industry", "Industry", "Select your industry", industries)}
        {selectField("companySize", "Company size", "Select team size", companySizes, false)}
      </FormSection>
      <FormSection number="02" title="Primary contact" description="Who should our team communicate with during onboarding?">
        {textField("firstName", "First name", "John", true, "text", "given-name")}
        {textField("lastName", "Last name", "Smith", true, "text", "family-name")}
        {textField("email", "Work email", "john@acmefitness.com", true, "email", "email")}
        {textField("phone", "Phone number", "+1 555 123 4567", false, "tel", "tel")}
      </FormSection>
      <FormSection number="03" title="Service & project" description="Help us prepare the correct project structure and resources.">
        {selectField("service", "Primary service", "Select a service", services)}
        <FormField name="package" label="Package" required error={errors.package?.message}>
          <div className="select-wrapper"><select {...register("package")} {...attributes("package")} aria-required="true" disabled={!service}><option value="">{service ? "Select your package" : "Select a service first"}</option>{availablePackages.map(option => <option key={option} value={option}>{option}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div>
        </FormField>
        <span role="status" className="sr-only">{service ? `Packages available for ${service}. Select a package.` : "Select a primary service to enable package selection."}</span>
        <FormField name="startDate" label="Preferred start date" required error={errors.startDate?.message}><input {...register("startDate")} {...attributes("startDate")} type="date" min={localToday()} aria-required="true" /></FormField>
      </FormSection>
      <FormSection number="04" title="Project goals" description="Give our team context before we begin.">
        <FormField name="goals" label="What are your primary goals for this engagement?" required error={errors.goals?.message} fullWidth><textarea {...register("goals")} {...attributes("goals")} placeholder="Increase qualified leads, improve paid campaign performance, and build a more consistent acquisition funnel." rows={4} maxLength={2000} aria-required="true" /><div className="character-count" aria-hidden="true">{goals.length.toLocaleString()} / 2,000</div></FormField>
        <FormField name="notes" label="Additional notes" error={errors.notes?.message} fullWidth><textarea {...register("notes")} {...attributes("notes")} placeholder="Anything else our team should know before onboarding begins?" rows={3} maxLength={2000} /><div className="character-count" aria-hidden="true">{notes.length.toLocaleString()} / 2,000</div></FormField>
      </FormSection>
    </fieldset>
    <div className="submission-area"><div className="privacy-note"><ShieldCheck size={21} strokeWidth={1.6} aria-hidden="true" /><div><h3>Your information stays private.</h3><p>Your onboarding details are used only to prepare<br className="hidden lg:block" /> and manage your NovaGrowth project.</p></div></div><button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? <><LoaderCircle className="spinner" size={17} aria-hidden="true" /> Submitting…</> : <>Submit onboarding <ArrowRight size={17} aria-hidden="true" /></>}</button></div>
    <div role="status" className="sr-only">{isSubmitting ? "Submitting your onboarding details." : ""}</div>
    {submitError && <p role="alert" className="submission-error">{submitError}</p>}
  </form>;
}
