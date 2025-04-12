import { config, config } from "@root/config";
import Logger from "bunyan";
import cloudinary, {
  UploadApiErrorResponse,
  UploadApiResponse,
} from "cloudinary";
const log: Logger = config.createLogger("cloudinary");
export function uploads(
  file: string,
  public_id?: string,
  overwrite?: boolean,
  invalidate?: boolean
): Promise<UploadApiErrorResponse | UploadApiResponse | undefined> {
  return new Promise((resolve) => {
    cloudinary.v2.uploader.upload(
      file,
      {
        public_id,
        overwrite,
        invalidate,
      },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (error) {
          log.error("🚫 Cloudinary upload error: ", error);
          resolve(error);
        } else {
          log.info("✅ Cloudinary upload result: ", result);
          resolve(result);
        }
      }
    );
  });
}
