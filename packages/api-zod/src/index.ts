import * as api from "./generated/api";
import * as types from "./generated/types";

// Exportar tudo de api (Zod Schemas)
export * from "./generated/api";

// Exportar apenas os tipos de types para evitar conflito de nomes com as constantes de api
export type {
  User,
  UserCreate,
  Job,
  JobCreate,
  Category,
  HealthStatus,
  Login200,
  LoginBody,
  UserCreateRole,
  UserRole,
  JobStatus,
} from "./generated/types";
