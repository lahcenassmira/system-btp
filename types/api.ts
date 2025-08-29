export type UploadLogoSuccessResponse = { success: true; logoUrl: string };
export type UploadLogoErrorResponse = { success: false; message: string };
export type UploadLogoResponse = UploadLogoSuccessResponse | UploadLogoErrorResponse;