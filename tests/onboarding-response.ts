export function onboardingResponse(clientId: string, duplicate = false) {
  return {
    success: true,
    duplicate,
    clientId,
    status: "Onboarding",
    message: duplicate ? "Client onboarding has already been processed." : "Client onboarding completed successfully.",
    driveFolderUrl: "https://drive.google.com/drive/folders/example",
  };
}
