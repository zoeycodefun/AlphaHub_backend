// public router decorator: used to mark specific routes as public, which means they can be accessed without authentication, and the JWT authentication guard will skip these routes when validating requests
import { SetMetadata } from "@nestjs/common";
export const Public = () => SetMetadata('isPublic', true);
