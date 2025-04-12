/* eslint-disable @typescript-eslint/no-explicit-any */
import { JoiRequestValidationError } from "@global/helpers/error-handler";
import { Request } from "express";
import { ObjectSchema } from "joi";

type IJoiDecorator = (
  target: any,
  key: string,
  descriptor: PropertyDescriptor
) => void;

export function joiValidation(schema: ObjectSchema): IJoiDecorator {
  return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req: Request = args[0];
      try {
        const { error } = await Promise.resolve(
          schema.validate(req.body, {
            // abortEarly: false,
            // allowUnknown: true,
            // stripUnknown: true,
          })
        );

        if (error?.details) {
          const errorMessage = error.details
            .map((detail) => detail.message)
            .join(", ");
          throw new JoiRequestValidationError(errorMessage);
        }
        return originalMethod.apply(this, args);
      } catch (error) {
        // If it's already a JoiRequestValidationError, rethrow
        if (error instanceof JoiRequestValidationError) {
          throw error;
        }
        // If it's some other error, wrap it
        throw new JoiRequestValidationError("Invalid request data");
      }
    };
    return descriptor;
  };
}
